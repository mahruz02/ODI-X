import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

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
      { title: "Peta Triangulasi — DiagnosaBMT" },
      {
        name: "description",
        content:
          "Status kelengkapan data per dimensi dan metode (kuesioner, FGD, wawancara, telaah dokumen) untuk memastikan tiap kesimpulan didukung minimal dua sumber independen.",
      },
      { property: "og:title", content: "Peta Triangulasi — DiagnosaBMT" },
      {
        property: "og:description",
        content:
          "Status kelengkapan data per dimensi dan metode untuk satu organisasi BMT yang sedang didiagnosis.",
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link
          to="/asesmen/$id"
          params={{ id }}
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          ← {data.organization?.name ?? "Dashboard Organisasi"}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Peta Triangulasi
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tiap dimensi idealnya punya minimal{" "}
          <strong>2 titik data independen</strong> sebelum disimpulkan. Sel yang
          masih kosong menunjukkan titik yang datanya masih tipis.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left">
              <th className="px-4 py-3 font-bold">Dimensi</th>
              {TRIANGULATION_SOURCES.map((s) => (
                <th key={s.key} className="px-3 py-3 text-center font-bold">
                  {s.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold">Titik Data</th>
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dim) => {
              const plan = TRIANGULATION_PLAN[dim.id]!;
              let points = 0;
              const cells = TRIANGULATION_SOURCES.map((s) => {
                const planned = plan[s.key];
                const n = cellValue.get(`${dim.id}:${s.key}`) ?? 0;
                if (planned && n > 0) points += 1;
                return { key: s.key, planned, n };
              });
              return (
                <tr key={dim.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {dim.id}. {dim.name}
                    </span>
                  </td>
                  {cells.map((c) => (
                    <td key={c.key} className="px-2 py-2 text-center">
                      <Cell planned={c.planned} n={c.n} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                        points >= 2
                          ? "badge-gap-low"
                          : points === 1
                            ? "badge-gap-mid"
                            : "badge-gap-high"
                      }`}
                    >
                      {points}/2+
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
          tersedia (angka = jumlah responden/catatan)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm cell-empty" />{" "}
          Direncanakan, belum ada data
        </span>
        <span>
          <strong>U</strong> = metode utama · <strong>P</strong> = metode pendukung
        </span>
      </div>
    </main>
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
    return <span className="text-muted-foreground">—</span>;
  }
  const marker = planned === "utama" ? "U" : "P";
  if (n === 0) {
    return (
      <span className="inline-flex min-w-12 flex-col items-center rounded-lg border border-transparent px-2 py-1 cell-empty">
        <span className="text-xs font-bold">{marker}</span>
        <span className="text-[10px]">belum ada</span>
      </span>
    );
  }
  const thin = planned === "utama" && n < 2;
  return (
    <span
      className={`inline-flex min-w-12 flex-col items-center rounded-lg border border-transparent px-2 py-1 ${
        thin ? "cell-thin" : "cell-filled"
      }`}
    >
      <span className="text-xs font-bold tabular-nums">
        {marker} · {n}
      </span>
      <span className="text-[10px]">{thin ? "masih tipis" : "tersedia"}</span>
    </span>
  );
}
