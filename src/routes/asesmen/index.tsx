import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import {
  addProject,
  listProjects,
  removeProject,
  setProjectStatus,
} from "@/lib/admin.functions";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/asesmen/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  head: () => ({
    meta: [
      { title: "Asesmen Organisasi — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Daftar seluruh asesmen organisasi BMT yang sedang dan pernah ditangani, lengkap dengan status pengisian dan tautan kuesioner unik per organisasi.",
      },
      { property: "og:title", content: "Asesmen Organisasi — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "Kelola asesmen per organisasi BMT dan bagikan tautan kuesioner unik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data } = useSuspenseQuery(projectsQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (input: { name: string; startedOn?: string }) =>
      addProject({ data: input }),
    onSuccess: () => {
      setName("");
      setStartedOn("");
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (input: { id: string; status: "berjalan" | "selesai" }) =>
      setProjectStatus({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const destroy = useMutation({
    mutationFn: (input: { id: string }) => removeProject({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const respondentsOf = (orgId: string) =>
    data.progress
      .filter((p) => p.organization_id === orgId && p.role)
      .reduce((a, b) => a + Number(b.respondents ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Ruang Kerja Asesor
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Asesmen Organisasi
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Satu asesmen untuk satu organisasi BMT. Data tiap organisasi terpisah
          sepenuhnya, dan setiap asesmen punya tautan kuesioner unik yang bisa
          dibagikan langsung ke BMT yang bersangkutan.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Buat Asesmen Organisasi Baru
        </h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length < 2) return;
            create.mutate({
              name: name.trim(),
              ...(startedOn ? { startedOn } : {}),
            });
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Organisasi BMT"
            className="rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
            className="rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="size-4" />
            {create.isPending ? "Menyimpan…" : "Buat Asesmen"}
          </button>
        </form>
        {create.isError && (
          <p className="mt-3 text-sm text-destructive">
            Asesmen gagal dibuat. Periksa koneksi lalu coba lagi.
          </p>
        )}
      </section>

      <div className="space-y-3">
        {data.organizations.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada asesmen organisasi. Buat asesmen pertama Anda di atas.
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
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/asesmen/$id"
                    params={{ id: org.id }}
                    className="font-display text-lg font-bold tracking-tight hover:underline"
                  >
                    {org.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mulai {org.started_on} · Kode tautan{" "}
                    <span className="font-mono">{org.code}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
                    <Users className="size-3.5" />
                    {respondentsOf(org.id)} responden
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
                    {org.status === "selesai" ? "Selesai" : "Berjalan"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="max-w-full truncate rounded-lg bg-muted px-3 py-2 text-xs">
                  {link}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(link);
                    setCopied(org.id);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  <Copy className="size-3.5" />
                  {copied === org.id ? "Tersalin" : "Salin tautan"}
                </button>
                <Link
                  to="/asesmen/$id"
                  params={{ id: org.id }}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Buka Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Hapus asesmen \"${org.name}\" beserta SELURUH data (jawaban kuesioner, FGD, wawancara, telaah dokumen)? Tindakan ini tidak bisa dibatalkan.`,
                      )
                    ) {
                      destroy.mutate({ id: org.id });
                    }
                  }}
                  disabled={destroy.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  Hapus Asesmen
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
