import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Landmark,
  Lock,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getLinkByToken,
  getOrganizationByCode,
  submitResponses,
  submitTokenResponses,
} from "@/lib/diagnosis.functions";
import { LIKERT, ROLE_LABELS, dimensionsForRole, type Role } from "@/lib/questionnaire";

const orgQuery = (code: string) =>
  queryOptions({
    queryKey: ["org-by-code", code],
    queryFn: async () => {
      // First try to load as respondent token link
      const link = await getLinkByToken({ data: { token: code } });
      if (link) return { isLinkToken: true, link, org: link.organizations };
      // Fallback to code lookup
      const org = await getOrganizationByCode({ data: { code } });
      return { isLinkToken: false, link: null, org };
    },
  });

export const Route = createFileRoute("/isi/$kode")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orgQuery(params.kode)),
  head: () => ({
    meta: [
      { title: "Isi Kuesioner Diagnosis — ODI-X" },
      {
        name: "description",
        content:
          "Kuesioner diagnosis 12 domain kesehatan organisasi. Anonim, tanpa login — jawaban Anda dihitung secara agregat.",
      },
      { property: "og:title", content: "Isi Kuesioner Diagnosis — ODI-X" },
      {
        property: "og:description",
        content: "Kuesioner diagnosis 12 domain kesehatan organisasi. Anonim, tanpa login.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IsiPage,
});

const TENURE_OPTIONS = ["< 1 tahun", "1–3 tahun", "3–5 tahun", "> 5 tahun"];

type Step =
  { kind: "role" } | { kind: "identity" } | { kind: "dimension"; index: number } | { kind: "done" };

function IsiPage() {
  const { kode } = Route.useParams();
  const { data: resData, isLoading } = useQuery(orgQuery(kode));
  const org = resData?.org;
  const linkToken = resData?.isLinkToken ? resData.link : null;

  const [step, setStep] = useState<Step>({ kind: "role" });
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [tenure, setTenure] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  const [lockKey, setLockKey] = useState(`odix:selesai:${kode}`);
  const draftKey = `odix:draft:${kode}`;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Muat draft otomatis dari localStorage jika ada
    try {
      const savedDraft = window.localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.scores && Object.keys(parsed.scores).length > 0) {
          setScores(parsed.scores);
          if (parsed.comments) setComments(parsed.comments);
          if (parsed.role) setRole(parsed.role);
          if (parsed.name) setName(parsed.name);
          if (parsed.tenure) setTenure(parsed.tenure);
          if (parsed.savedAt)
            setDraftSavedTime(
              new Date(parsed.savedAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            );
        }
      }
    } catch {
      /* abaikan bila draft corrupt atau storage diblokir */
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [draftKey]);

  // Autosave draft setiap perubahan skor/komentar/peran
  useEffect(() => {
    if (Object.keys(scores).length === 0) return;
    try {
      const draftPayload = {
        role,
        name,
        tenure,
        scores,
        comments,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      setDraftSavedTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch {
      /* storage kuota penuh / diblokir */
    }
  }, [scores, comments, role, name, tenure, draftKey]);

  useEffect(() => {
    if (linkToken) {
      setRole(linkToken.perspective as Role);
      if (linkToken.respondent_name) setName(linkToken.respondent_name);
      if (linkToken.status === "completed") setLocked(true);
    }
  }, [linkToken]);

  useEffect(() => {
    const tokenParam = new URLSearchParams(window.location.search).get("t") ?? "";
    const key = `odix:selesai:${kode}${tokenParam ? `:${tokenParam}` : ""}`;
    setLockKey(key);
    try {
      if (window.localStorage.getItem(key)) setLocked(true);
    } catch {
      /* storage tidak tersedia */
    }
  }, [kode]);

  const dims = useMemo(() => (role ? dimensionsForRole(role) : []), [role]);
  const totalQuestions = dims.reduce((acc, d) => acc + (d.questions[role!]?.length || 0), 0);
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
    const dim = dims[index];
    if (!dim) return false;
    const questions = dim.questions[role] || [];
    const allScored = questions.every((_, qi) => scores[questionKey(dim.id, qi)] != null);
    if (!allScored) return false;
    if (dim.critical && !comments[String(dim.id)]?.trim()) return false;
    return true;
  }

  async function handleSubmit() {
    if (!role) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers = dims.flatMap((dim) =>
        (dim.questions[role] || []).map((_, qi) => {
          const comment = comments[String(dim.id)]?.trim();
          const question = (dim.questions[role] || [])[qi];
          return {
            dimension: dim.id,
            questionId: questionKey(dim.id, qi),
            score: scores[questionKey(dim.id, qi)]!,
            comment: comment ? comment : undefined,
            evidenceText: comments[`${dim.id}-ev-${qi}`]?.trim() || undefined,
            conflictText: comments[`${dim.id}-cf-${qi}`]?.trim() || undefined,
            isNa: scores[questionKey(dim.id, qi)] === 0,
          };
        }),
      );

      if (linkToken) {
        await submitTokenResponses({
          data: {
            token: kode,
            name: name.trim() ? name.trim() : undefined,
            tenure: tenure ?? undefined,
            answers,
          },
        });
      } else {
        await submitResponses({
          data: {
            code: kode,
            role,
            name: name.trim() ? name.trim() : undefined,
            tenure: tenure ?? undefined,
            answers,
          },
        });
      }

      try {
        window.localStorage.setItem(lockKey, new Date().toISOString());
        window.localStorage.removeItem(draftKey);
      } catch {
        /* abaikan bila storage diblokir */
      }
      setLocked(true);
      setShowConfirmModal(false);
      setStep({ kind: "done" });
      window.scrollTo({ top: 0 });
    } catch {
      setError(
        "Jawaban gagal terkirim. Periksa koneksi lalu coba lagi — jawaban Anda aman tersimpan di draft lokal perangkat ini.",
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
          Pengisian Sudah Ditutup
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Anda sudah menyelesaikan kuesioner melalui tautan ini, sehingga aksesnya otomatis ditutup.
          Bila Anda perlu mengisi kembali, hubungi tim asesor.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">Silakan tutup halaman ini.</p>
      </main>
    );
  }

  if (!isLoading && !org) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Tautan Tidak Dikenali
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tautan pengisian ini tidak ditemukan. Silakan hubungi pihak yang membagikan tautan.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      {step.kind === "role" && (
        <section>
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {org?.name ?? "ODI-X Assessment"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Kuesioner Diagnosis Organisasi (12 Domain)
            </h1>
            <p className="mx-auto mt-3 flex max-w-md items-start justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <span>
                Jawaban Anda <strong>rahasia & anonim</strong> — hanya dihitung dalam bentuk agregat
                untuk analisis kesehatan organisasi.
              </span>
            </p>
          </div>
          <p className="mb-4 text-center text-sm font-semibold">
            Pilih sudut pandang / peran Anda:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleButton
              icon={<Landmark className="size-6" />}
              title="Leadership / Pengurus"
              desc="Pengurus, Pengawas, Direksi Utama"
              onClick={() => pickRole("pengurus")}
            />
            <RoleButton
              icon={<Briefcase className="size-6" />}
              title="Manager / Manajemen"
              desc="GM, Kepala Cabang, Kepala Dept/Unit"
              onClick={() => pickRole("manajemen")}
            />
            <RoleButton
              icon={<Users className="size-6" />}
              title="Employee / Karyawan"
              desc="Staf pelaksana & operasional"
              onClick={() => pickRole("karyawan")}
            />
            <RoleButton
              icon={<UserCheck className="size-6" />}
              title="Stakeholder / Mitra"
              desc="Anggota, Nasabah, Mitra Eksternal"
              onClick={() => pickRole("stakeholder")}
            />
          </div>
        </section>
      )}

      {step.kind === "identity" && role && (
        <section>
          <StepHeader
            title={`Identitas Singkat — ${ROLE_LABELS[role]}`}
            subtitle="Isian di bawah bersifat opsional untuk memudahkan analisis demografi."
          />
          <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
            {draftSavedTime && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Draft tersimpan pukul {draftSavedTime}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.removeItem(draftKey);
                    setScores({});
                    setComments({});
                    setDraftSavedTime(null);
                  }}
                  className="rounded-lg border bg-background px-3 py-1.5 font-bold text-destructive hover:bg-destructive/10"
                >
                  Reset Draft
                </button>
              </div>
            )}
            <div>
              <label htmlFor="nama" className="text-sm font-semibold">
                Nama / Inisial <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <input
                id="nama"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Boleh dikosongkan untuk anonimitas penuh"
                className="mt-1.5 w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <span className="text-sm font-semibold">
                Masa kerja / Keterlibatan{" "}
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
              Mulai Mengisi Kuesioner
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
              setShowConfirmModal(true);
            } else {
              setStep({ kind: "dimension", index: step.index + 1 });
              window.scrollTo({ top: 0 });
            }
          }}
          canNext={dimensionComplete(step.index)}
          isLast={step.index === dims.length - 1}
          submitting={submitting}
          error={error}
          isOnline={isOnline}
          draftSavedTime={draftSavedTime}
        />
      )}

      {/* Modal Konfirmasi Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold tracking-tight">
              Konfirmasi Pengiriman Jawaban
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Anda telah mengisi {answeredCount} dari {totalQuestions} pertanyaan kuesioner. Setelah
              dikirimkan, jawaban bersifat final dan tautan ini akan ditutup.
            </p>
            {!isOnline && (
              <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 font-medium">
                Perangkat Anda sedang offline. Jawaban telah tersimpan di draft lokal dan akan
                dikirimkan begitu koneksi kembali pulih.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border px-4 py-2.5 text-xs font-semibold hover:bg-muted"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Ya, Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step.kind === "done" && (
        <section className="pt-10 text-center">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            Terima Kasih Atas Partisipasi Anda
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Jawaban Anda telah tersimpan aman dan divalidasi. Hasil agregat akan diolah oleh tim
            asesor untuk menyusun rekomendasi perbaikan organisasi.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">Silakan tutup halaman ini.</p>
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
      className="flex items-center gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:bg-accent/40"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </span>
      <div>
        <span className="block font-display text-base font-extrabold tracking-tight">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </div>
    </button>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
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
  comments: Record<string, string>;
  questionKey: (dimId: number, qIdx: number) => string;
  answeredCount: number;
  totalQuestions: number;
  onScore: (key: string, value: number) => void;
  onComment: (dimId: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  isLast: boolean;
  submitting: boolean;
  error: string | null;
  isOnline?: boolean;
  draftSavedTime?: string | null;
}) {
  const { dim, role, index, total, isOnline = true, draftSavedTime } = props;
  const progress = Math.round((props.answeredCount / Math.max(1, props.totalQuestions)) * 100);
  const questions = dim.questions[role] || [];

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-5 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 shadow-sm">
        <div className="mb-1.5 flex flex-wrap items-center justify-between text-xs font-semibold gap-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Domain {index + 1} dari {total}
            </span>
            {!isOnline && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Offline Mode
              </span>
            )}
            {draftSavedTime && (
              <span className="text-[10px] font-normal text-muted-foreground">
                Draft tersimpan ({draftSavedTime})
              </span>
            )}
          </div>
          <span className="tabular-nums text-primary font-bold">
            {progress}% terisi ({props.answeredCount}/{props.totalQuestions})
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Domain {dim.id}
        </p>
        <h1 className="mt-0.5 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
          {dim.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dim.description}</p>
      </div>

      {/* Likert Scale Reference Guide */}
      <div className="mb-5 rounded-xl border bg-muted/40 p-3 text-[11px] text-muted-foreground">
        <span className="font-bold text-foreground">Panduan Skala Nilai:</span> 1: Sangat Rendah /
        Tidak Pernah · 2: Rendah · 3: Cukup / Sedang · 4: Baik / Terkelola · 5: Sangat Baik /
        Optimal · N/A: Tidak Berlaku.
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const key = props.questionKey(dim.id, qi);
          const current = props.scores[key];
          const isAnswered = current != null;
          return (
            <fieldset
              key={key}
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 transition-all ${
                isAnswered ? "bg-card border-primary/30" : "bg-card border-dashed"
              }`}
            >
              <legend className="sr-only">{q}</legend>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-relaxed">
                  {qi + 1}. {q}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isAnswered
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isAnswered ? "Terisi" : "Belum"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-6 gap-1.5 sm:gap-2">
                {LIKERT.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => props.onScore(key, opt.value)}
                    aria-pressed={current === opt.value}
                    className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-2 transition-all ${
                      current === opt.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm font-extrabold tabular-nums">{opt.value}</span>
                    <span className="text-[10px] font-semibold leading-tight">
                      {opt.shortLabel}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => props.onScore(key, 0)}
                  aria-pressed={current === 0}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-2 transition-all ${
                    current === 0
                      ? "border-primary bg-muted-foreground text-card shadow-sm font-bold"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-extrabold">N/A</span>
                  <span className="text-[9px] font-semibold leading-tight">Tidak Berlaku</span>
                </button>
              </div>

              {/* Conditional Evidence & Conflict Prompt when score <= 2 */}
              {current != null && current > 0 && current <= 2 && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-700">
                    Skor rendah terdeteksi — Mohon sertakan bukti/alasan pendukung:
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-900">
                      {dim.evidencePrompt ||
                        "Jelaskan perilaku atau bukti nyata di lapangan yang menjadi alasan penilaian ini:"}
                    </label>
                    <textarea
                      rows={2}
                      value={props.comments[`${dim.id}-ev-${qi}`] ?? ""}
                      onChange={(e) => props.onComment(`${dim.id}-ev-${qi}`, e.target.value)}
                      placeholder="Contoh kejadian atau praktik nyata..."
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-900">
                      {dim.conflictPrompt ||
                        "Apakah ada perbedaan pendapat antar atasan/staf terkait isu ini?"}
                    </label>
                    <textarea
                      rows={2}
                      value={props.comments[`${dim.id}-cf-${qi}`] ?? ""}
                      onChange={(e) => props.onComment(`${dim.id}-cf-${qi}`, e.target.value)}
                      placeholder="Perbedaan pandangan atau kendala komunikasi..."
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <label htmlFor={`komentar-${dim.id}`} className="text-sm font-semibold">
            Masukan / Catatan Tambahan Terbuka{" "}
            {dim.critical ? (
              <span className="text-destructive">*wajib</span>
            ) : (
              <span className="font-normal text-muted-foreground">(opsional)</span>
            )}
          </label>
          <textarea
            id={`komentar-${dim.id}`}
            rows={3}
            value={props.comments[String(dim.id)] ?? ""}
            onChange={(e) => props.onComment(String(dim.id), e.target.value)}
            placeholder="Sampaikan fakta/pengalaman nyata terkait domain ini secara objektif..."
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
              : "Kirim Seluruh Jawaban"
            : "Domain Berikutnya"}
        </button>
      </div>
    </section>
  );
}
