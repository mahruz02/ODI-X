import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien publik sisi server (publishable key, tanpa sesi).
 * Hanya dipakai untuk: (1) mencari organisasi berdasarkan kode tautan publik,
 * (2) memasukkan jawaban kuesioner. Tabel responses terkunci RLS insert-only
 * untuk anon, sehingga tautan publik tidak bisa dipakai membaca jawaban.
 */
export function createPublicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
      db: { schema: "public" },
    },
  );
}

export type AnyClient = SupabaseClient<any, any, any>;

export interface Organization {
  id: string;
  name: string;
  code: string;
  started_on: string;
  status: string;
}

export interface DimensionScoreRow {
  organization_id: string;
  organization_name: string;
  dimension: number;
  role: "pengurus" | "manajemen" | "karyawan";
  avg_score: number;
  respondents: number;
}

export interface CommentRow {
  organization_id: string;
  organization_name: string;
  dimension: number;
  role: "pengurus" | "manajemen" | "karyawan";
  comment: string;
}

export interface TriangulationCellRow {
  organization_id: string;
  dimension: number;
  source: string;
  n: number;
}

/* ---------- Publik (tanpa login) ---------- */

export async function fetchOrganizationByCode(code: string) {
  const { data, error } = await createPublicClient()
    .from("organizations")
    .select("id, name, code, status")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Pick<Organization, "id" | "name" | "code" | "status"> | null;
}

export interface AnswerInput {
  dimension: number;
  questionId: string;
  score: number;
  comment?: string | undefined;
}

