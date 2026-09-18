import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2, Upload, FileText, BarChart3, MessageSquare, Users } from "lucide-react";
import { useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AssessmentNavTabs } from "@/components/AssessmentNavTabs";
import {
  addDocumentReview,
  addFgdNote,
  addInterviewNote,
  addQuantitativeMetric,
  getQualitativeData,
  removeQualitativeEntry,
} from "@/lib/admin.functions";
import { DIMENSIONS } from "@/lib/questionnaire";

const qualitativeQuery = (id: string) =>
  queryOptions({
    queryKey: ["kualitatif", id],
    queryFn: () => getQualitativeData({ data: { id } }),
  });

export const Route = createFileRoute("/asesmen/$id/kualitatif")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(qualitativeQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Data Kualitatif & Kuantitatif — ODI-X" },
      {
        name: "description",
        content:
          "Input data objektif/kuantitatif, catatan FGD, wawancara, dan telaah dokumen pendukung dengan tingkat keyakinan (confidence level).",
      },
      { property: "og:title", content: "Data Kualitatif & Dokumen — ODI-X" },
      {
        property: "og:description",
        content:
          "FGD, wawancara, data kuantitatif, dan telaah dokumen pendukung diagnosis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QualitativePage,
});

type Tab = "kuantitatif" | "dokumen" | "fgd" | "wawancara";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "kuantitatif", label: "Data Kuantitatif / Objektif", icon: BarChart3 },
  { key: "dokumen", label: "Telaah Dokumen Bukti", icon: FileText },
  { key: "fgd", label: "FGD Notes", icon: Users },
  { key: "wawancara", label: "Wawancara Mendalam", icon: MessageSquare },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-sans";

function QualitativePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(qualitativeQuery(id));
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("kuantitatif");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["kualitatif", id] });
    void qc.invalidateQueries({ queryKey: ["triangulasi", id] });
  };

  const metricMutation = useMutation({
    mutationFn: addQuantitativeMetric,
    onSuccess: invalidate,
  });
  const docMutation = useMutation({
    mutationFn: addDocumentReview,
    onSuccess: invalidate,
  });
  const fgdMutation = useMutation({
    mutationFn: addFgdNote,
    onSuccess: invalidate,
  });
  const interviewMutation = useMutation({
    mutationFn: addInterviewNote,
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: removeQualitativeEntry,
    onSuccess: invalidate,
  });

  return (
    <ProtectedRoute allowedRoles={["super_admin", "org_admin", "analyst"]}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      <header className="mb-6">
        <Link
          to="/asesmen/$id"
          params={{ id }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Kembali ke Dashboard Organisasi
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bukti Kualitatif, Dokumen & Data Kuantitatif
        </h1>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground leading-relaxed">
          Input bukti pendukung diagnosis dari hasil FGD, wawancara mendalam, telaah dokumen internal, dan metriks kuantitatif objektif untuk memperkuat triangulasi data.
        </p>
      </header>

      <AssessmentNavTabs id={id} />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                tab === t.key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "kuantitatif" && (
        <Section
          title="Data Objektif / Kuantitatif"
          form={
            <MetricForm
              busy={metricMutation.isPending}
              onSubmit={(values) =>
                metricMutation.mutate({ data: { organizationId: id, ...values } })
              }
            />
          }
          rows={(data.metrics || []).map((m) => ({
            id: m.id,
            dimension: m.dimension,
            title: m.metric_name,
            body: `Target: ${m.target_val || "—"} | Actual: ${m.actual_val || "—"} (${m.unit || ""}) · Periode: ${m.period || "—"}`,
            meta: [
              `Sumber: ${m.data_source || "Internal"}`,
              `Confidence: ${m.confidence_level}`,
            ],
            quote: null,
          }))}
          onDelete={(rowId) =>
            removeMutation.mutate({ data: { table: "quantitative_metrics", id: rowId } })
          }
        />
      )}

      {tab === "dokumen" && (
        <Section
          title="Telaah Dokumen Pendukung"
          form={
            <DocumentForm
              busy={docMutation.isPending}
              onSubmit={(values) =>
                docMutation.mutate({ data: { organizationId: id, ...values } })
              }
            />
          }
          rows={data.documents.map((d) => ({
            id: d.id,
            dimension: d.dimension,
            title: d.doc_type,
            body: d.notes ?? "—",
            meta: [
              `Status: ${d.doc_status}`,
              d.score ? `Mutu: ${d.score}/5` : null,
              `Confidence: ${d.confidence_level || "cukup"}`,
            ],
            quote: null,
          }))}
          onDelete={(rowId) =>
            removeMutation.mutate({ data: { table: "document_reviews", id: rowId } })
          }
        />
      )}

      {tab === "fgd" && (
        <Section
          title="Catatan FGD"
          form={
            <FgdForm
              busy={fgdMutation.isPending}
              onSubmit={(values) =>
                fgdMutation.mutate({ data: { organizationId: id, ...values } })
              }
            />
          }
          rows={data.fgd.map((n) => ({
            id: n.id,
            dimension: n.dimension,
            title: n.facilitator ?? "Fasilitator tidak dicatat",
            body: n.themes ?? "—",
            meta: [
              n.consensus ? `Konsensus ${n.consensus}/5` : null,
              n.status,
            ],
            quote: n.quotes,
          }))}
          onDelete={(rowId) =>
            removeMutation.mutate({ data: { table: "fgd_notes", id: rowId } })
          }
        />
      )}

      {tab === "wawancara" && (
        <Section
          title="Catatan Wawancara Mendalam"
          form={
            <InterviewForm
              busy={interviewMutation.isPending}
              onSubmit={(values) =>
                interviewMutation.mutate({
                  data: { organizationId: id, ...values },
                })
              }
            />
          }
          rows={data.interviews.map((n) => ({
            id: n.id,
            dimension: n.dimension,
            title: n.informant_role ?? "Informan tidak dicatat",
            body: n.findings ?? "—",
            meta: [n.status],
            quote: null,
          }))}
          onDelete={(rowId) =>
            removeMutation.mutate({
              data: { table: "interview_notes", id: rowId },
            })
          }
        />
      )}
    </main>
    </ProtectedRoute>
  );
}

interface Row {
  id: string;
  dimension: number;
  title: string;
  body: string;
  meta: (string | null)[];
  quote: string | null;
}

