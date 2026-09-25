// Lapisan AI: sintesis kualitatif, hipotesis akar masalah, dan pertanyaan probing.
// Semua output ditandai sebagai draf awal yang wajib divalidasi asesor.

import type { AnyClient } from "./diagnosis.server";
import type { Json } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export class AiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callAi(system: string, user: string): Promise<unknown> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError(401, "Kunci AI belum terpasang pada proyek ini.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new AiError(429, "Permintaan AI terlalu sering. Coba lagi sebentar lagi.");
    if (res.status === 402)
      throw new AiError(402, "Kredit AI workspace habis. Tambahkan kredit untuk melanjutkan.");
    throw new AiError(res.status, `Layanan AI gagal merespons. ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AiError(502, "Format jawaban AI tidak dapat dibaca. Coba lagi.");
  }
}

const GUARDRAILS = `Aturan wajib:
- Kamu adalah asisten asesor psikologi industri & organisasi untuk diagnosis BMT/KSPPS di Indonesia.
- Jangan pernah menyatakan hubungan sebab-akibat sebagai fakta pasti. Selalu tulis sebagai hipotesis yang perlu divalidasi.
- Jangan menyebut nama individu; tetap anonim per peran/sumber.
- Gunakan bahasa Indonesia yang ringkas, konkret, dan profesional.
- Balas HANYA dengan JSON valid sesuai skema yang diminta, tanpa teks lain.`;

export interface QualSnippet {
  source: string;
  role?: string | undefined;
  text: string;
}

/** Deteksi data kualitatif terlalu tipis (jawaban satu-dua kata, dsb.). */
export function isEvidenceThin(snippets: QualSnippet[]) {
  const joined = snippets
    .map((s) => s.text.trim())
    .filter((t) => t.split(/\s+/).length >= 3)
    .join(" ");
  return joined.length < 120 || joined.split(/\s+/).length < 25;
}

export interface DimensionAiInput {
  organizationName: string;
  dimensionId: number;
  dimensionName: string;
  dimensionDescription: string;
  roleScores: { role: string; score: number | null }[];
  gap: number;
  totalRespondents: number;
  snippets: QualSnippet[];
  otherDimensions: { name: string; average: number | null; gap: number }[];
}

export async function generateDimensionInsight(input: DimensionAiInput) {
  if (isEvidenceThin(input.snippets)) {
    return {
      status: "insufficient_evidence" as const,
      message:
        "Data kualitatif belum cukup untuk sintesis. Tambahkan catatan FGD, wawancara, atau komentar terbuka pada dimensi ini.",
    };
  }
  const user = `Organisasi: ${input.organizationName} (${input.totalRespondents} responden kuesioner).
Dimensi ${input.dimensionId} — ${input.dimensionName}: ${input.dimensionDescription}
Skor per peran: ${input.roleScores
    .map((r) => `${r.role}=${r.score != null ? r.score.toFixed(2) : "tidak ada data"}`)
    .join(", ")}. Δ gap persepsi = ${input.gap.toFixed(2)}.
Skor dimensi lain (untuk membaca pola lintas dimensi):
${input.otherDimensions
  .map(
    (d) =>
      `- ${d.name}: rata-rata ${d.average != null ? d.average.toFixed(2) : "—"}, gap ${d.gap.toFixed(2)}`,
  )
  .join("\n")}
Kutipan kualitatif (anonim):
${input.snippets.map((s) => `- [${s.source}${s.role ? ` · ${s.role}` : ""}] ${s.text}`).join("\n")}

Skema JSON yang diminta:
{"status":"ok","summary":"2-4 kalimat benang merah tema kualitatif","hypotheses":[{"title":"...","explanation":"...","related_dimensions":["..."],"confidence":"Rendah|Sedang|Tinggi","validation_questions":["..."]}],"recommendations":[{"title":"...","detail":"...","rationale":"merujuk konteks aktual organisasi"}]}
Berikan 2-3 hipotesis dan 2-3 rekomendasi. Jika kutipan terlalu tipis, balas {"status":"insufficient_evidence","message":"..."}.`;

  const out = await callAi(GUARDRAILS, user);
  return out as
    | { status: "insufficient_evidence"; message: string }
    | {
        status: "ok";
        summary: string;
        hypotheses: {
          title: string;
          explanation: string;
          related_dimensions: string[];
          confidence: string;
          validation_questions: string[];
        }[];
        recommendations: { title: string; detail: string; rationale: string }[];
      };
}

export interface ProbingAiInput {
  organizationName: string;
  dimensionId: number;
  dimensionName: string;
  dimensionDescription: string;
  roleScores: { role: string; score: number | null }[];
  gap: number;
  confidenceLevel: string;
}

export async function generateProbingQuestions(input: ProbingAiInput) {
  const user = `Susun 4-6 pertanyaan probing untuk sesi FGD/wawancara pada dimensi berikut.
Organisasi: ${input.organizationName}.
Dimensi ${input.dimensionId} — ${input.dimensionName}: ${input.dimensionDescription}
Skor per peran: ${input.roleScores
    .map((r) => `${r.role}=${r.score != null ? r.score.toFixed(2) : "tidak ada data"}`)
    .join(", ")}. Δ gap = ${input.gap.toFixed(2)}. Status evidence: ${input.confidenceLevel}.
Pertanyaan harus evidence-based: minta contoh kejadian nyata 12 bulan terakhir, siapa yang terlibat (peran, bukan nama), dampaknya, apa yang sudah dilakukan organisasi, dan apakah tindakan itu menyelesaikan akar masalah atau hanya gejalanya.
Skema JSON: {"status":"ok","questions":[{"question":"...","target":"peran yang paling tepat ditanya","purpose":"apa yang ingin diverifikasi"}]}`;
  const out = await callAi(GUARDRAILS, user);
  return out as {
    status: "ok";
    questions: { question: string; target: string; purpose: string }[];
  };
}

/* ---------- Penyimpanan insight (dapat diedit/dihapus asesor) ---------- */

export interface AiInsightRow {
  id: string;
  organization_id: string;
  dimension: number;
  kind: string;
  content: Json;
  include_in_report: boolean;
  edited_by_asesor: boolean;
  updated_at: string;
}

export async function fetchInsights(client: AnyClient, orgId: string) {
  const { data, error } = await client
    .from("ai_dimension_insights")
    .select("*")
    .eq("organization_id", orgId)
    .order("dimension");
  if (error) throw new Error(error.message);
  return (data ?? []) as AiInsightRow[];
}

export async function upsertInsight(
  client: AnyClient,
  input: {
    organizationId: string;
    dimension: number;
    kind: string;
    content: Json;
    editedByAsesor?: boolean | undefined;
  },
) {
  const { data, error } = await client
    .from("ai_dimension_insights")
    .upsert(
      {
        organization_id: input.organizationId,
        dimension: input.dimension,
        kind: input.kind,
        content: input.content,
        edited_by_asesor: input.editedByAsesor ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,dimension,kind" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as AiInsightRow;
}

export async function setInsightInclusion(
  client: AnyClient,
  input: { id: string; include: boolean },
) {
  const { error } = await client
    .from("ai_dimension_insights")
    .update({ include_in_report: input.include })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteInsight(client: AnyClient, id: string) {
  const { error } = await client.from("ai_dimension_insights").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export interface ExecutiveSummaryAiInput {
  organizationName: string;
  healthIndex: number;
  alignmentIndex: number;
  maturityLabel: string;
  riskExposure: string;
  topPriorities: { dimension: number; name: string; gap: number }[];
  fgdSummary: string[];
}

export async function generateExecutiveSummarySynthesis(input: ExecutiveSummaryAiInput) {
  const user = `Susun sintesis naratif Ringkasan Eksekutif untuk laporan diagnosis organisasi ${input.organizationName}.
Health Index: ${input.healthIndex}/100, Alignment Index: ${input.alignmentIndex}/100.
Tingkat Kematangan: ${input.maturityLabel}, Profil Risk Exposure: ${input.riskExposure}.
Domain Prioritas Utama dengan Gap Persepsi Lebar:
${input.topPriorities.map((p) => `- Dimensi ${p.dimension} (${p.name}): Δ gap ${p.gap.toFixed(2)}`).join("\n")}
Poin Kualitatif Kunci:
${input.fgdSummary.map((s) => `- ${s}`).join("\n")}

Format output JSON yang diminta:
{"status":"ok","executiveNarrative":"3-5 paragraf komprehensif benang merah kondisi organisasi, temuan kunci, serta rekomendasi strategis utama. Bahasa profesional, lugas, dan berfokus pada perbaikan."}`;

  const out = await callAi(GUARDRAILS, user);
  return out as { status: "ok"; executiveNarrative: string };
}
