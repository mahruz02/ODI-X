import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AssessmentNavTabs } from "@/components/AssessmentNavTabs";
import { getTriangulationData } from "@/lib/admin.functions";
import {
  DIMENSIONS,
  TRIANGULATION_PLAN,
  TRIANGULATION_SOURCES,
} from "@/lib/questionnaire";

const triangulationQuery = (id: string) =>
  queryOptions({
    queryKey: ["triangulasi", id],
    queryFn: () => getTriangulationData({ data: { id } }),
  });

export const Route = createFileRoute("/asesmen/$id/triangulasi")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(triangulationQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Peta Triangulasi Data — ODI-X" },
      {
        name: "description",
        content:
          "Matriks triangulasi 12 domain & 7 sumber data (Leadership, Manager, Employee, Stakeholder, FGD, Wawancara, Dokumen/Kuantitatif).",
      },
      { property: "og:title", content: "Peta Triangulasi Data — ODI-X" },
      {
        property: "og:description",
        content:
          "Kelengkapan data per domain dan metode independen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TriangulationPage,
});

function TriangulationPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(triangulationQuery(id));

  const cellValue = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of data.cells) {
      const key = `${cell.dimension}:${cell.source}`;
      map.set(key, (map.get(key) ?? 0) + Number(cell.n));
    }
    return map;
  }, [data.cells]);

  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      <header className="mb-6">
        <Link
          to="/asesmen/$id"
          params={{ id }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← {data.organization?.name ?? "Dashboard Organisasi"}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Matriks Peta Triangulasi Data (12 Domain)
        </h1>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground leading-relaxed">
          Sesuai standar perumusan ODI-X, setiap kesimpulan domain idealnya didukung oleh minimal{" "}
          <strong className="text-foreground">2 titik data independen</strong> (kuesioner multi-level, FGD, wawancara, atau data objektif/dokumen). Perbedaan pandangan antar sumber ditandai sebagai gap, bukan sekadar dirata-ratakan.
        </p>
      </header>

      <AssessmentNavTabs id={id} />

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/60 text-left">
              <th className="px-4 py-3 font-bold">Domain Organisasi</th>
              {TRIANGULATION_SOURCES.map((s) => (
                <th key={s.key} className="px-2 py-3 text-center font-bold">
                  {s.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold">Cakupan Proof</th>
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dim) => {
              const plan = TRIANGULATION_PLAN[dim.id] || {};
              let points = 0;
              const cells = TRIANGULATION_SOURCES.map((s) => {
                const planned = plan[s.key];
                const n = cellValue.get(`${dim.id}:${s.key}`) ?? 0;
                if (planned && n > 0) points += 1;
                return { key: s.key, planned, n };
              });
              return (
                <tr key={dim.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-bold text-foreground">
                      {dim.id}. {dim.name}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">{dim.short}</span>
                  </td>
                  {cells.map((c) => (
                    <td key={c.key} className="px-1 py-2 text-center">
                      <Cell planned={c.planned} n={c.n} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold tabular-nums ${
                        points >= 3
                          ? "badge-gap-low"
                          : points >= 2
                            ? "badge-gap-mid"
                            : "badge-gap-high"
                      }`}
                    >
                      {points}/2+ Titik
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm cell-filled" /> Data
          Tersedia (angka = sampel/dokumen)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm cell-empty" />{" "}
          Direncanakan, Belum Ada Data
        </span>
        <span>
          <strong>U</strong> = Metode Utama · <strong>P</strong> = Metode Pendukung
        </span>
      </div>
    </main>
    </ProtectedRoute>
  );
}

function Cell({
  planned,
  n,
}: {
  planned: "utama" | "pendukung" | null | undefined;
  n: number;
}) {
  if (!planned) {
    return <span className="text-muted-foreground/40">—</span>;
  }
  const marker = planned === "utama" ? "U" : "P";
  if (n === 0) {
    return (
      <span className="inline-flex min-w-12 flex-col items-center rounded-lg border border-transparent px-1.5 py-1 cell-empty">
        <span className="text-xs font-bold">{marker}</span>
        <span className="text-[9px]">kosong</span>
      </span>
    );
  }
  const thin = planned === "utama" && n < 2;
  return (
    <span
      className={`inline-flex min-w-12 flex-col items-center rounded-lg border border-transparent px-1.5 py-1 ${
        thin ? "cell-thin" : "cell-filled"
      }`}
    >
      <span className="text-xs font-bold tabular-nums">
        {marker} · {n}
      </span>
      <span className="text-[9px]">{thin ? "tipis" : "ada"}</span>
    </span>
  );
}
