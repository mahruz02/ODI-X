import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, ClipboardList, Layers, Radar, ShieldCheck, Users, Workflow } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ODI-X — Sistem Diagnosis Kesehatan Organisasi 12 Domain" },
      {
        name: "description",
        content:
          "Platform diagnosis kesehatan organisasi komprehensif 12 domain: triangulasi persepsi 4 level (Leadership, Manager, Employee, Stakeholder), data kuantitatif, skoring, dan roadmap rekomendasi.",
      },
      { property: "og:title", content: "ODI-X — Diagnosis Kesehatan Organisasi" },
      {
        property: "og:description",
        content:
          "Triangulasi persepsi 4 level dan 12 domain kesehatan organisasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <section className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border bg-accent/40 px-3.5 py-1 text-xs font-bold text-accent-foreground">
          <Activity className="size-3.5 text-primary" /> ODI-X kerangka kerja utama v2.0
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
          Diagnosis Kesehatan Organisasi 12 Domain.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Sistem diagnosis organisasi komprehensif: gabungkan persepsi 4 prespektif (Leadership, Manager, Employee, Stakeholder), data objektif kuantitatif, FGD, wawancara, dan telaah dokumen ke dalam satu peta radar dan roadmap rekomendasi 4 horizon.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/asesmen"
            className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            Ruang Kerja Asesor & Proyek
          </Link>
          <Link
            to="/asesmen"
            className="rounded-xl border bg-card px-6 py-3.5 text-sm font-bold transition-all hover:bg-muted"
          >
            Inisiasi Diagnosis Baru
          </Link>
        </div>
      </section>

      {/* 5 Steps Kerangka Utama Flowchart Overview */}
      <section className="mt-16 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight mb-2">
          5 Tahap Alur Kerangka Utama ODI-X
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Proses diagnosis terstandar dari setup hingga roadmap rekomendasi tindakan.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StepBox
            step="1"
            title="Setup Organisasi"
            desc="Role auth (Super Admin, Org Admin, Leadership, Respondent, Analyst), Profile Organisasi, dan pembuatan proyek."
          />
          <StepBox
            step="2"
            title="Kuesioner 12 Domain"
            desc="Pengisian 12 domain dari 4 sudut pandang dengan rating Likert 1-5, N/A, dan masukan terbuka."
          />
          <StepBox
            step="3"
            title="Data & Dokumen"
            desc="Upload data kuantitatif (target vs actual) & dokumen bukti pendukung lengkap dengan Confidence Level."
          />
          <StepBox
            step="4"
            title="Triangulasi & Skoring"
            desc="Normalisasi 0-100, Health Index, Alignment Index, Adaptability Index, Maturity Level, dan Risk Exposure."
          />
          <StepBox
            step="5"
            title="Laporan & Roadmap"
            desc="Dashboard eksekutif, laporan per audiens, dan roadmap rekomendasi 4 horizon waktu."
          />
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature
          icon={<Layers className="size-5" />}
          title="12 Domain Komprehensif"
          desc="Mencakup Konteks Eksternal, Strategi, Kepemimpinan, Struktur, Budaya, SDM, hingga Stakeholder Experience."
        />
        <Feature
          icon={<Users className="size-5" />}
          title="4 Prespektif Responden"
          desc="Membandingkan persepsi Leadership, Manager, Employee, dan Stakeholder secara terpisah."
        />
        <Feature
          icon={<Radar className="size-5" />}
          title="Indeks Komposit & Radar"
          desc="Health Index (0-100), Alignment Index, Adaptability Index, Maturity Level, dan paparan risiko."
        />
        <Feature
          icon={<Workflow className="size-5" />}
          title="Roadmap 4 Horizon"
          desc="Rekomendasi 0-90 hari, 3-6 bulan, 6-12 bulan, 1-3 tahun lengkap dengan PIC, KPI, dan traceability."
        />
      </section>
    </main>
  );
}

function StepBox({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4 text-left">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary mb-2">
        {step}
      </span>
      <h3 className="font-display text-sm font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
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
      <h3 className="mt-3 font-display text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