function Section({
  title,
  form,
  rows,
  onDelete,
}: {
  title: string;
  form: React.ReactNode;
  rows: Row[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-display text-base font-bold tracking-tight">
          Input {title}
        </h2>
        <div className="mt-3">{form}</div>
      </div>
      <div>
        <h2 className="mb-3 font-display text-base font-bold tracking-tight">
          Daftar {title} Tersimpan ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-xs text-muted-foreground text-center">
            Belum ada data tersimpan. Gunakan formulir di samping.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const dim = DIMENSIONS.find((d) => d.id === r.dimension);
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Domain {r.dimension} · {dim?.name}
                      </p>
                      <p className="mt-0.5 text-sm font-bold">{r.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      aria-label="Hapus catatan"
                      className="rounded-lg border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground">
                    {r.body}
                  </p>
                  {r.quote && (
                    <p className="mt-2 border-l-2 border-primary pl-3 italic text-muted-foreground">
                      “{r.quote}”
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    {r.meta.filter(Boolean).map((m) => (
                      <span
                        key={m as string}
                        className="rounded-full border bg-accent/30 px-2 py-0.5 font-semibold text-accent-foreground capitalize"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DimensionSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs font-semibold">
      Domain Terkait
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      >
        {DIMENSIONS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.id}. {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfidenceSelect({
  value,
  onChange,
}: {
  value: "tipis" | "cukup" | "kuat";
  onChange: (v: "tipis" | "cukup" | "kuat") => void;
}) {
  return (
    <label className="block text-xs font-semibold">
      Tingkat Keyakinan Validitas (Confidence)
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "tipis" | "cukup" | "kuat")}
        className={inputClass}
      >
        <option value="kuat font-bold">Kuat (Dokumen Resmi / Data Terverifikasi)</option>
        <option value="cukup">Cukup (Laporan Internal / Sampel Cukup)</option>
        <option value="tipis">Tipis (Klaim Lisan / Sampel Terbatas)</option>
      </select>
    </label>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
    >
      {busy ? "Menyimpan…" : label}
    </button>
  );
}

function MetricForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (v: {
    dimension: number;
    metricName: string;
    targetVal?: string;
    actualVal?: string;
    unit?: string;
    period?: string;
    dataSource?: string;
    confidenceLevel?: "tipis" | "cukup" | "kuat";
  }) => void;
}) {
  const [dimension, setDimension] = useState(1);
  const [metricName, setMetricName] = useState("");
  const [targetVal, setTargetVal] = useState("");
  const [actualVal, setActualVal] = useState("");
  const [unit, setUnit] = useState("%");
  const [period, setPeriod] = useState("2025/2026");
  const [dataSource, setDataSource] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<"tipis" | "cukup" | "kuat">("kuat");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (metricName.trim().length < 2) return;
        onSubmit({
          dimension,
          metricName,
          ...(targetVal.trim() ? { targetVal } : {}),
          ...(actualVal.trim() ? { actualVal } : {}),
          ...(unit.trim() ? { unit } : {}),
          ...(period.trim() ? { period } : {}),
          ...(dataSource.trim() ? { dataSource } : {}),
          confidenceLevel,
        });
        setMetricName("");
        setTargetVal("");
        setActualVal("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-xs font-semibold">
        Nama Indikator / Metric
        <input
          value={metricName}
          onChange={(e) => setMetricName(e.target.value)}
          className={inputClass}
          placeholder="mis. NPF Gross, Turnover SDM, Complaints"
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold">
          Target
          <input
            value={targetVal}
            onChange={(e) => setTargetVal(e.target.value)}
            className={inputClass}
            placeholder="mis. < 3.0"
          />
        </label>
        <label className="block text-xs font-semibold">
          Capaian Actual
          <input
            value={actualVal}
            onChange={(e) => setActualVal(e.target.value)}
            className={inputClass}
            placeholder="mis. 4.2"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold">
          Satuan
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={inputClass}
            placeholder="%, orang, kasus"
          />
        </label>
        <label className="block text-xs font-semibold">
          Periode
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={inputClass}
            placeholder="TW-IV 2025"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold">
        Sumber Data
        <input
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          className={inputClass}
          placeholder="Laporan Keuangan Audit, CBS Log"
        />
      </label>
      <ConfidenceSelect value={confidenceLevel} onChange={setConfidenceLevel} />
      <SubmitButton busy={busy} label="Simpan Data Kuantitatif" />
    </form>
  );
}

function DocumentForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (v: {
    dimension: number;
    docType: string;
    docStatus: "mutakhir" | "usang" | "tidak_ada" | "ada" | "sebagian" | "tidak ada";
    score?: number;
    confidenceLevel?: "tipis" | "cukup" | "kuat";
    notes?: string;
  }) => void;
}) {
  const [dimension, setDimension] = useState(1);
  const [docType, setDocType] = useState("");
  const [docStatus, setDocStatus] = useState<"mutakhir" | "usang" | "tidak_ada">("mutakhir");
  const [score, setScore] = useState("4");
  const [confidenceLevel, setConfidenceLevel] = useState<"tipis" | "cukup" | "kuat">("kuat");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (docType.trim().length < 2) return;
        onSubmit({
          dimension,
          docType,
          docStatus,
          confidenceLevel,
          ...(score ? { score: Number(score) } : {}),
          ...(notes.trim() ? { notes } : {}),
        });
        setDocType("");
        setNotes("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-xs font-semibold">
        Jenis Dokumen Bukti
        <input
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className={inputClass}
          placeholder="mis. Renstra, SOP Penagihan, Laporan Audit"
          required
        />
      </label>
      <label className="block text-xs font-semibold">
        Status Dokumen
        <select
          value={docStatus}
          onChange={(e) => setDocStatus(e.target.value as any)}
          className={inputClass}
        >
          <option value="mutakhir">Mutakhir & Berlaku</option>
          <option value="usang">Usang / Perlu Revisi</option>
          <option value="tidak_ada">Tidak Ditemukan</option>
        </select>
      </label>
      <label className="block text-xs font-semibold">
        Penilaian Mutu Dokumen (1–5)
        <input
          type="number"
          min={1}
          max={5}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className={inputClass}
        />
      </label>
      <ConfidenceSelect value={confidenceLevel} onChange={setConfidenceLevel} />
      <label className="block text-xs font-semibold">
        Catatan & Hasil Telaah
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="Kesesuaian isi dokumen dengan praktek riil di lapangan"
        />
      </label>
      <SubmitButton busy={busy} label="Simpan Telaah Dokumen" />
    </form>
  );
}

function FgdForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (v: {
    dimension: number;
    facilitator?: string;
    themes?: string;
    quotes?: string;
    consensus?: number;
    status: "draft" | "final";
  }) => void;
}) {
  const [dimension, setDimension] = useState(1);
  const [facilitator, setFacilitator] = useState("");
  const [themes, setThemes] = useState("");
  const [quotes, setQuotes] = useState("");
  const [consensus, setConsensus] = useState("4");
  const [status, setStatus] = useState<"draft" | "final">("final");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          dimension,
          status,
          ...(facilitator.trim() ? { facilitator } : {}),
          ...(themes.trim() ? { themes } : {}),
          ...(quotes.trim() ? { quotes } : {}),
          ...(consensus ? { consensus: Number(consensus) } : {}),
        });
        setFacilitator("");
        setThemes("");
        setQuotes("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-xs font-semibold">
        Fasilitator FGD
        <input
          value={facilitator}
          onChange={(e) => setFacilitator(e.target.value)}
          className={inputClass}
          placeholder="Tim Asesor / Moderator"
        />
      </label>
      <label className="block text-xs font-semibold">
        Tema Utama Diskusi
        <textarea
          rows={3}
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          className={inputClass}
          placeholder="Poin kesepakatan dan perbedaan pendapat"
        />
      </label>
      <label className="block text-xs font-semibold">
        Kutipan Verbatim
        <textarea
          rows={2}
          value={quotes}
          onChange={(e) => setQuotes(e.target.value)}
          className={inputClass}
          placeholder="Kutipan langsung dari peserta FGD"
        />
      </label>
      <SubmitButton busy={busy} label="Simpan Catatan FGD" />
    </form>
  );
}

function InterviewForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (v: {
    dimension: number;
    informantRole?: string;
    findings?: string;
    status: "draft" | "final";
  }) => void;
}) {
  const [dimension, setDimension] = useState(1);
  const [informantRole, setInformantRole] = useState("");
  const [findings, setFindings] = useState("");
  const [status, setStatus] = useState<"draft" | "final">("final");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          dimension,
          status,
          ...(informantRole.trim() ? { informantRole } : {}),
          ...(findings.trim() ? { findings } : {}),
        });
        setInformantRole("");
        setFindings("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-xs font-semibold">
        Peran / Posisi Informan
        <input
          value={informantRole}
          onChange={(e) => setInformantRole(e.target.value)}
          className={inputClass}
          placeholder="Ketua Pengurus, GM, Kepala Cabang"
        />
      </label>
      <label className="block text-xs font-semibold">
        Temuan Wawancara Mendalam
        <textarea
          rows={4}
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          className={inputClass}
          placeholder="Hasil pendalaman isu kunci"
        />
      </label>
      <SubmitButton busy={busy} label="Simpan Catatan Wawancara" />
    </form>
  );
}
