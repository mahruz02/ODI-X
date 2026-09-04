import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ClipboardPen, Copy, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { RadarTriChart, type RadarDatum } from "@/components/RadarTriChart";
import {
  getDashboardData,
  getRespondents,
  removeRespondent,
  removeResponsesByRole,
} from "@/lib/admin.functions";
import {
  DIMENSIONS,
  GAP_LABELS,
  ROLE_LABELS,
  gapLevel,
  type GapLevel,
  type Role,
} from "@/lib/questionnaire";

const dashboardQuery = (id: string) =>
  queryOptions({
    queryKey: ["dashboard", id],
    queryFn: () => getDashboardData({ data: { id } }),
  });

export const Route = createFileRoute("/asesmen/$id/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(dashboardQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Dashboard Organisasi — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Radar 10 dimensi kesehatan organisasi BMT dengan perbandingan persepsi Pengurus, Manajemen, dan Karyawan — gap persepsi otomatis ditandai.",
      },
      { property: "og:title", content: "Dashboard Organisasi — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "Radar 10 dimensi kesehatan organisasi BMT dari tiga sudut pandang sekaligus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const ROLES: Role[] = ["pengurus", "manajemen", "karyawan"];

const GAP_BADGE_CLASS: Record<GapLevel, string> = {
  high: "badge-gap-high",
  mid: "badge-gap-mid",
  low: "badge-gap-low",
};

function DashboardPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(dashboardQuery(id));
  const [copied, setCopied] = useState(false);

  const scores = data.scores;

  const byDimension = useMemo(() => {
    const map = new Map<number, Partial<Record<Role, { sum: number; n: number }>>>();
    for (const row of scores) {
      const entry = map.get(row.dimension) ?? {};
      const prev = entry[row.role] ?? { sum: 0, n: 0 };
      entry[row.role] = {
        sum: prev.sum + row.avg_score * row.respondents,
        n: prev.n + row.respondents,
      };
      map.set(row.dimension, entry);
    }
    return DIMENSIONS.map((dim) => {
      const entry = map.get(dim.id) ?? {};
      const roleScores: Partial<Record<Role, number | null>> = {};
      for (const role of ROLES) {
        const e = entry[role];
        roleScores[role] = e && e.n > 0 ? e.sum / e.n : null;
      }
      const present = ROLES.map((r) => roleScores[r]).filter(
        (v): v is number => v != null,
      );
      const gap =
        present.length >= 2 ? Math.max(...present) - Math.min(...present) : 0;
      return { dim, roleScores, gap };
    });
  }, [scores]);

  const radarData: RadarDatum[] = byDimension.map((d) => ({
    label: d.dim.short,
    pengurus: d.roleScores.pengurus ?? null,
    manajemen: d.roleScores.manajemen ?? null,
    karyawan: d.roleScores.karyawan ?? null,
  }));

  const totalRespondents = useMemo(() => {
    const perRole = new Map<string, number>();
    for (const row of scores) {
      perRole.set(row.role, Math.max(perRole.get(row.role) ?? 0, row.respondents));
    }
    return [...perRole.values()].reduce((a, b) => a + b, 0);
  }, [scores]);

  const flagged = useMemo(
    () =>
      [...byDimension]
        .filter((d) => gapLevel(d.gap) !== "low")
        .sort((a, b) => b.gap - a.gap),
    [byDimension],
  );

  const flaggedComments = useMemo(() => {
    const flaggedIds = new Set(flagged.map((f) => f.dim.id));
    return data.comments.filter((c) => flaggedIds.has(c.dimension)).slice(0, 6);
  }, [data.comments, flagged]);

  const publicLink =
    typeof window !== "undefined" && data.organization
      ? `${window.location.origin}/isi/${data.organization.code}`
      : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link
          to="/asesmen"
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          ← Semua Asesmen Organisasi
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {data.organization?.name ?? "Organisasi"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Skor 10 dimensi dari tiga sudut pandang sekaligus, untuk organisasi ini
          secara keseluruhan. Garis yang berjauhan pada radar menandakan{" "}
          <em>gap persepsi</em> — area yang perlu digali lebih dalam.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          to="/asesmen/$id/triangulasi"
          params={{ id }}
          className="rounded-xl border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Peta Triangulasi
        </Link>
        <Link
          to="/asesmen/$id/kualitatif"
          params={{ id }}
          className="rounded-xl border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Data Kualitatif
        </Link>
        <Link
          to="/asesmen/$id/laporan"
          params={{ id }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Laporan Diagnosis
        </Link>
        {publicLink && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(publicLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Copy className="size-4" />
            {copied ? "Tautan tersalin" : "Salin tautan pengisian"}
          </button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" />}
          label="Responden Kuesioner"
          value={String(totalRespondents)}
        />
        <StatCard
          icon={<ClipboardPen className="size-4" />}
          label="Status Diagnosis"
          value={data.organization?.status === "selesai" ? "Selesai" : "Berjalan"}
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Dimensi Gap Tinggi"
          value={String(flagged.filter((f) => gapLevel(f.gap) === "high").length)}
        />
        <StatCard
          icon={<ClipboardPen className="size-4" />}
          label="Perlu Perhatian"
          value={String(flagged.filter((f) => gapLevel(f.gap) === "mid").length)}
        />
      </div>

      <section className="mb-10 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Radar 10 Dimensi — Tiga Sudut Pandang
          </h2>
          <span className="text-xs text-muted-foreground">Skala 1–5</span>
        </div>
        <RadarTriChart data={radarData} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Semakin lebar jarak antar garis pada satu dimensi, semakin besar gap
          persepsi antar level pada dimensi tersebut.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">
          Skor & Gap Persepsi per Dimensi
        </h2>
        <div className="space-y-3">
          {byDimension.map(({ dim, roleScores, gap }) => {
            const level = gapLevel(gap);
            return (
              <article
                key={dim.id}
                className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold tracking-tight">
                      {dim.id}. {dim.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{dim.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${GAP_BADGE_CLASS[level]}`}
                  >
                    {GAP_LABELS[level]}
                    {gap > 0 ? ` · Δ ${gap.toFixed(2)}` : ""}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {ROLES.map((role) => {
                    const v = roleScores[role];
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                          {ROLE_LABELS[role]}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          {v != null && (
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(v / 5) * 100}%`,
                                background: `var(--chart-${role})`,
                              }}
                            />
                          )}
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums">
                          {v != null ? v.toFixed(2) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {flaggedComments.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
            Kutipan dari Dimensi dengan Gap Persepsi
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Komentar terbuka responden — ditampilkan anonim, hanya peran.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {flaggedComments.map((c, i) => (
              <blockquote
                key={i}
                className="rounded-2xl border bg-card p-4 text-sm shadow-sm"
              >
                <p className="leading-relaxed">“{c.comment}”</p>
                <footer className="mt-3 text-xs font-medium text-muted-foreground">
                  {ROLE_LABELS[c.role]} · Dimensi{" "}
                  {DIMENSIONS.find((d) => d.id === c.dimension)?.short}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
      <ResponseManager id={id} />
    </main>
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
    <section className="mb-10">
      <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
        Kelola Data Responden
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Hapus isian per responden, atau kosongkan seluruh isian satu peran
        (pengurus, manajemen, karyawan). Penghapusan bersifat permanen dan
        langsung memperbarui radar serta laporan.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            disabled={delRole.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Hapus SEMUA isian ${ROLE_LABELS[role]} pada asesmen ini?`,
                )
              ) {
                delRole.mutate(role);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Hapus semua {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data responden…</p>
      ) : respondents.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada isian kuesioner yang masuk.
        </p>
      ) : (
        <div className="space-y-2">
          {respondents.map((r) => (
            <div
              key={r.respondent_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {r.name?.trim() ? r.name : "Anonim"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {ROLE_LABELS[r.role as Role] ?? r.role}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.answers} jawaban
                  {r.tenure ? ` · masa kerja ${r.tenure}` : ""} ·{" "}
                  {new Date(r.submitted_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                disabled={delOne.isPending}
                onClick={() => {
                  if (window.confirm("Hapus seluruh isian responden ini?")) {
                    delOne.mutate(r.respondent_id);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}
