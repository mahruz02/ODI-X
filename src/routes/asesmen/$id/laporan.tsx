import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Printer,
  ShieldCheck,
  Activity,
  Target,
  Layers,
  LayoutGrid,
  List,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AssessmentNavTabs } from "@/components/AssessmentNavTabs";
import { HRDevelopmentPlan } from "@/components/HRDevelopmentPlan";
import { RadarTriChart, type RadarDatum } from "@/components/RadarTriChart";
import { KanbanRoadmap } from "@/components/KanbanRoadmap";
import { getDashboardData, getQualitativeData } from "@/lib/admin.functions";
import {
  DIRECTION_BADGE_CLASS,
  PRIORITY_CLASS,
  PRIORITY_LABELS,
  ROLES,
  buildDimensionSummaries,
  buildRecommendations,
  computeCompositeIndices,
  generatePublicReportToken,
  type DimensionSummary,
  type Recommendation,
} from "@/lib/report";
import { DIMENSIONS, GAP_LABELS, ROLE_LABELS } from "@/lib/questionnaire";
import type {
  CommentRow,
  DocumentReview,
  FgdNote,
  InterviewNote,
  QuantitativeMetric,
} from "@/lib/diagnosis.server";

const dashboardQuery = (id: string) =>
  queryOptions({
    queryKey: ["dashboard", id],
    queryFn: () => getDashboardData({ data: { id } }),
  });

const qualitativeQuery = (id: string) =>
  queryOptions({
    queryKey: ["kualitatif", id],
    queryFn: () => getQualitativeData({ data: { id } }),
  });

