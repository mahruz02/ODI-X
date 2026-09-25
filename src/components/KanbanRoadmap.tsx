import { useState, useMemo } from "react";
import { CheckCircle2, User, Target } from "lucide-react";
import type { Recommendation } from "@/lib/report";
import { DIRECTION_BADGE_CLASS } from "@/lib/report";

export interface KanbanRoadmapProps {
  recommendations: Recommendation[];
}

type Status = "todo" | "in_progress" | "done";

const STATUS_LABELS: Record<Status, string> = {
  todo: "Belum Dimulai",
  in_progress: "Sedang Berjalan",
  done: "Selesai",
};

const STATUS_BADGE: Record<Status, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 border border-blue-500/30",
  done: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
};

const HORIZONS = [
  {
    key: "0-90 hari",
    label: "Horizon 1: Segera (0–90 Hari)",
    desc: "Tindakan mendesak & Quick Wins",
  },
  {
    key: "3-6 bulan",
    label: "Horizon 2: Jangka Pendek (3–6 Bulan)",
    desc: "Perbaikan operasional inti",
  },
  {
    key: "6-12 bulan",
    label: "Horizon 3: Jangka Menengah (6–12 Bulan)",
    desc: "Transformasi & Digitalisasi",
  },
  {
    key: "1-3 tahun",
    label: "Horizon 4: Jangka Panjang (1–3 Tahun)",
    desc: "Keberlanjutan & Budaya",
  },
];

export function KanbanRoadmap({ recommendations }: KanbanRoadmapProps) {
  const [itemStatuses, setItemStatuses] = useState<Record<number, Status>>({});
  const [selectedPic, setSelectedPic] = useState<string>("all");

  const pics = useMemo(() => {
    const set = new Set<string>();
    for (const r of recommendations) {
      if (r.pic) set.add(r.pic);
    }
    return Array.from(set);
  }, [recommendations]);

  const filteredRecs = useMemo(() => {
    if (selectedPic === "all") return recommendations;
    return recommendations.filter((r) => r.pic === selectedPic);
  }, [recommendations, selectedPic]);

  function toggleStatus(dimension: number) {
    setItemStatuses((prev) => {
      const current = prev[dimension] ?? "todo";
      const next: Status =
        current === "todo" ? "in_progress" : current === "in_progress" ? "done" : "todo";
      return { ...prev, [dimension]: next };
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-muted-foreground">Filter Penanggung Jawab (PIC):</span>
          <select
            value={selectedPic}
            onChange={(e) => setSelectedPic(e.target.value)}
            className="rounded-xl border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Semua PIC ({recommendations.length} item)</option>
            {pics.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-slate-400" /> Belum Dimulai
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-500" /> Sedang Berjalan
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> Selesai
          </span>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HORIZONS.map((h) => {
          const itemsInHorizon = filteredRecs.filter((r) => r.horizon === h.key);
          return (
            <div key={h.key} className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 border-b pb-2">
                <span className="text-xs font-extrabold text-primary block">{h.label}</span>
                <span className="text-[10px] text-muted-foreground">{h.desc}</span>
              </div>

              <div className="flex-1 space-y-3 min-h-[220px]">
                {itemsInHorizon.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-[11px] text-muted-foreground">
                    Tidak ada item di horizon ini
                  </div>
                ) : (
                  itemsInHorizon.map((item) => {
                    const status = itemStatuses[item.dimension] ?? "todo";
                    return (
                      <article
                        key={item.dimension}
                        className="rounded-xl border bg-background p-3.5 shadow-sm transition-all hover:border-primary/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                            {item.dimension}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${DIRECTION_BADGE_CLASS[item.direction]}`}
                          >
                            {item.direction}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs leading-snug tracking-tight text-foreground">
                          {item.title}
                        </h4>

                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {item.reason}
                        </p>

                        <div className="mt-3 space-y-1 text-[10px] text-muted-foreground border-t pt-2">
                          <div className="flex items-center gap-1 font-medium">
                            <User className="size-3 text-primary shrink-0" />
                            <span className="truncate">{item.pic}</span>
                          </div>
                          <div className="flex items-center gap-1 font-medium">
                            <Target className="size-3 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {item.kpi} ({item.target})
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-2">
                          <button
                            type="button"
                            onClick={() => toggleStatus(item.dimension)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${STATUS_BADGE[status]}`}
                          >
                            <CheckCircle2 className="size-3" />
                            {STATUS_LABELS[status]}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
