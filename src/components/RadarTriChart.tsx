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
 * Radar chart multi-garis — elemen signature ODI-X.
 * Garis bertumpuk (Leadership / Manager / Employee / Stakeholder) pada 12 dimensi
 * membuat gap persepsi terlihat sekali pandang.
 */

const ROLE_COLORS = {
  pengurus: "oklch(0.42 0.1 258)",
  manajemen: "oklch(0.62 0.11 195)",
  karyawan: "oklch(0.68 0.13 70)",
  stakeholder: "oklch(0.55 0.14 310)",
} as const;

export interface RadarDatum {
  label: string;
  pengurus: number | null;
  manajemen: number | null;
  karyawan: number | null;
  stakeholder?: number | null;
}

export function RadarTriChart({ data }: { data: RadarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={460}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{
            fill: "var(--foreground)",
            fontSize: 11,
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
          name="Leadership / Pengurus"
          dataKey="pengurus"
          stroke={ROLE_COLORS.pengurus}
          fill={ROLE_COLORS.pengurus}
          fillOpacity={0.06}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.pengurus, strokeWidth: 0 }}
          connectNulls
        />
        <Radar
          name="Manager / Manajemen"
          dataKey="manajemen"
          stroke={ROLE_COLORS.manajemen}
          fill={ROLE_COLORS.manajemen}
          fillOpacity={0.06}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.manajemen, strokeWidth: 0 }}
          connectNulls
        />
        <Radar
          name="Employee / Karyawan"
          dataKey="karyawan"
          stroke={ROLE_COLORS.karyawan}
          fill={ROLE_COLORS.karyawan}
          fillOpacity={0.06}
          strokeWidth={2.5}
          dot={{ r: 3, fill: ROLE_COLORS.karyawan, strokeWidth: 0 }}
          connectNulls
        />
        <Radar
          name="Stakeholder / Mitra"
          dataKey="stakeholder"
          stroke={ROLE_COLORS.stakeholder}
          fill={ROLE_COLORS.stakeholder}
          fillOpacity={0.06}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: ROLE_COLORS.stakeholder, strokeWidth: 0 }}
          connectNulls
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 10 }} />
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
            fontSize: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
