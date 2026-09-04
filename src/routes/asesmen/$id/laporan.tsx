import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useMemo } from "react";

import { RadarTriChart, type RadarDatum } from "@/components/RadarTriChart";
import { getDashboardData, getQualitativeData } from "@/lib/admin.functions";
import {
  PRIORITY_CLASS,
  PRIORITY_LABELS,
  ROLES,
  buildDimensionSummaries,
  buildRecommendations,
  type DimensionSummary,
  type Recommendation,
} from "@/lib/report";
import { DIMENSIONS, GAP_LABELS, ROLE_LABELS } from "@/lib/questionnaire";

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
      { title: "Laporan Diagnosis Organisasi — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Laporan diagnosis otomatis: ringkasan skor per dimensi, gap persepsi antar level, kutipan FGD dan wawancara, serta rekomendasi tindak lanjut yang siap diekspor.",
      },
      { property: "og:title", content: "Laporan Diagnosis Organisasi — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "Ringkasan dimensi, gap persepsi, kutipan kualitatif, dan rekomendasi tindak lanjut dalam satu laporan siap cetak.",
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

  const summaries = useMemo(
    () => buildDimensionSummaries(dash.scores),
    [dash.scores],
  );
  const recommendations = useMemo(() => buildRecommendations(summaries), [summaries]);

  const radarData: RadarDatum[] = summaries.map((s) => ({
    label: s.short,
    pengurus: s.roleScores.pengurus ?? null,
    manajemen: s.roleScores.manajemen ?? null,
    karyawan: s.roleScores.karyawan ?? null,
  }));

  const respondents = useMemo(() => {
    const perRole = new Map<string, number>();
    for (const row of dash.scores) {
      perRole.set(row.role, Math.max(perRole.get(row.role) ?? 0, row.respondents));
    }
    return [...perRole.values()].reduce((a, b) => a + b, 0);
  }, [dash.scores]);

  const scored = summaries.filter((s) => s.average != null);
  const overall = scored.length
    ? scored.reduce((a, s) => a + (s.average as number), 0) / scored.length
    : null;
  const strongest = [...scored].sort(
    (a, b) => (b.average as number) - (a.average as number),
  )[0];
  const weakest = [...scored].sort(
    (a, b) => (a.average as number) - (b.average as number),
  )[0];
  const highGaps = summaries.filter((s) => s.level !== "low");

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
      overall,
      summaries,
      recommendations,
      comments: dash.comments,
      fgd: fgdWithQuotes,
      interviews: interviewsWithFindings,
      documents: qual.documents,
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-diagnosis-${dash.organization?.code ?? id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 print:max-w-none print:px-0 print:py-0 sm:px-6">
      <div className="no-print mb-6">
        <Link
          to="/asesmen/$id"
          params={{ id }}
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          ← Dashboard {orgName}
        </Link>
      </div>

      <div className="no-print mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Printer className="size-4" /> Cetak / Simpan PDF
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <Download className="size-4" /> Unduh Markdown
        </button>
      </div>

      <header className="mb-8 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Laporan Diagnosis Organisasi
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {orgName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Disusun {today} · {respondents} responden kuesioner · Metode triangulasi
          kuesioner, FGD, wawancara, dan telaah dokumen.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
          1. Ringkasan Eksekutif
        </h2>
        <div className="rounded-2xl border bg-card p-5 text-sm leading-relaxed shadow-sm print:shadow-none">
          <p>
            Skor kesehatan organisasi {orgName} secara keseluruhan berada pada{" "}
            <strong>{overall != null ? overall.toFixed(2) : "—"} dari 5</strong>,
            dihitung dari rata-rata penilaian Pengurus, Manajemen, dan Karyawan pada
            10 dimensi.
            {strongest && (
              <>
                {" "}
                Dimensi terkuat adalah <strong>{strongest.name}</strong> (
                {(strongest.average as number).toFixed(2)})
              </>
            )}
            {weakest && (
              <>
                , sementara dimensi terlemah adalah <strong>{weakest.name}</strong> (
                {(weakest.average as number).toFixed(2)}).
              </>
            )}
          </p>
          <p className="mt-3">
            Terdapat <strong>{highGaps.length} dimensi</strong> dengan gap persepsi
            antar level yang perlu diklarifikasi
            {highGaps.length > 0 && (
              <>: {highGaps.map((d) => d.name).join(", ")}</>
            )}
            . Gap persepsi menunjukkan perbedaan cara pandang antar level terhadap
            kondisi yang sama, sehingga menjadi prioritas dialog sebelum keputusan
            perbaikan diambil.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
          2. Radar 10 Dimensi — Tiga Sudut Pandang
        </h2>
        <div className="rounded-2xl border bg-card p-4 shadow-sm print:shadow-none">
          <RadarTriChart data={radarData} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
          3. Ringkasan per Dimensi &amp; Gap Persepsi
        </h2>
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm print:shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Dimensi</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2 text-right font-semibold">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">Rata-rata</th>
                <th className="px-3 py-2 text-right font-semibold">Gap</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {s.id}. {s.name}
                  </td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2 text-right tabular-nums">
                      {s.roleScores[r] != null
                        ? (s.roleScores[r] as number).toFixed(2)
                        : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-bold tabular-nums">
                    {s.average != null ? s.average.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${GAP_BADGE_CLASS[s.level]}`}
                    >
                      {s.gap > 0 ? s.gap.toFixed(2) : "—"} · {GAP_LABELS[s.level]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
          4. Suara Lapangan — Kutipan &amp; Temuan Kualitatif
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Kutipan ditampilkan anonim; hanya peran atau sumber yang dicantumkan.
        </p>

        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Komentar Terbuka Kuesioner
        </h3>
        {dash.comments.length === 0 ? (
          <p className="mb-5 text-sm text-muted-foreground">Belum ada komentar terbuka.</p>
        ) : (
          <div className="mb-5 grid gap-3 sm:grid-cols-2 print:grid-cols-1">
            {dash.comments.slice(0, 8).map((c, i) => (
              <blockquote
                key={i}
                className="rounded-2xl border bg-card p-4 text-sm shadow-sm print:shadow-none"
              >
                <p className="leading-relaxed">“{c.comment}”</p>
                <footer className="mt-2 text-xs font-medium text-muted-foreground">
                  {ROLE_LABELS[c.role]} · Dimensi{" "}
                  {DIMENSIONS.find((d) => d.id === c.dimension)?.short}
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Focus Group Discussion
        </h3>
        {fgdWithQuotes.length === 0 ? (
          <p className="mb-5 text-sm text-muted-foreground">Belum ada catatan FGD.</p>
        ) : (
          <div className="mb-5 space-y-3">
            {fgdWithQuotes.map((f) => (
              <article
                key={f.id}
                className="rounded-2xl border bg-card p-4 text-sm shadow-sm print:shadow-none"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  Dimensi {DIMENSIONS.find((d) => d.id === f.dimension)?.name}
                  {f.facilitator ? ` · Fasilitator ${f.facilitator}` : ""}
                </p>
                {f.themes && <p className="mt-2 leading-relaxed">{f.themes}</p>}
                {f.quotes && (
                  <blockquote className="mt-2 border-l-2 pl-3 italic leading-relaxed">
                    “{f.quotes}”
                  </blockquote>
                )}
              </article>
            ))}
          </div>
        )}

        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Wawancara Mendalam
        </h3>
        {interviewsWithFindings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada catatan wawancara.</p>
        ) : (
          <div className="space-y-3">
            {interviewsWithFindings.map((iv) => (
              <article
                key={iv.id}
                className="rounded-2xl border bg-card p-4 text-sm shadow-sm print:shadow-none"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  Dimensi {DIMENSIONS.find((d) => d.id === iv.dimension)?.name}
                  {iv.informant_role ? ` · Informan ${iv.informant_role}` : ""}
                </p>
                <p className="mt-2 leading-relaxed">{iv.findings}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
          5. Rekomendasi Tindak Lanjut
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Disusun otomatis dari skor dimensi dan besar gap persepsi, diurutkan
          berdasarkan prioritas.
        </p>
        <div className="space-y-3">
          {recommendations.map((r) => (
            <article
              key={r.dimension}
              className="rounded-2xl border bg-card p-4 shadow-sm print:shadow-none sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold tracking-tight">
                  {r.dimension}. {r.title}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${PRIORITY_CLASS[r.priority]}`}
                >
                  {PRIORITY_LABELS[r.priority]}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.reason}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {r.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </article>
          ))}
          {recommendations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada data kuesioner yang cukup untuk menyusun rekomendasi.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t pt-4 text-xs text-muted-foreground">
        Laporan dihasilkan otomatis oleh DiagnosaBMT pada {today}. Angka dan
        rekomendasi bersifat indikatif dan perlu divalidasi dalam forum klarifikasi
        bersama pengurus, manajemen, dan perwakilan karyawan.
      </footer>
    </main>
  );
}

