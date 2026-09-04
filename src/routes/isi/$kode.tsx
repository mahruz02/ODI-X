import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Landmark,
  Lock,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getOrganizationByCode,
  submitResponses,
} from "@/lib/diagnosis.functions";
import {
  LIKERT,
  ROLE_LABELS,
  dimensionsForRole,
  type Role,
} from "@/lib/questionnaire";

const orgQuery = (code: string) =>
  queryOptions({
    queryKey: ["org-by-code", code],
    queryFn: () => getOrganizationByCode({ data: { code } }),
  });

export const Route = createFileRoute("/isi/$kode")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orgQuery(params.kode)),
  head: () => ({
    meta: [
      { title: "Isi Kuesioner — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Kuesioner diagnosis organisasi BMT. Anonim, tanpa login — jawaban Anda dihitung dalam bentuk agregat dan tetap rahasia.",
      },
      { property: "og:title", content: "Isi Kuesioner — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "Kuesioner diagnosis organisasi BMT. Anonim, tanpa login — jawaban tetap rahasia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IsiPage,
});

const TENURE_OPTIONS = ["< 1 tahun", "1–3 tahun", "3–5 tahun", "> 5 tahun"];

type Step =
  | { kind: "role" }
  | { kind: "identity" }
  | { kind: "dimension"; index: number }
  | { kind: "done" };

function IsiPage() {
  const { kode } = Route.useParams();
  const { data: org, isLoading } = useQuery(orgQuery(kode));
  const [step, setStep] = useState<Step>({ kind: "role" });
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [tenure, setTenure] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Tautan baru dari asesor cukup menambahkan ?t=<kode-unik> agar kunci
  // pengisian sebelumnya tidak berlaku.
  const [lockKey, setLockKey] = useState(`diagnosabmt:selesai:${kode}`);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("t") ?? "";
    const key = `diagnosabmt:selesai:${kode}${token ? `:${token}` : ""}`;
    setLockKey(key);
    try {
      if (window.localStorage.getItem(key)) setLocked(true);
    } catch {
      /* storage tidak tersedia — biarkan terbuka */
    }
  }, [kode]);

  const dims = useMemo(() => (role ? dimensionsForRole(role) : []), [role]);
  const totalQuestions = dims.reduce((acc, d) => acc + d.questions[role!].length, 0);
  const answeredCount = Object.keys(scores).length;

  function pickRole(r: Role) {
    setRole(r);
    setStep({ kind: "identity" });
  }

  function questionKey(dimId: number, qIdx: number) {
    return `d${dimId}-${role}-${qIdx + 1}`;
  }

  function dimensionComplete(index: number): boolean {
    if (!role) return false;
    const dim = dims[index]!;
    const allScored = dim.questions[role].every(
      (_, qi) => scores[questionKey(dim.id, qi)] != null,
    );
    if (!allScored) return false;
    if (dim.critical && !comments[dim.id]?.trim()) return false;
    return true;
  }

  async function handleSubmit() {
    if (!role) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers = dims.flatMap((dim) =>
        dim.questions[role].map((_, qi) => {
          const comment = comments[dim.id]?.trim();
          return {
            dimension: dim.id,
            questionId: questionKey(dim.id, qi),
            score: scores[questionKey(dim.id, qi)]!,
            comment: comment ? comment : undefined,
          };
        }),
      );
      await submitResponses({
        data: {
          code: kode,
          role,
          name: name.trim() ? name.trim() : undefined,
          tenure: tenure ?? undefined,
          answers,
        },
      });
      try {
        window.localStorage.setItem(lockKey, new Date().toISOString());
      } catch {
        /* abaikan bila storage diblokir */
      }
      setLocked(true);
      setStep({ kind: "done" });
      window.scrollTo({ top: 0 });
    } catch {
      setError(
        "Jawaban gagal terkirim. Periksa koneksi lalu coba lagi — jawaban Anda belum hilang dari layar ini.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (locked && step.kind !== "done") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          Pengisian sudah ditutup
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Anda sudah menyelesaikan kuesioner melalui tautan ini, sehingga
          aksesnya otomatis ditutup. Bila Anda perlu mengisi kembali, mintalah
          tautan baru kepada tim asesor.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Silakan tutup halaman ini.
        </p>
      </main>
    );
  }

  if (!isLoading && !org) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Tautan tidak dikenali
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tautan pengisian ini tidak ditemukan. Silakan hubungi pihak yang
          membagikan tautan untuk memastikan alamatnya benar.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      {step.kind === "role" && (
        <section>
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {org?.name ?? "Memuat…"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Kuesioner Diagnosis Organisasi
            </h1>
            <p className="mx-auto mt-3 flex max-w-md items-start justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <span>
                Jawaban Anda <strong>rahasia</strong> dan hanya ditampilkan dalam
                bentuk gabungan (agregat) — tidak pernah per individu.
              </span>
            </p>
          </div>
          <p className="mb-4 text-center text-sm font-semibold">
            Pilih peran Anda di BMT:
          </p>
          <div className="grid gap-3">
            <RoleButton
              icon={<Landmark className="size-7" />}
              title="Saya Pengurus"
              desc="Anggota Pengurus / Pengawas / DPS"
              onClick={() => pickRole("pengurus")}
            />
            <RoleButton
              icon={<Briefcase className="size-7" />}
              title="Saya Manajemen"
              desc="GM, Kepala Cabang, Kepala Unit/Bagian"
              onClick={() => pickRole("manajemen")}
            />
            <RoleButton
              icon={<Users className="size-7" />}
              title="Saya Karyawan"
              desc="Staf dan petugas lapangan"
              onClick={() => pickRole("karyawan")}
            />
          </div>
        </section>
      )}

      {step.kind === "identity" && role && (
        <section>
          <StepHeader
            title={`Identitas Singkat — ${ROLE_LABELS[role]}`}
            subtitle="Kedua isian di bawah boleh dikosongkan. Tidak ada yang wajib diisi di halaman ini."
          />
          <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
            <div>
              <label htmlFor="nama" className="text-sm font-semibold">
                Nama{" "}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <input
                id="nama"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Boleh dikosongkan"
                className="mt-1.5 w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Boleh dikosongkan — jawaban Anda tetap dihitung dan tetap rahasia.
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold">
                Masa kerja{" "}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {TENURE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTenure(tenure === t ? null : t)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      tenure === t
                        ? "border-primary bg-accent text-accent-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <BackButton onClick={() => setStep({ kind: "role" })} />
            <button
              type="button"
              onClick={() => setStep({ kind: "dimension", index: 0 })}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Mulai Mengisi
            </button>
          </div>
        </section>
      )}

      {step.kind === "dimension" && role && (
        <DimensionStep
          index={step.index}
          total={dims.length}
          dim={dims[step.index]!}
          role={role}
          scores={scores}
          comments={comments}
          questionKey={questionKey}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          onScore={(key, value) => setScores((s) => ({ ...s, [key]: value }))}
          onComment={(dimId, value) => setComments((c) => ({ ...c, [dimId]: value }))}
          onBack={() =>
            step.index === 0
              ? setStep({ kind: "identity" })
              : setStep({ kind: "dimension", index: step.index - 1 })
          }
          onNext={() => {
            if (step.index === dims.length - 1) {
              void handleSubmit();
            } else {
              setStep({ kind: "dimension", index: step.index + 1 });
              window.scrollTo({ top: 0 });
            }
          }}
          canNext={dimensionComplete(step.index)}
          isLast={step.index === dims.length - 1}
          submitting={submitting}
          error={error}
        />
      )}

      {step.kind === "done" && (
        <section className="pt-10 text-center">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            Terima kasih atas kejujuran Anda
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Jawaban Anda sudah tersimpan dan akan digabungkan dengan jawaban
            responden lain. Hasil diagnosis hanya ditampilkan dalam bentuk
            agregat kepada tim diagnosis — tidak ada yang bisa melihat jawaban
            individu Anda.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tautan ini kini tertutup dan tidak dapat dibuka lagi. Jika Anda
            perlu mengisi ulang, mintalah tautan baru kepada tim asesor.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Silakan tutup halaman ini.
          </p>
        </section>
      )}
    </main>
  );
}

function RoleButton({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary hover:bg-accent"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        {icon}
      </span>
      <span>
        <span className="block font-display text-lg font-extrabold tracking-tight">
          {title}
        </span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-xl border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
    >
      <ChevronLeft className="size-4" />
      Kembali
    </button>
  );
}

function DimensionStep(props: {
  index: number;
  total: number;
  dim: ReturnType<typeof dimensionsForRole>[number];
  role: Role;
  scores: Record<string, number>;
  comments: Record<number, string>;
  questionKey: (dimId: number, qIdx: number) => string;
  answeredCount: number;
  totalQuestions: number;
  onScore: (key: string, value: number) => void;
  onComment: (dimId: number, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  isLast: boolean;
  submitting: boolean;
  error: string | null;
}) {
  const { dim, role, index, total } = props;
  const progress = Math.round(
    (props.answeredCount / Math.max(1, props.totalQuestions)) * 100,
  );

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-5 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">
            Dimensi {index + 1} dari {total}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {progress}% terisi
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Dimensi {dim.id}
        </p>
        <h1 className="mt-0.5 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
          {dim.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dim.description}</p>
      </div>

      <div className="space-y-4">
        {dim.questions[role].map((q, qi) => {
          const key = props.questionKey(dim.id, qi);
          const current = props.scores[key];
          return (
            <fieldset
              key={key}
              className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
            >
              <legend className="sr-only">{q}</legend>
              <p className="text-sm font-semibold leading-relaxed">
                {qi + 1}. {q}
              </p>
              <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
                {LIKERT.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => props.onScore(key, opt.value)}
                    aria-pressed={current === opt.value}
                    className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-2 transition-colors ${
                      current === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm font-extrabold tabular-nums">
                      {opt.value}
                    </span>
                    <span className="text-[10px] font-semibold leading-tight">
                      {opt.shortLabel}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>1 = Sangat Tidak Setuju</span>
                <span>5 = Sangat Setuju</span>
              </p>
            </fieldset>
          );
        })}

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <label htmlFor={`komentar-${dim.id}`} className="text-sm font-semibold">
            Ceritakan pengalaman atau contoh nyata terkait dimensi ini{" "}
            {dim.critical ? (
              <span className="text-destructive">*wajib</span>
            ) : (
              <span className="font-normal text-muted-foreground">(opsional)</span>
            )}
          </label>
          <textarea
            id={`komentar-${dim.id}`}
            rows={3}
            value={props.comments[dim.id] ?? ""}
            onChange={(e) => props.onComment(dim.id, e.target.value)}
            placeholder="Tulis apa adanya — identitas Anda tetap rahasia."
            className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {props.error && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {props.error}
        </p>
      )}

      <div className="mt-5 flex gap-3 pb-8">
        <BackButton onClick={props.onBack} />
        <button
          type="button"
          disabled={!props.canNext || props.submitting}
          onClick={props.onNext}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {props.isLast
            ? props.submitting
              ? "Mengirim…"
              : "Kirim Jawaban"
            : "Lanjut"}
        </button>
      </div>
    </section>
  );
}
