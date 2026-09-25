import { useState } from "react";
import {
  CheckSquare,
  Square,
  Users,
  Award,
  ShieldAlert,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";

export interface HRTask {
  id: string;
  horizon: "H1 (0-90 Hari)" | "H2 (3-6 Bulan)" | "H3 (6-12 Bulan)";
  domain: string;
  title: string;
  pic: string;
  kpi: string;
  deliverable: string;
  done: boolean;
}

const INITIAL_HR_TASKS: HRTask[] = [
  {
    id: "hr-1",
    horizon: "H1 (0-90 Hari)",
    domain: "Domain 4: Struktur & Uraian Tugas",
    title: "Cascading KPI Organisasi ke Target Bulanan Per Staf",
    pic: "HR & Org Development",
    kpi: "100% posisi memiliki KPI terukur",
    deliverable: "Matriks Job Description & Lembar KPI Bulanan Pelaksana",
    done: false,
  },
  {
    id: "hr-2",
    horizon: "H1 (0-90 Hari)",
    domain: "Domain 4: Struktur & Uraian Tugas",
    title: "Penyelenggaraan Townhall Triwulanan Pengurus-Staf",
    pic: "Pengurus & HR",
    kpi: "Keterpahaman Visi > 80%",
    deliverable: "Notulensi Forum Vertikal & Q&A Transparansi Visi",
    done: false,
  },
  {
    id: "hr-3",
    horizon: "H1 (0-90 Hari)",
    domain: "Domain 7: Beban Kerja & Iklim Psikologis",
    title: "Workload Analysis (WLA) & Saluran Umpan Balik Anonim",
    pic: "HR & Manajer Operasional",
    kpi: "Overtime Rate < 10%",
    deliverable: "Laporan Distribusi Beban Kerja & Kotak Saran Digital Anonim",
    done: false,
  },
  {
    id: "hr-4",
    horizon: "H2 (3-6 Bulan)",
    domain: "Domain 6: Pengembangan Talenta",
    title: "Penyusunan Kamus Kompetensi & Jalur Karir (Career Path)",
    pic: "HR & Operational Manager",
    kpi: "Jam Pelatihan > 30 jam/tahun",
    deliverable: "Dokumen Panduan Karir & Silabus Pelatihan AO/Marketing",
    done: false,
  },
  {
    id: "hr-5",
    horizon: "H2 (3-6 Bulan)",
    domain: "Domain 10: Remunerasi & Insentif",
    title: "Restrukturisasi Formula Insentif Berbasis KPI Objektif",
    pic: "HR & Pengurus Remunerasi",
    kpi: "Skor Keadilan Kinerja >= 85%",
    deliverable: "Pedoman Kebijakan Bonus & Skema Remunerasi Transparan",
    done: false,
  },
  {
    id: "hr-6",
    horizon: "H3 (6-12 Bulan)",
    domain: "Domain 5: Etika & Saluran Pelaporan",
    title: "Penegakan Whistleblowing System & Evaluasi Kepuasan Staf",
    pic: "Komite Etika & HR",
    kpi: "Skor Kepatuhan Etika >= 90%",
    deliverable: "Portal Whistleblowing Terintegrasi & Survei Kepuasan",
    done: false,
  },
];

export function HRDevelopmentPlan() {
  const [tasks, setTasks] = useState<HRTask[]>(INITIAL_HR_TASKS);

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm mb-8 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="size-4" />
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Rencana Eksekusi & Implementasi HR / SDM
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Program kerja operasional HR berdasarkan hasil diagnosis 12 domain ODI-X.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-primary block">{progressPercent}% Selesai</span>
            <span className="text-[10px] text-muted-foreground">
              {completedCount} dari {tasks.length} Tindakan Terverifikasi
            </span>
          </div>
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => toggleTask(t.id)}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 text-xs cursor-pointer transition-all ${
              t.done
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-background hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                type="button"
                className={`mt-0.5 shrink-0 ${t.done ? "text-emerald-600" : "text-muted-foreground"}`}
              >
                {t.done ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-accent/40 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                    {t.horizon}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {t.domain}
                  </span>
                </div>
                <h4
                  className={`font-bold text-sm mt-1 leading-snug ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {t.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Deliverable: <strong className="text-foreground">{t.deliverable}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary block">
                <Target className="size-3" /> {t.kpi}
              </span>
              <span className="text-[10px] text-muted-foreground block">PIC: {t.pic}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
