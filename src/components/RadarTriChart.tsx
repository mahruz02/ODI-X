import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/**
 * Radar chart tiga-garis — elemen signature DiagnosaBMT.
 * Tiga garis bertumpuk (Pengurus / Manajemen / Karyawan) pada dimensi yang sama
 * membuat gap persepsi terlihat sekali pandang.
 */

// Nilai oklch selaras dengan token --chart-pengurus/manajemen/karyawan di styles.css
const ROLE_COLORS = {
  pengurus: "oklch(0.42 0.1 258)",
  manajemen: "oklch(0.62 0.11 195)",
  karyawan: "oklch(0.68 0.13 70)",
} as const;

export interface RadarDatum {
  label: string;
  pengurus: number | null;
  manajemen: number | null;
  karyawan: number | null;
}

export function RadarTriChart({ data }: { data: RadarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={430}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{
            fill: "var(--foreground)",
            fontSize: 12,
            fontWeight: 600,
          }}
        />
        <PolarRadiusAxis
          type="number"
          domain={[0, 5]}
          tickCount={6}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Pengurus"
          dataKey="pengurus"
          stroke={ROLE_COLORS.pengurus}
          fill={ROLE_COLORS.pengurus}
          fillOpacity={0.07}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.pengurus, strokeWidth: 0 }}
          connectNulls
        />
        <Radar
          name="Manajemen"
          dataKey="manajemen"
          stroke={ROLE_COLORS.manajemen}
          fill={ROLE_COLORS.manajemen}
          fillOpacity={0.07}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.manajemen, strokeWidth: 0 }}
          connectNulls
        />
        <Radar
          name="Karyawan"
          dataKey="karyawan"
          stroke={ROLE_COLORS.karyawan}
          fill={ROLE_COLORS.karyawan}
          fillOpacity={0.07}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.karyawan, strokeWidth: 0 }}
          connectNulls
        />
        <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number" ? value.toFixed(2) : "tidak dinilai",
            String(name),
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
            fontSize: 13,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
