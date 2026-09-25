import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowUpRight, BarChart2, CheckCircle2, ClipboardPen, Copy, Layers, ShieldCheck, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { RadarTriChart, type RadarDatum } from "@/components/RadarTriChart";
import {
  addRespondentLink,
  getDashboardData,
  getQualitativeData,
  getRespondents,
  listRespondentLinks,
  removeRespondent,
  removeResponsesByRole,
  setProjectStatus,
} from "@/lib/admin.functions";
import { buildEvidenceMap, computeConfidence, evidenceFor } from "@/lib/confidence";
import { buildPriorities, topPriorities } from "@/lib/priority";
import {
  DIMENSIONS,
  GAP_LABELS,
  ROLE_LABELS,
  gapLevel,
  type GapLevel,
  type Role,
} from "@/lib/questionnaire";
import { buildDimensionSummaries, computeCompositeIndices } from "@/lib/report";

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

export const Route = createFileRoute("/asesmen/$id/")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(dashboardQuery(params.id)),
      context.queryClient.ensureQueryData(qualitativeQuery(params.id)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Dashboard Diagnosis Organisasi — ODI-X" },
      {
        name: "description",
        content:
          "Radar 12 domain kesehatan organisasi, 5 scorecard komposit, heatmap gap persepsi, bar chart performa, dan matriks prioritas masalah.",
      },
      { property: "og:title", content: "Dashboard Diagnosis Organisasi — ODI-X" },
      {
        property: "og:description",
        content:
          "Dashboard interaktif 12 domain kesehatan organisasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const ROLES: Role[] = ["pengurus", "manajemen", "karyawan", "stakeholder"];

const GAP_BADGE_CLASS: Record<GapLevel, string> = {
  high: "badge-gap-high",
  mid: "badge-gap-mid",
  low: "badge-gap-low",
};

import { AssessmentNavTabs } from "@/components/AssessmentNavTabs";
import { DomainDetailModal } from "@/components/DomainDetailModal";
import type { DimensionSummary } from "@/lib/report";

import { ProtectedRoute } from "@/components/ProtectedRoute";

function DashboardPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(dashboardQuery(id));
  const { data: qualData } = useSuspenseQuery(qualitativeQuery(id));
  const [copied, setCopied] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<DimensionSummary | null>(null);

  const scores = data.scores;

  const summaries = useMemo(
    () => buildDimensionSummaries(scores),
    [scores],
  );

  const indices = useMemo(
    () => computeCompositeIndices(summaries),
    [summaries],
  );

  const evidenceMap = useMemo(
    () => buildEvidenceMap({ scores, fgd: qualData.fgd, interviews: qualData.interviews, documents: qualData.documents }),
    [scores, qualData],
  );

  const priorities = useMemo(
    () => buildPriorities(summaries, (dimId) => computeConfidence(evidenceFor(evidenceMap, dimId))),
    [summaries, evidenceMap],
  );

  const [visibleRoles, setVisibleRoles] = useState<Record<Role, boolean>>({
    pengurus: true,
    manajemen: true,
    karyawan: true,
    stakeholder: true,
  });

  const qc = useQueryClient();
  const toggleStatus = useMutation({
    mutationFn: (input: { id: string; status: string }) => setProjectStatus({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["dashboard", id] }),
  });

  const radarData: RadarDatum[] = summaries.map((d) => ({
    label: d.short,
    pengurus: visibleRoles.pengurus ? (d.roleScores.pengurus ?? null) : null,
    manajemen: visibleRoles.manajemen ? (d.roleScores.manajemen ?? null) : null,
    karyawan: visibleRoles.karyawan ? (d.roleScores.karyawan ?? null) : null,
    stakeholder: visibleRoles.stakeholder ? (d.roleScores.stakeholder ?? null) : null,
  }));

  const barChartData = useMemo(
    () =>
      summaries.map((s) => ({
        name: s.short,
        Skor: s.average != null ? Number(s.average.toFixed(2)) : 0,
        Target: 3.8, // Threshold Level 4 (Terkelola & Terukur)
      })),
    [summaries],
  );

  const totalRespondents = useMemo(() => {
    const perRole = new Map<string, number>();
    for (const row of scores) {
      perRole.set(row.role, Math.max(perRole.get(row.role) ?? 0, row.respondents));
    }
    return [...perRole.values()].reduce((a, b) => a + b, 0);
  }, [scores]);

  const flaggedComments = useMemo(() => {
    const flaggedIds = new Set(summaries.filter((s) => s.level !== "low").map((f) => f.id));
    return data.comments.filter((c) => flaggedIds.has(c.dimension)).slice(0, 6);
  }, [data.comments, summaries]);

  const publicLink =
    typeof window !== "undefined" && data.organization
      ? `${window.location.origin}/isi/${data.organization.code}`
      : "";

  const totalFgd = qualData.fgd.length;
  const totalInterviews = qualData.interviews.length;
  const totalDocs = qualData.documents.length;
  const reportReady = totalRespondents >= 5 && (totalFgd > 0 || totalInterviews > 0 || totalDocs > 0);

  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/asesmen"
              className="text-xs font-semibold text-primary hover:underline"
            >
              ← Kembali ke Daftar Proyek
            </Link>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {data.organization?.name ?? "Organisasi"}
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sektor: <span className="font-semibold text-foreground">{data.organization?.sector || "LKMS / BMT"}</span> · Responden: <span className="font-semibold text-foreground">{totalRespondents} orang</span> · Tanggal: {data.organization?.started_on}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {publicLink && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(publicLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-xs font-bold transition-colors hover:bg-muted"
              >
                <Copy className="size-3.5" />
                {copied ? "Tersalin!" : "Salin Link Kuesioner"}
              </button>
            )}
          </div>
        </div>
      </div>

      <RespondentLinkManager id={id} />

      {/* Persisten Navigation Tabs */}
      <AssessmentNavTabs id={id} />

      {/* Report Readiness Indicator Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className={`flex size-3 rounded-full ${reportReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <div>
            <h3 className="text-xs font-bold text-foreground">
              Status Kesiapan Laporan Asesmen:{" "}
              <span className={reportReady ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                {reportReady ? "Siap Diterbitkan (Data Cukup)" : "Data Masih Dikumpulkan"}
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Kuantitatif: {totalRespondents} responden · FGD: {totalFgd} sesi · Wawancara: {totalInterviews} · Dokumen: {totalDocs} terupload
            </p>
          </div>
        </div>
        <Link
          to="/asesmen/$id/laporan"
          params={{ id }}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Buka Laporan & Roadmap →
        </Link>
      </div>

      {/* Executive Composite Indices Scorecards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <IndexCard
          title="Health Index"
          value={`${indices.healthIndex}/100`}
          badge={indices.healthIndex >= 70 ? "Sehat" : "Waspada"}
          desc="Skor kesehatan agregat 12 domain"
        />
        <IndexCard
          title="Alignment Index"
          value={`${indices.alignmentIndex}/100`}
          badge={indices.alignmentIndex >= 70 ? "Selaras" : "Terdapat Gap"}
          desc="Keselarasan persepsi 4 level"
        />
        <IndexCard
          title="Adaptability Index"
          value={`${indices.adaptabilityIndex}/100`}
          badge="Resiliensi"
          desc="Kapasitas inovasi & pasar"
        />
        <IndexCard
          title="Maturity Level"
          value={`L${indices.maturityLevel}`}
          badge={indices.maturityLabel.split("—")[1]?.trim() || "Kematangan"}
          desc="Tingkat kematangan organisasi"
        />
        <IndexCard
          title="Risk Exposure"
          value={indices.riskExposure}
          badge={indices.riskExposure === "Low" ? "Aman" : "Perlu Mitigasi"}
          desc="Profil eksposur risiko ($RE$)"
        />
      </section>

      {/* Visual Analytics: Radar + Bar Chart */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Radar 12 Dimensi */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="font-display text-base font-bold tracking-tight">
                Radar 12 Domain (Triangulasi 4 Prespektif)
              </h2>
              <p className="text-[11px] text-muted-foreground">Perbandingan persepsi antar level manajemen</p>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setVisibleRoles((v) => ({ ...v, [r]: !v[r] }))}
                  className={`rounded-lg border px-2 py-1 font-semibold transition-all ${
                    visibleRoles[r]
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground opacity-50"
                  }`}
                >
                  {ROLE_LABELS[r].split("/")[0]}
                </button>
              ))}
            </div>
          </div>
          <RadarTriChart data={radarData} />
        </section>

        {/* Bar Chart Performa vs Target Threshold */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-3 flex items-baseline justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-bold tracking-tight">
                Performa Domain vs Target Threshold (3.80 / Level 4)
              </h2>
              <p className="text-[11px] text-muted-foreground">Pencapaian skor rata-rata Likert per domain</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/40 text-accent-foreground border">Target L4</span>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => [Number(value).toFixed(2), "Skor"]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Skor" fill="#1B5A5A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Target" fill="#D9A441" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Heatmap Gap Persepsi Grid (12 Domain x 4 Prespektif) */}
      <section className="mb-8 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 border-b pb-3">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Heatmap Gap Persepsi ($12 \times 4$ Prespektif Grid)
          </h2>
          <p className="text-xs text-muted-foreground">
            Warna sel mengindikasikan deviasi skor persepsi. Gap tinggi ($\Delta \ge 1.20$) ditandai dengan warna merah untuk memicu investigasi kualitatif.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-muted/60 uppercase font-bold text-muted-foreground">
              <tr>
                <th className="sticky left-0 bg-muted z-10 px-3 py-2.5 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Domain Organisasi</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2.5 text-center">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center">Rata-Rata</th>
                <th className="px-3 py-2.5 text-center">Gap Δ</th>
                <th className="px-3 py-2.5 text-center">Status Alignment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summaries.map((s) => {
                const gapClass = s.gap >= 1.2 ? "bg-red-500/10 text-red-600 font-bold" : s.gap >= 0.7 ? "bg-amber-500/10 text-amber-600 font-semibold" : "bg-emerald-500/10 text-emerald-600";
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSummary(s)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="sticky left-0 bg-card z-10 px-3 py-2 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {s.id}. {s.name}
                    </td>
                    {ROLES.map((r) => {
                      const val = s.roleScores[r];
                      return (
                        <td key={r} className="px-3 py-2 text-center tabular-nums font-mono">
                          {val != null ? val.toFixed(2) : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold tabular-nums">
                      {s.average != null ? s.average.toFixed(2) : "—"}
                    </td>
                    <td className={`px-3 py-2 text-center tabular-nums ${gapClass}`}>
                      {s.gap.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${GAP_BADGE_CLASS[s.level]}`}>
                        {GAP_LABELS[s.level]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabel Prioritas Masalah & Evidence Coverage Panel */}
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Priority Engine Table */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 border-b pb-3">
            <h2 className="font-display text-base font-bold tracking-tight">
              Matriks Perankingan Prioritas Masalah (Priority Engine)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Dihitung komposit: $P_d = (Urgent \times 0.35) + (Impact \times 0.30) + (Risk \times 0.20) - (Penalty \times 0.15)$
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Domain</th>
                  <th className="px-3 py-2 text-center">Priority Score</th>
                  <th className="px-3 py-2 text-center">Kategori Risk</th>
                  <th className="px-3 py-2 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {priorities.slice(0, 7).map((p) => {
                  const s = summaries.find((sum) => sum.id === p.dimension);
                  return (
                    <tr
                      key={p.dimension}
                      onClick={() => s && setSelectedSummary(s)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2 font-semibold">
                        {p.dimension}. {p.name}
                      </td>
                      <td className="px-3 py-2 text-center font-extrabold text-primary tabular-nums">
                        {p.score.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="rounded-full border bg-accent/40 px-2 py-0.5 text-[10px] font-bold">
                          Risk {p.risk >= 0.8 ? "Tinggi" : "Sedang"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center capitalize font-medium">
                        {p.confidence.level} ({p.confidence.methods} metode)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel Evidence Proof Coverage */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 border-b pb-3">
            <h2 className="font-display text-base font-bold tracking-tight">
              Indikator Kelengkapan Bukti (Proof Coverage)
            </h2>
            <p className="text-[11px] text-muted-foreground">Klik domain untuk melihat bukti kualitatif detail</p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {summaries.map((s) => {
              const ev = evidenceFor(evidenceMap, s.id);
              const totalProof = (ev.fgd > 0 ? 1 : 0) + (ev.interviews > 0 ? 1 : 0) + (ev.documents > 0 ? 1 : 0);
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSummary(s)}
                  className="flex items-center justify-between rounded-xl border bg-background p-2.5 text-xs hover:border-primary cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-bold text-foreground block">{s.id}. {s.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      FGD: {ev.fgd} · Wawancara: {ev.interviews} · Dokumen: {ev.documents}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${totalProof >= 2 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border" : "bg-amber-500/10 text-amber-600 border-amber-500/30 border"}`}>
                    {totalProof >= 2 ? "Lengkap" : "Tipis"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Flagged Comments */}
      {flaggedComments.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
            Aspirasi & Catatan Kunci Responden
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Kutipan masukan dari domain dengan gap persepsi tinggi.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flaggedComments.map((c, i) => (
              <blockquote
                key={i}
                className="rounded-2xl border bg-card p-4 text-sm shadow-sm"
              >
                <p className="leading-relaxed text-xs">“{c.comment}”</p>
                <footer className="mt-3 text-[11px] font-medium text-muted-foreground border-t pt-2">
                  {ROLE_LABELS[c.role]} · Domain{" "}
                  {DIMENSIONS.find((d) => d.id === c.dimension)?.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Response Manager */}
      <ResponseManager id={id} />

      {/* Triangulation Detail Modal */}
      {selectedSummary && (
        <DomainDetailModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
          evidenceData={{
            fgdCount: qualData.fgd.filter((f) => f.dimension === selectedSummary.id).length,
            interviewCount: qualData.interviews.filter((i) => i.dimension === selectedSummary.id).length,
            docCount: qualData.documents.filter((d) => d.dimension === selectedSummary.id).length,
            fgdQuotes: qualData.fgd
              .filter((f) => f.dimension === selectedSummary.id && f.quotes?.trim())
              .map((f) => f.quotes!),
            interviewFindings: qualData.interviews
              .filter((i) => i.dimension === selectedSummary.id && i.findings?.trim())
              .map((i) => i.findings!),
            metrics: qualData.metrics
              .filter((m) => m.dimension === selectedSummary.id)
              .map((m) => ({ name: m.metric_name, target: m.target_val, actual: m.actual_val })),
          }}
        />
      )}
    </main>
    </ProtectedRoute>
  );
}

function IndexCard({
  title,
  value,
  badge,
  desc,
}: {
  title: string;
  value: string;
  badge: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <span className="rounded-full border bg-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
          {badge}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function RespondentLinkManager({ id }: { id: string }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>("karyawan");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { data: links = [] } = useQuery({
    queryKey: ["respondent-links", id],
    queryFn: () => listRespondentLinks({ data: { id } }),
  });
  const create = useMutation({
    mutationFn: () =>
      addRespondentLink({
        data: {
          organizationId: id,
          perspective: role,
          respondentName: name.trim() || undefined,
        },
      }),
    onSuccess: () => {
      setName("");
      void qc.invalidateQueries({ queryKey: ["respondent-links", id] });
    },
  });

  const urlOf = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/isi/${token}` : `/isi/${token}`;

  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Link Khusus Responden</h2>
          <p className="text-xs text-muted-foreground">Asesor/responden isi nama dan kuesioner tanpa login lewat link unik.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-xl border bg-background px-3 py-2 text-xs font-semibold">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama/inisial opsional" className="rounded-xl border bg-background px-3 py-2 text-xs" />
          <button type="button" disabled={create.isPending} onClick={() => create.mutate()} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
            Buat Link Khusus
          </button>
        </div>
      </div>
      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          {links.slice(0, 6).map((link) => {
            const url = urlOf(link.token);
            return (
              <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-xs">
                <span className="font-semibold">{ROLE_LABELS[link.perspective]} · {link.respondent_name || "Tanpa nama"} · {link.status}</span>
                <button type="button" onClick={() => { void navigator.clipboard.writeText(url); setCopied(link.id); setTimeout(() => setCopied(null), 2000); }} className="rounded-lg border px-3 py-1.5 font-bold hover:bg-muted">
                  {copied === link.id ? "Tersalin" : "Salin Link"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResponseManager({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: respondents = [], isLoading } = useQuery({
    queryKey: ["respondents", id],
    queryFn: () => getRespondents({ data: { id } }),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["respondents", id] });
    void qc.invalidateQueries({ queryKey: ["dashboard", id] });
    void qc.invalidateQueries({ queryKey: ["triangulasi", id] });
    void qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const delOne = useMutation({
    mutationFn: (respondentId: string) =>
      removeRespondent({ data: { organizationId: id, respondentId } }),
    onSuccess: invalidate,
  });

  const delRole = useMutation({
    mutationFn: (role: Role) =>
      removeResponsesByRole({ data: { organizationId: id, role } }),
    onSuccess: invalidate,
  });

  return (
    <section className="mb-10 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
        Manajemen Data Responden
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Kelola dan bersihkan data sampel kuesioner per responden atau per prespektif.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            disabled={delRole.isPending}
            onClick={() => {
              const typed = window.prompt(
                `Ketik RESET untuk menghapus semua isian ${ROLE_LABELS[role]} pada asesmen ini.`,
              );
              if (typed === "RESET") delRole.mutate(role);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-background px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Reset {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data responden…</p>
      ) : respondents.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
          Belum ada data kuesioner yang masuk.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {respondents.map((r) => (
            <div
              key={r.respondent_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {r.name?.trim() ? r.name : "Anonim"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {ROLE_LABELS[r.role as Role] ?? r.role}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.answers} jawaban
                  {r.tenure ? ` · masa kerja ${r.tenure}` : ""} ·{" "}
                  {new Date(r.submitted_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                disabled={delOne.isPending}
                onClick={() => {
                  const typed = window.prompt("Ketik HAPUS untuk menghapus seluruh isian responden ini.");
                  if (typed === "HAPUS") delOne.mutate(r.respondent_id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" /> Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
