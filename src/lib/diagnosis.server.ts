import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type SeedRole = "admin" | "hr";

export async function seedAdminAccounts() {
  const defaultUsers = [
    {
      email: "admin@odix.id",
      password: "Admin123!",
      name: "Admin ODI-X",
      role: "admin",
    },
    {
      email: "hr@odix.id",
      password: "Hr123456!",
      name: "HR Organisasi",
      role: "hr",
    },
  ];

  const results = [];

  for (const user of defaultUsers) {
    // Check if user already exists
    const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingList?.users?.find((u) => u.email === user.email);

    if (existing) {
      // Update password & metadata
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: user.password,
        user_metadata: { name: user.name, role: user.role },
        email_confirm: true,
      });

      // Upsert profile
      await supabaseAdmin.from("user_profiles").upsert({
        id: existing.id,
        email: user.email,
        name: user.name,
        role: user.role as SeedRole,
      });

      results.push({ email: user.email, status: "updated", role: user.role });
    } else {
      // Create user directly with auto email_confirm
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role },
      });

      if (!error && newUser.user) {
        await supabaseAdmin.from("user_profiles").upsert({
          id: newUser.user.id,
          email: user.email,
          name: user.name,
          role: user.role as SeedRole,
        });
        results.push({ email: user.email, status: "created", role: user.role });
      } else {
        results.push({ email: user.email, status: "error", error: error?.message });
      }
    }
  }

  return results;
}

export function createPublicClient() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: "public" },
  });
}

export type AnyClient = SupabaseClient<Database>;

export interface Organization {
  id: string;
  name: string;
  code: string;
  started_on: string;
  status: string;
  sector?: string;
  employee_count?: number;
  main_products?: string;
  strengths?: string;
  challenges?: string;
  priorities_12m?: string;
  instrument?: string;
  scheduled_start?: string;
  scheduled_end?: string;
}

export interface DimensionScoreRow {
  organization_id: string;
  organization_name: string;
  dimension: number;
  role: "pengurus" | "manajemen" | "karyawan" | "stakeholder";
  avg_score: number;
  respondents: number;
}

export interface CommentRow {
  organization_id: string;
  organization_name: string;
  dimension: number;
  role: "pengurus" | "manajemen" | "karyawan" | "stakeholder";
  comment: string;
}

export interface TriangulationCellRow {
  organization_id: string;
  dimension: number;
  source: string;
  n: number;
}

export interface AnswerInput {
  dimension: number;
  questionId: string;
  score: number;
  isNa?: boolean;
  evidenceText?: string;
  conflictText?: string;
  comment?: string;
}

/* ---------- Publik (tanpa login) ---------- */

const demoEnabled = process.env["ODIX_ENABLE_DEMO"] === "true";

export async function fetchOrganizationByCode(code: string) {
  try {
    const { data, error } = await createPublicClient()
      .from("organizations")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (!error && data) return data as Organization;
  } catch {
    /* fallback below */
  }

  if (!demoEnabled) throw new Error("Organization lookup unavailable");
  return DEMO_ORGANIZATIONS.find((o) => o.code === code) ?? null;
}

export async function fetchLinkByToken(token: string) {
  try {
    const { data, error } = await createPublicClient()
      .from("respondent_links")
      .select("*, organizations(*)")
      .eq("token", token)
      .maybeSingle();
    if (!error && data) return data;
  } catch {
    /* fallback below */
  }

  return null;
}

export async function insertResponses(input: {
  code: string;
  role: "pengurus" | "manajemen" | "karyawan" | "stakeholder";
  name?: string;
  tenure?: string;
  answers: AnswerInput[];
}) {
  try {
    const org = await fetchOrganizationByCode(input.code);
    if (org && org.id !== DEMO_ORG_ID) {
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
        is_na: a.isNa ?? false,
        evidence_text: a.evidenceText?.trim() || null,
        conflict_text: a.conflictText?.trim() || null,
        comment: a.comment?.trim() ? a.comment.trim() : null,
      }));
      const { error } = await createPublicClient().from("responses").insert(rows);
      if (!error) return { ok: true as const };
    }
  } catch {
    /* fallback demo response submit below */
  }

  if (!demoEnabled) throw new Error("Response submission unavailable");
  return { ok: true as const };
}

