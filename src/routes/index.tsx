import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Layers, Radar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DiagnosaBMT — Diagnosis Organisasi BMT/KSPPS" },
      {
        name: "description",
        content:
          "Alat kerja asesor untuk mendiagnosis kesehatan organisasi BMT/KSPPS: triangulasi persepsi Pengurus, Manajemen, dan Karyawan pada 10 dimensi.",
      },
      { property: "og:title", content: "DiagnosaBMT — Diagnosis Organisasi BMT/KSPPS" },
      {
        property: "og:description",
        content:
          "Kelola banyak asesmen organisasi BMT, sebar tautan pengisian anonim, dan baca hasilnya dalam radar tiga-garis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Alat kerja asesor organisasi
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Diagnosis organisasi BMT, satu asesmen satu BMT.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Buat asesmen organisasi untuk tiap BMT, sebarkan satu tautan pengisian
          anonim, lalu baca kesenjangan persepsi Pengurus, Manajemen, dan
          Karyawan pada 10 dimensi kesehatan organisasi.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/asesmen"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buka Daftar Asesmen
          </Link>
          <Link
            to="/asesmen"
            className="rounded-xl border bg-card px-5 py-3 text-sm font-bold transition-colors hover:bg-muted"
          >
            Buat Asesmen Baru
          </Link>

        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        <Feature
          icon={<Layers className="size-5" />}
          title="Multi-organisasi"
          desc="Tiap BMT punya asesmen, kode tautan, dan data yang benar-benar terpisah."
        />
        <Feature
          icon={<ClipboardList className="size-5" />}
          title="Pengisian tanpa login"
          desc="Responden cukup membuka tautan, memilih peran, dan mengisi dari ponsel."
        />
        <Feature
          icon={<Radar className="size-5" />}
          title="Radar tiga-garis"
          desc="Persepsi tiga lapis organisasi ditumpuk agar celahnya langsung terlihat."
        />
        <Feature
          icon={<ShieldCheck className="size-5" />}
          title="Triangulasi"
          desc="Kuesioner, FGD, wawancara, dan telaah dokumen dipetakan per dimensi."
        />
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <h2 className="mt-3 font-display text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