export async function insertResponses(input: {
  code: string;
  role: "pengurus" | "manajemen" | "karyawan";
  name?: string | undefined;
  tenure?: string | undefined;
  answers: AnswerInput[];
}) {
  const org = await fetchOrganizationByCode(input.code);
  if (!org) throw new Error("Kode tautan tidak dikenali.");
  const respondentId = crypto.randomUUID();
  const rows = input.answers.map((a) => ({
    organization_id: org.id,
    role: input.role,
    respondent_id: respondentId,
    respondent_name: input.name?.trim() ? input.name.trim() : null,
    tenure: input.tenure ?? null,
    dimension: a.dimension,
    question_id: a.questionId,
    score: a.score,
    comment: a.comment?.trim() ? a.comment.trim() : null,
  }));
  const { error } = await createPublicClient().from("responses").insert(rows);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/* ---------- Admin (terautentikasi) ---------- */

export async function fetchProjects(client: AnyClient) {
  const [orgs, progress] = await Promise.all([
    client
      .from("organizations")
      .select("id, name, code, started_on, status")
      .order("created_at", { ascending: false }),
    client.from("organization_progress").select("*"),
  ]);
  if (orgs.error) throw new Error(orgs.error.message);
  if (progress.error) throw new Error(progress.error.message);
  return {
    organizations: (orgs.data ?? []) as Organization[],
    progress: (progress.data ?? []) as {
      organization_id: string;
      role: string | null;
      respondents: number;
    }[],
  };
}

export async function createProject(
  client: AnyClient,
  input: { name: string; startedOn?: string | undefined },
) {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  const code = `${slug || "bmt"}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await client
    .from("organizations")
    .insert({
      name: input.name.trim(),
      code,
      ...(input.startedOn ? { started_on: input.startedOn } : {}),
    })
    .select("id, name, code, started_on, status")
    .single();
  if (error) throw new Error(error.message);
  return data as Organization;
}

export async function updateProjectStatus(
  client: AnyClient,
  input: { id: string; status: string },
) {
  const { error } = await client
    .from("organizations")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function fetchDashboardData(client: AnyClient, orgId: string) {
  const [org, scores, comments] = await Promise.all([
    client
      .from("organizations")
      .select("id, name, code, started_on, status")
      .eq("id", orgId)
      .maybeSingle(),
    client.from("dimension_scores").select("*").eq("organization_id", orgId),
    client.from("dimension_comments").select("*").eq("organization_id", orgId),
  ]);
  if (org.error) throw new Error(org.error.message);
  if (scores.error) throw new Error(scores.error.message);
  if (comments.error) throw new Error(comments.error.message);
  return {
    organization: org.data as Organization | null,
    scores: (scores.data ?? []) as DimensionScoreRow[],
    comments: (comments.data ?? []) as CommentRow[],
  };
}

export async function fetchTriangulationData(client: AnyClient, orgId: string) {
  const [org, cells] = await Promise.all([
    client
      .from("organizations")
      .select("id, name, code, started_on, status")
      .eq("id", orgId)
      .maybeSingle(),
    client.from("triangulation_cells").select("*").eq("organization_id", orgId),
  ]);
  if (org.error) throw new Error(org.error.message);
  if (cells.error) throw new Error(cells.error.message);
  return {
    organization: org.data as Organization | null,
    cells: (cells.data ?? []) as TriangulationCellRow[],
  };
}

/* ---------- Data kualitatif (FGD, wawancara, telaah dokumen) ---------- */

export interface FgdNote {
  id: string;
  organization_id: string;
  dimension: number;
  facilitator: string | null;
  themes: string | null;
  quotes: string | null;
  consensus: number | null;
  status: string;
  updated_at: string;
}

export interface InterviewNote {
  id: string;
  organization_id: string;
  dimension: number;
  informant_role: string | null;
  findings: string | null;
  status: string;
  updated_at: string;
}

export interface DocumentReview {
  id: string;
  organization_id: string;
  dimension: number;
  doc_type: string;
  doc_status: string;
  score: number | null;
  notes: string | null;
  updated_at: string;
}

export async function fetchQualitative(client: AnyClient, orgId: string) {
  const [org, fgd, interviews, docs] = await Promise.all([
    client
      .from("organizations")
      .select("id, name, code, started_on, status")
      .eq("id", orgId)
      .maybeSingle(),
    client
      .from("fgd_notes")
      .select("*")
      .eq("organization_id", orgId)
      .order("dimension"),
    client
      .from("interview_notes")
      .select("*")
      .eq("organization_id", orgId)
      .order("dimension"),
    client
      .from("document_reviews")
      .select("*")
      .eq("organization_id", orgId)
      .order("dimension"),
  ]);
  for (const r of [org, fgd, interviews, docs]) {
    if (r.error) throw new Error(r.error.message);
  }
  return {
    organization: org.data as Organization | null,
    fgd: (fgd.data ?? []) as FgdNote[],
    interviews: (interviews.data ?? []) as InterviewNote[],
    documents: (docs.data ?? []) as DocumentReview[],
  };
}

export async function saveFgdNote(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    facilitator?: string | undefined;
    themes?: string | undefined;
    quotes?: string | undefined;
    consensus?: number | undefined;
    status: string;
  },
) {
  const { error } = await client.from("fgd_notes").insert({
    organization_id: input.organizationId,
    dimension: input.dimension,
    facilitator: input.facilitator?.trim() || null,
    themes: input.themes?.trim() || null,
    quotes: input.quotes?.trim() || null,
    consensus: input.consensus ?? null,
    status: input.status,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function saveInterviewNote(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    informantRole?: string | undefined;
    findings?: string | undefined;
    status: string;
  },
) {
  const { error } = await client.from("interview_notes").insert({
    organization_id: input.organizationId,
    dimension: input.dimension,
    informant_role: input.informantRole?.trim() || null,
    findings: input.findings?.trim() || null,
    status: input.status,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function saveDocumentReview(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    docType: string;
    docStatus: string;
    score?: number | undefined;
    notes?: string | undefined;
  },
) {
  const { error } = await client.from("document_reviews").insert({
    organization_id: input.organizationId,
    dimension: input.dimension,
    doc_type: input.docType.trim(),
    doc_status: input.docStatus,
    score: input.score ?? null,
    notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteQualitativeEntry(
  client: AnyClient,
  input: { table: "fgd_notes" | "interview_notes" | "document_reviews"; id: string },
) {
  const { error } = await client.from(input.table).delete().eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/* ---------- Penghapusan data ---------- */

export async function deleteProject(client: AnyClient, id: string) {
  const { error } = await client.from("organizations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export interface RespondentRow {
  respondent_id: string;
  role: string;
  name: string | null;
  tenure: string | null;
  answers: number;
  submitted_at: string;
}

export async function fetchRespondents(client: AnyClient, orgId: string) {
  const { data, error } = await client
    .from("responses")
    .select("respondent_id, role, respondent_name, tenure, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const map = new Map<string, RespondentRow>();
  for (const r of (data ?? []) as {
    respondent_id: string;
    role: string;
    respondent_name: string | null;
    tenure: string | null;
    created_at: string;
  }[]) {
    const prev = map.get(r.respondent_id);
    if (prev) {
      prev.answers += 1;
    } else {
      map.set(r.respondent_id, {
        respondent_id: r.respondent_id,
        role: r.role,
        name: r.respondent_name,
        tenure: r.tenure,
        answers: 1,
        submitted_at: r.created_at,
      });
    }
  }
  return [...map.values()];
}

export async function deleteRespondent(
  client: AnyClient,
  input: { organizationId: string; respondentId: string },
) {
  const { error } = await client
    .from("responses")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("respondent_id", input.respondentId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteResponsesByRole(
  client: AnyClient,
  input: { organizationId: string; role: string },
) {
  const { error } = await client
    .from("responses")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("role", input.role);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}