/* ---------- Mock Demo Fallback Data ---------- */

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: DEMO_ORG_ID,
    name: "BMT Amanah Sejahtera (Demo)",
    code: "demo-bmt",
    started_on: new Date().toISOString().split("T")[0]!,
    status: "berjalan",
    sector: "Lembaga Keuangan Mikro Syariah / BMT",
    employee_count: 42,
    main_products: "Simpanan Syariah & Pembiayaan Murabahah/Mudharabah",
    strengths: "Loyalitas anggota tinggi, reputasi syariah kuat di masyarakat lokal.",
    challenges: "NPF pembiayaan mikro meningkat, integrasi sistem core-banking belum optimal.",
    priorities_12m: "Restrukturisasi SOP risiko pembiayaan & percepatan digitalisasi layanan.",
  },
];

const DEMO_SCORES: DimensionScoreRow[] = Array.from({ length: 12 }, (_, i) => {
  const dim = i + 1;
  return [
    {
      organization_id: DEMO_ORG_ID,
      organization_name: "BMT Amanah Sejahtera (Demo)",
      dimension: dim,
      role: "pengurus" as const,
      avg_score: 4.1 + (dim % 3) * 0.2,
      respondents: 5,
    },
    {
      organization_id: DEMO_ORG_ID,
      organization_name: "BMT Amanah Sejahtera (Demo)",
      dimension: dim,
      role: "manajemen" as const,
      avg_score: 3.6 + (dim % 4) * 0.2,
      respondents: 8,
    },
    {
      organization_id: DEMO_ORG_ID,
      organization_name: "BMT Amanah Sejahtera (Demo)",
      dimension: dim,
      role: "karyawan" as const,
      avg_score: 3.2 + (dim % 2) * 0.3,
      respondents: 24,
    },
    {
      organization_id: DEMO_ORG_ID,
      organization_name: "BMT Amanah Sejahtera (Demo)",
      dimension: dim,
      role: "stakeholder" as const,
      avg_score: 3.9 + (dim % 3) * 0.15,
      respondents: 15,
    },
  ];
}).flat();

const DEMO_COMMENTS: CommentRow[] = [
  {
    organization_id: DEMO_ORG_ID,
    organization_name: "BMT Amanah Sejahtera (Demo)",
    dimension: 1,
    role: "karyawan",
    comment: "Visi pengurus belum sepenuhnya tersosialisasi ke unit cabang pelaksana.",
  },
  {
    organization_id: DEMO_ORG_ID,
    organization_name: "BMT Amanah Sejahtera (Demo)",
    dimension: 4,
    role: "manajemen",
    comment: "SOP manajemen risiko pembiayaan memerlukan pembaruan sesuai standar DSN-MUI.",
  },
  {
    organization_id: DEMO_ORG_ID,
    organization_name: "BMT Amanah Sejahtera (Demo)",
    dimension: 7,
    role: "karyawan",
    comment: "Pelatihan kompetensi AO/marketing masih terbatas pada saat onboarding awal saja.",
  },
];

/* ---------- Admin & Analyst (terautentikasi) ---------- */

export async function fetchProjects(client: AnyClient) {
  try {
    const [orgs, progress] = await Promise.all([
      client.from("organizations").select("*").order("created_at", { ascending: false }),
      client.from("organization_progress").select("*"),
    ]);

    if (!orgs.error && orgs.data && orgs.data.length > 0) {
      return {
        organizations: orgs.data as Organization[],
        progress: (progress.data ?? []) as {
          organization_id: string;
          role: string | null;
          respondents: number;
        }[],
      };
    }
  } catch {
    /* fallback to demo data below */
  }

  return {
    organizations: DEMO_ORGANIZATIONS,
    progress: [
      { organization_id: DEMO_ORG_ID, role: "pengurus", respondents: 5 },
      { organization_id: DEMO_ORG_ID, role: "manajemen", respondents: 8 },
      { organization_id: DEMO_ORG_ID, role: "karyawan", respondents: 24 },
      { organization_id: DEMO_ORG_ID, role: "stakeholder", respondents: 15 },
    ],
  };
}