function buildMarkdown(input: {
  orgName: string;
  today: string;
  respondents: number;
  overall: number | null;
  summaries: DimensionSummary[];
  recommendations: Recommendation[];
  comments: { dimension: number; role: keyof typeof ROLE_LABELS; comment: string }[];
  fgd: { dimension: number; facilitator: string | null; themes: string | null; quotes: string | null }[];
  interviews: { dimension: number; informant_role: string | null; findings: string | null }[];
  documents: { dimension: number; doc_type: string; doc_status: string; notes: string | null }[];
}) {
  const L: string[] = [];
  L.push(`# Laporan Diagnosis Organisasi — ${input.orgName}`);
  L.push(
    `\n_Disusun ${input.today} · ${input.respondents} responden kuesioner_\n`,
  );
  L.push(`## 1. Ringkasan Eksekutif\n`);
  L.push(
    `Skor kesehatan organisasi secara keseluruhan: **${input.overall != null ? input.overall.toFixed(2) : "—"} dari 5**.\n`,
  );

  L.push(`## 2. Ringkasan per Dimensi & Gap Persepsi\n`);
  L.push(`| Dimensi | Pengurus | Manajemen | Karyawan | Rata-rata | Gap |`);
  L.push(`| --- | ---: | ---: | ---: | ---: | --- |`);
  for (const s of input.summaries) {
    const cell = (v: number | null | undefined) => (v != null ? v.toFixed(2) : "—");
    L.push(
      `| ${s.id}. ${s.name} | ${cell(s.roleScores.pengurus)} | ${cell(s.roleScores.manajemen)} | ${cell(s.roleScores.karyawan)} | ${cell(s.average)} | ${s.gap > 0 ? s.gap.toFixed(2) : "—"} (${GAP_LABELS[s.level]}) |`,
    );
  }

  L.push(`\n## 3. Suara Lapangan\n`);
  L.push(`### Komentar Kuesioner\n`);
  for (const c of input.comments.slice(0, 12)) {
    L.push(
      `> “${c.comment}” — ${ROLE_LABELS[c.role]}, dimensi ${DIMENSIONS.find((d) => d.id === c.dimension)?.name}`,
    );
    L.push("");
  }
  L.push(`### FGD\n`);
  for (const f of input.fgd) {
    L.push(
      `- **${DIMENSIONS.find((d) => d.id === f.dimension)?.name}**${f.facilitator ? ` (fasilitator ${f.facilitator})` : ""}: ${f.themes ?? ""}${f.quotes ? ` — “${f.quotes}”` : ""}`,
    );
  }
  L.push(`\n### Wawancara\n`);
  for (const iv of input.interviews) {
    L.push(
      `- **${DIMENSIONS.find((d) => d.id === iv.dimension)?.name}**${iv.informant_role ? ` (${iv.informant_role})` : ""}: ${iv.findings ?? ""}`,
    );
  }
  L.push(`\n### Telaah Dokumen\n`);
  for (const doc of input.documents) {
    L.push(
      `- **${DIMENSIONS.find((d) => d.id === doc.dimension)?.name}** — ${doc.doc_type}: ${doc.doc_status}${doc.notes ? ` (${doc.notes})` : ""}`,
    );
  }

  L.push(`\n## 4. Rekomendasi Tindak Lanjut\n`);
  for (const r of input.recommendations) {
    L.push(`### ${r.dimension}. ${r.title} — ${PRIORITY_LABELS[r.priority]}`);
    L.push(`${r.reason}\n`);
    for (const a of r.actions) L.push(`- ${a}`);
    L.push("");
  }
  L.push(
    `\n_Laporan dihasilkan otomatis oleh DiagnosaBMT. Angka dan rekomendasi bersifat indikatif._`,
  );
  return L.join("\n");
}
