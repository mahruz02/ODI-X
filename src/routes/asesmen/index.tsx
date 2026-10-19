import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Copy,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { addProject, listProjects, removeProject, setProjectStatus } from "@/lib/admin.functions";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/asesmen/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  head: () => ({
    meta: [
      { title: "Proyek Diagnosis Organisasi — ODI-X" },
      {
        name: "description",
        content:
          "Daftar seluruh proyek diagnosis kesehatan organisasi 12 domain. Kelola profil organisasi, jadwal instrumen, dan tautan kuesioner.",
      },
      { property: "og:title", content: "Proyek Diagnosis Organisasi — ODI-X" },
      {
        property: "og:description",
        content: "Kelola proyek diagnosis per organisasi dan bagikan tautan kuesioner unik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

import { ProtectedRoute } from "@/components/ProtectedRoute";

function ProjectsPage() {
  const { data } = useSuspenseQuery(projectsQuery);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("Lembaga Keuangan Mikro Syariah / BMT");
  const [employeeCount, setEmployeeCount] = useState("35");
  const [mainProducts, setMainProducts] = useState("Simpanan & Pembiayaan Syariah");
  const [strengths, setStrengths] = useState("");
  const [challenges, setChallenges] = useState("");
  const [priorities12m, setPriorities12m] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Error & deletion modal states
  const [createError, setCreateError] = useState<string | null>(null);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      startedOn?: string;
      sector?: string;
      employeeCount?: number;
      mainProducts?: string;
      strengths?: string;
      challenges?: string;
      priorities12m?: string;
    }) => addProject({ data: input }),
    onSuccess: () => {
      setName("");
      setSector("Lembaga Keuangan Mikro Syariah / BMT");
      setEmployeeCount("35");
      setMainProducts("Simpanan & Pembiayaan Syariah");
      setStrengths("");
      setChallenges("");
      setPriorities12m("");
      setStartedOn("");
      setCreateError(null);
      setShowForm(false);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {
      setCreateError(err?.message || "Gagal membuat proyek asesmen baru.");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (input: { id: string; status: "berjalan" | "selesai" }) =>
      setProjectStatus({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const destroy = useMutation({
    mutationFn: (input: { id: string }) => removeProject({ data: input }),
    onSuccess: () => {
      setOrgToDelete(null);
      setConfirmText("");
      setDeleteError(null);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {
      setDeleteError(err?.message || "Gagal menghapus proyek asesmen.");
    },
  });

  const respondentsOf = (orgId: string) =>
    data.progress
      .filter((p) => p.organization_id === orgId && p.role)
      .reduce((a, b) => a + Number(b.respondents ?? 0), 0);

  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Tahap 1 — Setup Organisasi & Proyek Diagnosis
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Proyek Diagnosis Organisasi
            </h1>
            <p className="mt-2 max-w-3xl text-xs text-muted-foreground leading-relaxed">
              Satu proyek diagnosis untuk satu organisasi. Lengkapi Organization Profile (sektor,
              jumlah karyawan, tantangan, prioritas 12 bulan) dan bagikan tautan kuesioner unik
              untuk triangulasi 4 prespektif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setCreateError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
          >
            <Plus className="size-4" />
            {showForm ? "Tutup Form" : "Buat Proyek Diagnosis Baru"}
          </button>
        </header>

        {showForm && (
          <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-4 border-b pb-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Formulir Profile Organisasi & Inisiasi Asesmen Baru
              </h2>
              <p className="text-xs text-muted-foreground">
                Isi data kerangka dasar organisasi sebelum menyebarkan tautan kuesioner. Kolom bertanda{" "}
                <span className="font-semibold text-destructive">* Wajib</span> harus diisi.
              </p>
            </div>

            {createError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gagal Menyimpan Proyek</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{createError}</p>
                </div>
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setCreateError(null);
                if (name.trim().length < 2) {
                  setCreateError("Nama Organisasi minimal harus terdiri dari 2 karakter.");
                  return;
                }
                create.mutate({
                  name: name.trim(),
                  sector,
                  employeeCount: Number(employeeCount) || 25,
                  mainProducts,
                  strengths,
                  challenges,
                  priorities12m,
                  ...(startedOn ? { startedOn } : {}),
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Nama Organisasi / BMT</label>
                    <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      * Wajib Diisi
                    </span>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="mis. BMT Amanah Sejahtera"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Nama resmi lembaga yang akan dievaluasi kesehatannya.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Sektor / Jenis Lembaga</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <input
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Lembaga Keuangan Mikro Syariah / BMT"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Klasifikasi bidang organisasi (mis. LKMS, KSPPS, Yayasan).
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Jumlah Karyawan / Staf</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="number"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    placeholder="35"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Produk / Layanan Utama</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <input
                    value={mainProducts}
                    onChange={(e) => setMainProducts(e.target.value)}
                    placeholder="Simpanan & Pembiayaan Syariah"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Jadwal Mulai Diagnosis</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional (Hari Ini)
                    </span>
                  </div>
                  <input
                    type="date"
                    value={startedOn}
                    onChange={(e) => setStartedOn(e.target.value)}
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Kekuatan Utama Organisasi</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="mis. Loyalitas anggota tinggi, brand syariah kuat"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Tantangan Utama</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="mis. NPF cabang meningkat, digitalisasi belum penuh"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Prioritas 12 Bulan Ke Depan</label>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Opsional
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={priorities12m}
                    onChange={(e) => setPriorities12m(e.target.value)}
                    placeholder="mis. Penyehatan NPF, restrukturisasi SOP"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {create.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyimpan Proyek…
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Simpan & Buat Proyek
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="space-y-4">
          {data.organizations.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-xs text-muted-foreground">
              Belum ada proyek diagnosis. Klik "Buat Proyek Diagnosis Baru" di atas.
            </p>
          )}
          {data.organizations.map((org) => {
            const link =
              typeof window !== "undefined"
                ? `${window.location.origin}/isi/${org.code}`
                : `/isi/${org.code}`;
            return (
              <article
                key={org.id}
                className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/asesmen/$id"
                        params={{ id: org.id }}
                        className="font-display text-lg font-bold tracking-tight hover:underline text-foreground"
                      >
                        {org.name}
                      </Link>
                      <span className="rounded-full border bg-accent/30 px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                        {org.sector || "LKMS / BMT"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mulai {org.started_on} · Kode Unik Tautan:{" "}
                      <span className="font-mono font-semibold text-foreground">{org.code}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold">
                      <Users className="size-3.5 text-primary" />
                      {respondentsOf(org.id)} Responden
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleStatus.mutate({
                          id: org.id,
                          status: org.status === "selesai" ? "berjalan" : "selesai",
                        })
                      }
                      className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                    >
                      {org.status === "selesai" ? "Selesai" : "Aktif Berjalan"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <code className="max-w-full truncate rounded-lg bg-muted px-3 py-2 text-xs font-mono">
                    {link}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(link);
                      setCopied(org.id);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold transition-colors hover:bg-muted"
                  >
                    <Copy className="size-3.5" />
                    {copied === org.id ? "Tersalin!" : "Salin Tautan"}
                  </button>
                  <Link
                    to="/asesmen/$id"
                    params={{ id: org.id }}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
                  >
                    Buka Dashboard Diagnosis
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgToDelete({ id: org.id, name: org.name });
                      setConfirmText("");
                      setDeleteError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus Proyek
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Confirmation Modal for Project Deletion */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-destructive">
                <span className="flex size-9 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className="size-5" />
                </span>
                <h3 className="font-display text-base font-bold text-foreground">
                  Hapus Proyek Asesmen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrgToDelete(null);
                  setDeleteError(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Apakah Anda yakin ingin menghapus proyek diagnosis{" "}
              <strong className="text-foreground font-semibold">"{orgToDelete.name}"</strong>? Seluruh
              data kuesioner responden, tautan token, dan catatan triangulasi akan dihapus secara permanen.
            </p>

            {deleteError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>{deleteError}</p>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-foreground">
                Ketik <span className="font-mono font-bold text-destructive">HAPUS</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="HAPUS"
                className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <button
                type="button"
                disabled={destroy.isPending}
                onClick={() => {
                  setOrgToDelete(null);
                  setDeleteError(null);
                }}
                className="rounded-xl border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmText !== "HAPUS" || destroy.isPending}
                onClick={() => destroy.mutate({ id: orgToDelete.id })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {destroy.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Menghapus…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    Hapus Permanen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