export const Route = createFileRoute("/asesmen/$id/laporan")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(dashboardQuery(params.id)),
      context.queryClient.ensureQueryData(qualitativeQuery(params.id)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Laporan Diagnosis & Roadmap Perbaikan — ODI-X" },
      {
        name: "description",
        content:
          "Laporan eksekutif diagnosis 12 domain: skor kesehatan, alignment index, maturity level, 7 arah tindakan, dan roadmap 4 horizon waktu.",
      },
      { property: "og:title", content: "Laporan Diagnosis Organisasi — ODI-X" },
      {
        property: "og:description",
        content:
          "Laporan komprehensif 12 domain, gap persepsi 4 level, bukti kualitatif/kuantitatif, dan roadmap 4 horizon.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

const GAP_BADGE_CLASS = {
  high: "badge-gap-high",
  mid: "badge-gap-mid",
  low: "badge-gap-low",
} as const;

function ReportPage() {
  const { id } = Route.useParams();
  const { data: dash } = useSuspenseQuery(dashboardQuery(id));
  const { data: qual } = useSuspenseQuery(qualitativeQuery(id));

  const summaries = useMemo(() => buildDimensionSummaries(dash.scores), [dash.scores]);
  const indices = useMemo(() => computeCompositeIndices(summaries), [summaries]);
  const recommendations = useMemo(() => buildRecommendations(summaries), [summaries]);
  const [audience, setAudience] = useState<
    "lengkap" | "eksekutif" | "kepemimpinan" | "sdm" | "risiko"
  >("lengkap");
  const [shareCopied, setShareCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const filteredRecommendations = useMemo(() => {
    if (audience === "eksekutif") return recommendations.filter((r) => r.priority === "mendesak");
    if (audience === "sdm")
      return recommendations.filter((r) => [4, 5, 6, 7, 10].includes(r.dimension));
    if (audience === "risiko")
      return recommendations.filter((r) => [3, 9, 11].includes(r.dimension));
    if (audience === "kepemimpinan")
      return recommendations.filter((r) => [1, 2, 3, 5, 12].includes(r.dimension));
    return recommendations;
  }, [recommendations, audience]);

  const radarData: RadarDatum[] = summaries.map((s) => ({
    label: s.short,
    pengurus: s.roleScores.pengurus ?? null,
    manajemen: s.roleScores.manajemen ?? null,
    karyawan: s.roleScores.karyawan ?? null,
    stakeholder: s.roleScores.stakeholder ?? null,
  }));

  const respondents = useMemo(() => {
    const perRole = new Map<string, number>();
    for (const row of dash.scores) {
      perRole.set(row.role, Math.max(perRole.get(row.role) ?? 0, row.respondents));
    }
    return [...perRole.values()].reduce((a, b) => a + b, 0);
  }, [dash.scores]);

  const orgName = dash.organization?.name ?? "Organisasi";
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fgdWithQuotes = qual.fgd.filter((f) => f.quotes?.trim() || f.themes?.trim());
  const interviewsWithFindings = qual.interviews.filter((i) => i.findings?.trim());

  function downloadMarkdown() {
    const md = buildMarkdown({
      orgName,
      today,
      respondents,
      indices,
      summaries,
      recommendations,
      comments: dash.comments,
      fgd: fgdWithQuotes,
      interviews: interviewsWithFindings,
      documents: qual.documents,
      metrics: qual.metrics,
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-diagnosis-odix-${dash.organization?.code ?? id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 print:max-w-none print:px-0 print:py-0 sm:px-6 animate-fade-in">
        <div className="no-print mb-4">
          <Link
            to="/asesmen/$id"
            params={{ id }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            ← Dashboard {orgName}
          </Link>
        </div>

        <div className="no-print">
          <AssessmentNavTabs id={id} />
        </div>

        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-muted-foreground mr-1">Audiens Laporan:</span>
            {(["lengkap", "eksekutif", "kepemimpinan", "sdm", "risiko"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={`rounded-xl border px-3 py-1.5 capitalize transition-all ${
                  audience === a
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const token = generatePublicReportToken(id, 30);
                const readOnlyUrl = `${window.location.origin}/asesmen/${id}/laporan?token=${token}`;
                void navigator.clipboard.writeText(readOnlyUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-xs font-bold transition-colors hover:bg-muted"
            >
              <ShieldCheck className="size-3.5 text-primary" />
              {shareCopied
                ? "Link Read-Only (30 Hari) Tersalin!"
                : "Bagikan Laporan Read-Only (30 Hari)"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
            >
              <Printer className="size-4" /> Cetak Laporan PDF
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-xs font-bold transition-colors hover:bg-muted"
            >
              <Download className="size-4" /> Ekspor Markdown
            </button>
          </div>
        </div>

        {/* Header Laporan */}
        <header className="mb-8 border-b pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Laporan Eksekutif Diagnosis Organisasi (ODI-X)
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {orgName}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">
                Disusun {today} · Sample: {respondents} responden · Triangulasi Persepsi 4
                Prespektif, Data Kuantitatif & Dokumen Pendukung.
              </p>
            </div>
          </div>
        </header>

        {/* 1. Executive Summary & Composite Indices */}
        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            1. Ringkasan Eksekutif & Indeks Kesehatan Komposit
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold">Health Index</span>
              <p className="text-2xl font-extrabold text-primary tabular-nums mt-1">
                {indices.healthIndex}/100
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Skor kesehatan agregat 12 domain
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold">Alignment Index</span>
              <p className="text-2xl font-extrabold text-foreground tabular-nums mt-1">
                {indices.alignmentIndex}/100
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Keselarasan persepsi 4 level</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold">Maturity Level</span>
              <p className="text-xl font-extrabold text-foreground tabular-nums mt-1">
                {indices.maturityLabel}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Tingkat kematangan organisasi
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold">Risk Exposure</span>
              <p className="text-2xl font-extrabold text-destructive tabular-nums mt-1">
                {indices.riskExposure}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Status paparan risiko internal
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 text-xs leading-relaxed shadow-sm print:shadow-none">
            <p>
              Berdasarkan pengolahan data kuesioner diagnosis 12 domain, kesehatan organisasi{" "}
              <strong>{orgName}</strong> berada pada tingkat kematangan{" "}
              <strong>{indices.maturityLabel}</strong> dengan{" "}
              <strong>Health Index {indices.healthIndex}/100</strong> dan{" "}
              <strong>Alignment Index {indices.alignmentIndex}/100</strong>.
            </p>
            <p className="mt-2">
              Readiness for Change score tercatat <strong>{indices.readinessScore}/100</strong>.
              Temuan mengindikasikan perlunya tindak lanjut cepat pada domain dengan gap persepsi
              antar level yang lebar guna menyelaraskan ekspektasi sebelum rekomendasi operasional
              dijalankan.
            </p>
          </div>
        </section>

        {/* 2. Radar 12 Dimensi */}
        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            2. Peta Radar 12 Domain — Perbandingan 4 Level
          </h2>
          <div className="rounded-2xl border bg-card p-4 shadow-sm print:shadow-none">
            <RadarTriChart data={radarData} />
          </div>
        </section>

        {/* 3. Matrix 12 Domain */}
        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            3. Ringkasan Skor & Gap Persepsi 12 Domain
          </h2>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm print:shadow-none">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 uppercase tracking-wide text-muted-foreground font-bold">
                <tr>
                  <th className="px-3 py-2.5 text-left">Domain</th>
                  <th className="px-3 py-2.5 text-right">Leadership</th>
                  <th className="px-3 py-2.5 text-right">Manager</th>
                  <th className="px-3 py-2.5 text-right">Employee</th>
                  <th className="px-3 py-2.5 text-right">Stakeholder</th>
                  <th className="px-3 py-2.5 text-right">Index (0-100)</th>
                  <th className="px-3 py-2.5 text-right">Gap Δ</th>
                  <th className="px-3 py-2.5 text-left">Status Persepsi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaries.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 font-semibold">
                      {s.id}. {s.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.roleScores.pengurus != null ? s.roleScores.pengurus.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.roleScores.manajemen != null ? s.roleScores.manajemen.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.roleScores.karyawan != null ? s.roleScores.karyawan.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.roleScores.stakeholder != null ? s.roleScores.stakeholder.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-extrabold tabular-nums text-primary">
                      {s.scoreNormalized != null ? `${s.scoreNormalized}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">
                      {s.gap > 0 ? s.gap.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${GAP_BADGE_CLASS[s.level]}`}
                      >
                        {GAP_LABELS[s.level]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. HR Development & Action Implementation Plan */}
        <HRDevelopmentPlan />

        {/* 5. Recommendations & 4 Horizon Roadmap */}
        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">
                4. Roadmap Rekomendasi (4 Horizon Waktu & 7 Arah Aksi)
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Klasifikasi arah rekomendasi: Pertahankan, Perbaiki, Bangun, Transformasi, Kurangi,
                Hentikan, Eksplorasi.
              </p>
            </div>

            <div className="no-print flex items-center gap-1.5 rounded-xl border bg-card p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  viewMode === "kanban"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" /> Papan Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <List className="size-3.5" /> List Rincian
              </button>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <KanbanRoadmap recommendations={filteredRecommendations} />
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((r) => (
                <article
                  key={r.dimension}
                  className="rounded-2xl border bg-card p-5 shadow-sm print:shadow-none"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                        {r.dimension}
                      </span>
                      <h3 className="font-bold tracking-tight text-sm">{r.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${DIRECTION_BADGE_CLASS[r.direction]}`}
                      >
                        Aksi: {r.direction}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[r.priority]}`}
                      >
                        {PRIORITY_LABELS[r.priority]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4 bg-muted/30 p-3 rounded-xl">
                    <div>
                      <span className="text-muted-foreground font-medium block text-[10px]">
                        Horizon Waktu:
                      </span>
                      <span className="font-bold text-foreground">{r.horizon}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block text-[10px]">
                        Penanggung Jawab (PIC):
                      </span>
                      <span className="font-bold text-foreground">{r.pic}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block text-[10px]">
                        KPI Target:
                      </span>
                      <span className="font-bold text-foreground">{r.kpi}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block text-[10px]">
                        Target Capaian:
                      </span>
                      <span className="font-bold text-foreground">{r.target}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{r.reason}</p>

                  <div className="mt-3 border-t pt-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Tindakan Rekomendasi Utama:
                    </span>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {r.actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-2 text-[10px] italic text-muted-foreground">
                    Traceability bukti: {r.evidenceTrace}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 5. Qualitative & Quantitative Traceability */}
        <section className="mb-10">
          <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
            5. Bukti Data Pendukung & Kualitatif
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Temuan FGD, wawancara, dan telaah dokumen/data kuantitatif objektif.
          </p>

          {qual.metrics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Data Objektif / Kuantitatif
              </h3>
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">Indikator</th>
                      <th className="px-3 py-2 text-center">Target</th>
                      <th className="px-3 py-2 text-center">Capaian Actual</th>
                      <th className="px-3 py-2 text-center">Periode</th>
                      <th className="px-3 py-2 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {qual.metrics.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 font-medium">{m.metric_name}</td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          {m.target_val || "—"}
                        </td>
                        <td className="px-3 py-2 text-center font-bold tabular-nums">
                          {m.actual_val || "—"}
                        </td>
                        <td className="px-3 py-2 text-center">{m.period || "—"}</td>
                        <td className="px-3 py-2 text-center font-semibold capitalize">
                          {m.confidence_level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {fgdWithQuotes.slice(0, 4).map((f) => (
              <div key={f.id} className="rounded-xl border bg-card p-3 text-xs">
                <span className="font-bold text-primary block">FGD Domain {f.dimension}</span>
                {f.themes && <p className="mt-1 text-muted-foreground">{f.themes}</p>}
                {f.quotes && <p className="mt-1 italic border-l-2 pl-2">“{f.quotes}”</p>}
              </div>
            ))}
            {interviewsWithFindings.slice(0, 4).map((iv) => (
              <div key={iv.id} className="rounded-xl border bg-card p-3 text-xs">
                <span className="font-bold text-primary block">
                  Wawancara ({iv.informant_role})
                </span>
                <p className="mt-1 text-muted-foreground">{iv.findings}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t pt-4 text-[11px] text-muted-foreground text-center">
          Laporan hasil diagnosis ini diproses otomatis oleh sistem ODI-X pada {today}. Angka dan
          rekomendasi terhubung langsung dengan bukti kualitatif dan data kuantitatif pendukung.
        </footer>
      </main>
    </ProtectedRoute>
  );
}

function buildMarkdown(input: {
  orgName: string;
  today: string;
  respondents: number;
  indices: ReturnType<typeof computeCompositeIndices>;
  summaries: DimensionSummary[];
  recommendations: Recommendation[];
  comments: CommentRow[];
  fgd: FgdNote[];
  interviews: InterviewNote[];
  documents: DocumentReview[];
  metrics: QuantitativeMetric[];
}) {
  const L: string[] = [];
  L.push(`# Laporan Executive Diagnosis Organisasi (ODI-X) — ${input.orgName}`);
  L.push(`\n_Disusun ${input.today} · Sample ${input.respondents} responden_\n`);
  L.push(`## 1. Indeks Komposit Kesehatan Organisasi\n`);
  L.push(`- Health Index: **${input.indices.healthIndex}/100**`);
  L.push(`- Alignment Index: **${input.indices.alignmentIndex}/100**`);
  L.push(`- Adaptability Index: **${input.indices.adaptabilityIndex}/100**`);
  L.push(`- Maturity Level: **${input.indices.maturityLabel}**`);
  L.push(`- Risk Exposure: **${input.indices.riskExposure}**\n`);

  L.push(`## 2. Ringkasan 12 Domain & Gap Persepsi\n`);
  L.push(`| Domain | Leadership | Manager | Employee | Stakeholder | Index | Gap |`);
  L.push(`| --- | ---: | ---: | ---: | ---: | ---: | ---: |`);
  for (const s of input.summaries) {
    const cell = (v: number | null | undefined) => (v != null ? v.toFixed(2) : "—");
    L.push(
      `| ${s.id}. ${s.name} | ${cell(s.roleScores.pengurus)} | ${cell(s.roleScores.manajemen)} | ${cell(s.roleScores.karyawan)} | ${cell(s.roleScores.stakeholder)} | ${s.scoreNormalized ?? "—"} | ${s.gap.toFixed(2)} |`,
    );
  }

  L.push(`\n## 3. Roadmap Rekomendasi 4 Horizon Waktu\n`);
  for (const r of input.recommendations) {
    L.push(`### ${r.dimension}. ${r.title} — Aksi: ${r.direction} (${r.priority})`);
    L.push(`- **Horizon**: ${r.horizon} | **PIC**: ${r.pic} | **KPI**: ${r.kpi} (${r.target})`);
    L.push(`- **Alasan**: ${r.reason}`);
    for (const a of r.actions) L.push(`  - ${a}`);
    L.push("");
  }
  return L.join("\n");
}
