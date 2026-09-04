import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import {
  addDocumentReview,
  addFgdNote,
  addInterviewNote,
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
      { title: "Data Kualitatif — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Catat hasil FGD, wawancara mendalam, dan telaah dokumen per dimensi agar tiap kesimpulan diagnosis punya sumber pendukung.",
      },
      { property: "og:title", content: "Data Kualitatif — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "FGD, wawancara, dan telaah dokumen sebagai penguat data kuesioner dalam diagnosis BMT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QualitativePage,
});

type Tab = "fgd" | "wawancara" | "dokumen";

const TABS: { key: Tab; label: string }[] = [
  { key: "fgd", label: "FGD" },
  { key: "wawancara", label: "Wawancara" },
  { key: "dokumen", label: "Telaah Dokumen" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function QualitativePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(qualitativeQuery(id));
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("fgd");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["kualitatif", id] });
    void qc.invalidateQueries({ queryKey: ["triangulasi", id] });
  };

  const fgdMutation = useMutation({
    mutationFn: addFgdNote,
    onSuccess: invalidate,
  });
  const interviewMutation = useMutation({
    mutationFn: addInterviewNote,
    onSuccess: invalidate,
  });
  const docMutation = useMutation({
    mutationFn: addDocumentReview,
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: removeQualitativeEntry,
    onSuccess: invalidate,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link
          to="/asesmen/$id"
          params={{ id }}
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          ← {data.organization?.name ?? "Dashboard Organisasi"}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Data Kualitatif
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Catatan FGD, wawancara mendalam, dan telaah dokumen. Setiap catatan
          yang disimpan langsung mengisi sel yang bersangkutan pada{" "}
          <Link
            to="/asesmen/$id/triangulasi"
            params={{ id }}
            className="font-semibold underline"
          >
            peta triangulasi
          </Link>
          .
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary bg-accent text-accent-foreground"
                : "bg-card hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
          title="Catatan Wawancara"
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

      {tab === "dokumen" && (
        <Section
          title="Telaah Dokumen"
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
              `Ketersediaan: ${d.doc_status}`,
              d.score ? `Mutu ${d.score}/5` : null,
            ],
            quote: null,
          }))}
          onDelete={(rowId) =>
            removeMutation.mutate({
              data: { table: "document_reviews", id: rowId },
            })
          }
        />
      )}
    </main>
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
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Tambah {title}
        </h2>
        <div className="mt-4">{form}</div>
      </div>
      <div>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
          {title} tersimpan ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Belum ada catatan. Isi formulir di samping untuk menambahkan.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const dim = DIMENSIONS.find((d) => d.id === r.dimension);
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Dimensi {r.dimension} · {dim?.name}
                      </p>
                      <p className="mt-0.5 text-sm font-bold">{r.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      aria-label="Hapus catatan"
                      className="rounded-lg border p-2 text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {r.body}
                  </p>
                  {r.quote && (
                    <p className="mt-2 border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
                      {r.quote}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.meta.filter(Boolean).map((m) => (
                      <span
                        key={m as string}
                        className="rounded-full border px-2.5 py-0.5 font-semibold"
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
    <label className="block text-sm font-semibold">
      Dimensi
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

function StatusSelect({
  value,
  onChange,
}: {
  value: "draft" | "final";
  onChange: (v: "draft" | "final") => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      Status catatan
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "draft" | "final")}
        className={inputClass}
      >
        <option value="draft">Draft</option>
        <option value="final">Final</option>
      </select>
    </label>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
    >
      {busy ? "Menyimpan…" : label}
    </button>
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
  const [consensus, setConsensus] = useState("");
  const [status, setStatus] = useState<"draft" | "final">("draft");

  return (
    <form
      className="space-y-4"
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
        setConsensus("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-sm font-semibold">
        Fasilitator
        <input
          value={facilitator}
          onChange={(e) => setFacilitator(e.target.value)}
          className={inputClass}
          placeholder="Nama fasilitator FGD"
        />
      </label>
      <label className="block text-sm font-semibold">
        Tema yang muncul
        <textarea
          rows={4}
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          className={inputClass}
          placeholder="Ringkasan tema utama diskusi"
        />
      </label>
      <label className="block text-sm font-semibold">
        Kutipan penting
        <textarea
          rows={3}
          value={quotes}
          onChange={(e) => setQuotes(e.target.value)}
          className={inputClass}
          placeholder="Kutipan verbatim tanpa identitas"
        />
      </label>
      <label className="block text-sm font-semibold">
        Tingkat konsensus (1–5)
        <input
          type="number"
          min={1}
          max={5}
          value={consensus}
          onChange={(e) => setConsensus(e.target.value)}
          className={inputClass}
        />
      </label>
      <StatusSelect value={status} onChange={setStatus} />
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
  const [status, setStatus] = useState<"draft" | "final">("draft");

  return (
    <form
      className="space-y-4"
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
      <label className="block text-sm font-semibold">
        Peran informan
        <input
          value={informantRole}
          onChange={(e) => setInformantRole(e.target.value)}
          className={inputClass}
          placeholder="mis. Ketua Pengurus, Manajer Operasional"
        />
      </label>
      <label className="block text-sm font-semibold">
        Temuan
        <textarea
          rows={6}
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          className={inputClass}
          placeholder="Poin-poin temuan dari wawancara"
        />
      </label>
      <StatusSelect value={status} onChange={setStatus} />
      <SubmitButton busy={busy} label="Simpan Catatan Wawancara" />
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
    docStatus: "ada" | "sebagian" | "tidak ada";
    score?: number;
    notes?: string;
  }) => void;
}) {
  const [dimension, setDimension] = useState(1);
  const [docType, setDocType] = useState("");
  const [docStatus, setDocStatus] = useState<"ada" | "sebagian" | "tidak ada">(
    "ada",
  );
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (docType.trim().length < 2) return;
        onSubmit({
          dimension,
          docType,
          docStatus,
          ...(score ? { score: Number(score) } : {}),
          ...(notes.trim() ? { notes } : {}),
        });
        setDocType("");
        setScore("");
        setNotes("");
      }}
    >
      <DimensionSelect value={dimension} onChange={setDimension} />
      <label className="block text-sm font-semibold">
        Jenis dokumen
        <input
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className={inputClass}
          placeholder="mis. RAT, SOP Pembiayaan, Struktur Organisasi"
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        Ketersediaan
        <select
          value={docStatus}
          onChange={(e) =>
            setDocStatus(e.target.value as "ada" | "sebagian" | "tidak ada")
          }
          className={inputClass}
        >
          <option value="ada">Ada dan lengkap</option>
          <option value="sebagian">Ada sebagian</option>
          <option value="tidak ada">Tidak ada</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Mutu dokumen (1–5)
        <input
          type="number"
          min={1}
          max={5}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-semibold">
        Catatan telaah
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="Kesenjangan antara dokumen dan praktik"
        />
      </label>
      <SubmitButton busy={busy} label="Simpan Telaah Dokumen" />
    </form>
  );
}