export async function createProject(
  client: AnyClient,
  input: {
    name: string;
    startedOn?: string;
    sector?: string;
    employeeCount?: number;
    mainProducts?: string;
    strengths?: string;
    challenges?: string;
    priorities12m?: string;
    instrument?: string;
    scheduledEnd?: string;
  },
) {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  const code = `${slug || "bmt"}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { data, error } = await client
      .from("organizations")
      .insert({
        name: input.name.trim(),
        code,
        ...(input.startedOn ? { started_on: input.startedOn } : {}),
        ...(input.sector ? { sector: input.sector } : {}),
        ...(input.employeeCount ? { employee_count: input.employeeCount } : {}),
        ...(input.mainProducts ? { main_products: input.mainProducts } : {}),
        ...(input.strengths ? { strengths: input.strengths } : {}),
        ...(input.challenges ? { challenges: input.challenges } : {}),
        ...(input.priorities12m ? { priorities_12m: input.priorities12m } : {}),
        ...(input.instrument ? { instrument: input.instrument } : {}),
        ...(input.scheduledEnd ? { scheduled_end: input.scheduledEnd } : {}),
      } as never)
      .select("*")
      .single();
    if (!error && data) return data as Organization;
  } catch {
    /* fallback to local demo array addition */
  }

  const newOrg: Organization = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    code,
    started_on: input.startedOn || new Date().toISOString().split("T")[0]!,
    status: "berjalan",
    sector: input.sector || "Lembaga Keuangan Mikro Syariah / BMT",
    employee_count: input.employeeCount || 25,
    main_products: input.mainProducts || "Simpanan & Pembiayaan Syariah",
    strengths: input.strengths || "",
    challenges: input.challenges || "",
    priorities_12m: input.priorities12m || "",
  };

  DEMO_ORGANIZATIONS.unshift(newOrg);
  return newOrg;
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
  try {
    const [org, scores, comments] = await Promise.all([
      client.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      client.from("dimension_scores").select("*").eq("organization_id", orgId),
      client.from("dimension_comments").select("*").eq("organization_id", orgId),
    ]);

    if (!org.error && org.data) {
      return {
        organization: org.data as Organization,
        scores: (scores.data ?? []) as DimensionScoreRow[],
        comments: (comments.data ?? []) as CommentRow[],
      };
    }
  } catch {
    /* fallback below */
  }

  const matchedOrg = DEMO_ORGANIZATIONS.find((o) => o.id === orgId) || DEMO_ORGANIZATIONS[0]!;
  return {
    organization: matchedOrg,
    scores: DEMO_SCORES,
    comments: DEMO_COMMENTS,
  };
}

export async function fetchTriangulationData(client: AnyClient, orgId: string) {
  try {
    const [org, cells] = await Promise.all([
      client.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      client.from("triangulation_cells").select("*").eq("organization_id", orgId),
    ]);
    if (!org.error && org.data) {
      return {
        organization: org.data as Organization,
        cells: (cells.data ?? []) as TriangulationCellRow[],
      };
    }
  } catch {
    /* fallback below */
  }

  const matchedOrg = DEMO_ORGANIZATIONS.find((o) => o.id === orgId) || DEMO_ORGANIZATIONS[0]!;
  return {
    organization: matchedOrg,
    cells: [],
  };
}

/* ---------- Data kualitatif & kuantitatif (FGD, wawancara, telaah dokumen, metrics) ---------- */

export interface QuantitativeMetric {
  id: string;
  organization_id: string;
  dimension: number;
  metric_name: string;
  target_val: string | null;
  actual_val: string | null;
  unit: string | null;
  period: string | null;
  data_source: string | null;
  confidence_level: "tipis" | "cukup" | "kuat";
  updated_at: string;
}

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
  confidence_level?: "tipis" | "cukup" | "kuat";
  notes: string | null;
  updated_at: string;
}

export async function fetchQualitative(client: AnyClient, orgId: string) {
  try {
    const [org, fgd, interviews, docs, metrics] = await Promise.all([
      client.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      client
        .from("fgd_notes")
        .select("*")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false }),
      client
        .from("interview_notes")
        .select("*")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false }),
      client
        .from("document_reviews")
        .select("*")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false }),
      client
        .from("quantitative_metrics")
        .select("*")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false }),
    ]);

    if (!org.error && org.data) {
      return {
        organization: org.data as Organization,
        fgd: (fgd.data ?? []) as FgdNote[],
        interviews: (interviews.data ?? []) as InterviewNote[],
        documents: (docs.data ?? []) as DocumentReview[],
        metrics: (metrics.data ?? []) as QuantitativeMetric[],
      };
    }
  } catch {
    /* fallback below */
  }

  const matchedOrg = DEMO_ORGANIZATIONS.find((o) => o.id === orgId) || DEMO_ORGANIZATIONS[0]!;
  return {
    organization: matchedOrg,
    fgd: [],
    interviews: [],
    documents: [],
    metrics: [],
  };
}

export async function saveFgdNote(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    facilitator?: string;
    themes?: string;
    quotes?: string;
    consensus?: number;
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
    informantRole?: string;
    findings?: string;
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
    score?: number;
    confidenceLevel?: "tipis" | "cukup" | "kuat";
    notes?: string;
  },
) {
  const { error } = await client.from("document_reviews").insert({
    organization_id: input.organizationId,
    dimension: input.dimension,
    doc_type: input.docType.trim(),
    doc_status: input.docStatus,
    score: input.score ?? null,
    confidence_level: (input.confidenceLevel ?? "cukup") as never,
    notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function saveQuantitativeMetric(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    metricName: string;
    targetVal?: string;
    actualVal?: string;
    unit?: string;
    period?: string;
    dataSource?: string;
    confidenceLevel?: "tipis" | "cukup" | "kuat";
  },
) {
  const { error } = await client.from("quantitative_metrics").insert({
    organization_id: input.organizationId,
    dimension: input.dimension,
    metric_name: input.metricName.trim(),
    target_val: input.targetVal?.trim() || null,
    actual_val: input.actualVal?.trim() || null,
    unit: input.unit?.trim() || null,
    period: input.period?.trim() || null,
    data_source: input.dataSource?.trim() || null,
    confidence_level: input.confidenceLevel ?? "cukup",
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteQualitativeEntry(
  client: AnyClient,
  input: {
    table: "fgd_notes" | "interview_notes" | "document_reviews" | "quantitative_metrics";
    id: string;
  },
) {
  const { error } = await client.from(input.table).delete().eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/* ---------- Penghapusan data ---------- */

export async function deleteProject(client: AnyClient, id: string) {
  try {
    await client.from("organizations").delete().eq("id", id);
  } catch {
    /* fallback demo delete */
  }

  const idx = DEMO_ORGANIZATIONS.findIndex((o) => o.id === id);
  if (idx !== -1) {
    DEMO_ORGANIZATIONS.splice(idx, 1);
  }
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

/* ---------- Respondent Token Links (§6 instructions.md) ---------- */

export interface RespondentLink {
  id: string;
  organization_id: string;
  project_id?: string;
  token: string;
  perspective: "pengurus" | "manajemen" | "karyawan" | "stakeholder";
  respondent_name: string | null;
  respondent_email: string | null;
  status: "invited" | "in_progress" | "completed";
  submitted_at: string | null;
  created_at: string;
}

export async function fetchRespondentLinks(client: AnyClient, orgId: string) {
  const { data, error } = await client
    .from("respondent_links")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RespondentLink[];
}

export async function createRespondentLink(
  client: AnyClient,
  input: {
    organizationId: string;
    perspective: "pengurus" | "manajemen" | "karyawan" | "stakeholder";
    respondentName?: string;
    respondentEmail?: string;
  },
) {
  const { data, error } = await client
    .from("respondent_links")
    .insert({
      organization_id: input.organizationId,
      perspective: input.perspective,
      respondent_name: input.respondentName?.trim() || null,
      respondent_email: input.respondentEmail?.trim() || null,
      status: "invited",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RespondentLink;
}

export async function submitResponsesWithToken(input: {
  token: string;
  name?: string;
  tenure?: string;
  answers: AnswerInput[];
}) {
  const link = await fetchLinkByToken(input.token);
  if (!link) {
    // Fallback: try organization code lookup
    const org = await fetchOrganizationByCode(input.token);
    if (!org) throw new Error("Tautan pengisian tidak valid atau telah kadaluwarsa.");
    return insertResponses({
      code: input.token,
      role: "karyawan",
      name: input.name,
      tenure: input.tenure,
      answers: input.answers,
    });
  }

  if (link.status === "completed") {
    throw new Error("Tautan pengisian ini telah digunakan dan sudah selesai.");
  }

  const { error } = await createPublicClient().rpc("submit_token_responses", {
    payload: {
      token: input.token,
      name: input.name?.trim() || link.respondent_name || "",
      tenure: input.tenure ?? "",
      answers: input.answers,
    },
  });

  if (error) throw new Error(error.message);
  return { ok: true as const };
}
