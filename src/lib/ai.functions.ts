import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  AiError,
  deleteInsight,
  fetchInsights,
  generateDimensionInsight,
  generateProbingQuestions,
  setInsightInclusion,
  upsertInsight,
  type QualSnippet,
} from "./ai.server";
import { createPublicClient, fetchDashboardData, fetchQualitative } from "./diagnosis.server";
import { buildEvidenceMap, computeConfidence, evidenceFor, CONFIDENCE_LABELS } from "./confidence";
import { DIMENSIONS, ROLE_LABELS, type Role } from "./questionnaire";
import { buildDimensionSummaries } from "./report";

async function loadContext(orgId: string, dimension: number) {
  const client = createPublicClient();
  const [dash, qual] = await Promise.all([
    fetchDashboardData(client, orgId),
    fetchQualitative(client, orgId),
  ]);
  const summaries = buildDimensionSummaries(dash.scores);
  const summary = summaries.find((s) => s.id === dimension)!;
  const dim = DIMENSIONS.find((d) => d.id === dimension)!;
  const evidence = buildEvidenceMap({
    scores: dash.scores,
    fgd: qual.fgd,
    interviews: qual.interviews,
    documents: qual.documents,
  });
  const confidence = computeConfidence(evidenceFor(evidence, dimension));
  const roleScores = (["pengurus", "manajemen", "karyawan"] as Role[]).map((r) => ({
    role: ROLE_LABELS[r],
    score: summary.roleScores[r] ?? null,
  }));
  const totalRespondents = new Set(dash.scores.map((s) => `${s.role}`)).size
    ? dash.scores.filter((s) => s.dimension === dimension).reduce((a, s) => a + s.respondents, 0)
    : 0;
  return { client, dash, qual, dim, summary, summaries, confidence, roleScores, totalRespondents };
}

export const listInsights = createServerFn({ method: "GET" })
  .validator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => fetchInsights(createPublicClient(), data.id));

export const buildDimensionInsight = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(10),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const ctx = await loadContext(data.organizationId, data.dimension);
    const snippets: QualSnippet[] = [
      ...ctx.dash.comments
        .filter((c) => c.dimension === data.dimension)
        .map((c) => ({
          source: "Komentar kuesioner",
          role: ROLE_LABELS[c.role],
          text: c.comment,
        })),
      ...ctx.qual.fgd
        .filter((f) => f.dimension === data.dimension)
        .flatMap((f) =>
          [f.themes, f.quotes]
            .filter((t): t is string => !!t?.trim())
            .map((t) => ({ source: "Catatan FGD", role: undefined, text: t })),
        ),
      ...ctx.qual.interviews
        .filter((i) => i.dimension === data.dimension)
        .filter((i) => !!i.findings?.trim())
        .map((i) => ({
          source: "Wawancara",
          role: i.informant_role ?? undefined,
          text: i.findings as string,
        })),
      ...ctx.qual.documents
        .filter((d) => d.dimension === data.dimension)
        .filter((d) => !!d.notes?.trim())
        .map((d) => ({
          source: `Telaah dokumen (${d.doc_type})`,
          role: undefined,
          text: d.notes as string,
        })),
    ];

    try {
      const result = await generateDimensionInsight({
        organizationName: ctx.dash.organization?.name ?? "Organisasi",
        dimensionId: data.dimension,
        dimensionName: ctx.dim.name,
        dimensionDescription: ctx.dim.description,
        roleScores: ctx.roleScores,
        gap: ctx.summary.gap,
        totalRespondents: ctx.totalRespondents,
        snippets,
        otherDimensions: ctx.summaries
          .filter((s) => s.id !== data.dimension)
          .map((s) => ({ name: s.name, average: s.average, gap: s.gap })),
      });
      if (result.status !== "ok") return result;
      const row = await upsertInsight(ctx.client, {
        organizationId: data.organizationId,
        dimension: data.dimension,
        kind: "insight",
        content: result,
      });
      return { status: "ok" as const, row };
    } catch (e) {
      if (e instanceof AiError) return { status: "error" as const, message: e.message };
      throw e;
    }
  });

export const buildProbingQuestions = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(10),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const ctx = await loadContext(data.organizationId, data.dimension);
    try {
      const result = await generateProbingQuestions({
        organizationName: ctx.dash.organization?.name ?? "Organisasi",
        dimensionId: data.dimension,
        dimensionName: ctx.dim.name,
        dimensionDescription: ctx.dim.description,
        roleScores: ctx.roleScores,
        gap: ctx.summary.gap,
        confidenceLevel: CONFIDENCE_LABELS[ctx.confidence.level],
      });
      const row = await upsertInsight(ctx.client, {
        organizationId: data.organizationId,
        dimension: data.dimension,
        kind: "probing",
        content: result,
      });
      return { status: "ok" as const, row };
    } catch (e) {
      if (e instanceof AiError) return { status: "error" as const, message: e.message };
      throw e;
    }
  });

export const saveInsightEdit = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(10),
        kind: z.enum(["insight", "probing"]),
        content: z.any(),
      })
      .parse(data),
  )
  .handler(({ data }) =>
    upsertInsight(createPublicClient(), {
      organizationId: data.organizationId,
      dimension: data.dimension,
      kind: data.kind,
      content: data.content,
      editedByAsesor: true,
    }),
  );

export const toggleInsightInReport = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string().uuid(), include: z.boolean() }).parse(data))
  .handler(({ data }) => setInsightInclusion(createPublicClient(), data));

export const removeInsight = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => deleteInsight(createPublicClient(), data.id));
