import { DIMENSIONS, GAP_LABELS, ROLE_LABELS, gapLevel, type GapLevel, type Role } from "./questionnaire";

export interface DimensionSummary {
  id: number;
  name: string;
  short: string;
  description: string;
  roleScores: Partial<Record<Role, number | null>>;
  average: number | null;
  gap: number;
  level: GapLevel;
}

export const ROLES: Role[] = ["pengurus", "manajemen", "karyawan"];

/** Rangkuman skor & gap per dimensi dari baris agregat dimension_scores. */
export function buildDimensionSummaries(
  scores: { dimension: number; role: Role; avg_score: number; respondents: number }[],
): DimensionSummary[] {
  const map = new Map<number, Partial<Record<Role, { sum: number; n: number }>>>();
  for (const row of scores) {
    const entry = map.get(row.dimension) ?? {};
    const prev = entry[row.role] ?? { sum: 0, n: 0 };
    entry[row.role] = {
      sum: prev.sum + row.avg_score * row.respondents,
      n: prev.n + row.respondents,
    };
    map.set(row.dimension, entry);
  }
  return DIMENSIONS.map((dim) => {
    const entry = map.get(dim.id) ?? {};
    const roleScores: Partial<Record<Role, number | null>> = {};
    for (const role of ROLES) {
      const e = entry[role];
      roleScores[role] = e && e.n > 0 ? e.sum / e.n : null;
    }
    const present = ROLES.map((r) => roleScores[r]).filter((v): v is number => v != null);
    const average = present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
    const gap = present.length >= 2 ? Math.max(...present) - Math.min(...present) : 0;
    return {
      id: dim.id,
      name: dim.name,
      short: dim.short,
      description: dim.description,
      roleScores,
      average,
      gap,
      level: gapLevel(gap),
    };
  });
}

export type Priority = "mendesak" | "penting" | "pemeliharaan";

export interface Recommendation {
  dimension: number;
  title: string;
  priority: Priority;
  reason: string;
  actions: string[];
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  mendesak: "Prioritas Mendesak",
  penting: "Prioritas Penting",
  pemeliharaan: "Pemeliharaan",
};

/** Tindakan baku per dimensi; dipakai sebagai dasar rekomendasi otomatis. */
const ACTION_LIBRARY: Record<number, string[]> = {
  1: [
    "Rumuskan ulang sasaran tahunan menjadi target terukur per unit kerja.",
    "Adakan forum sosialisasi arah strategi ke seluruh level, minimal per semester.",
  ],
  2: [
    "Perbarui struktur organisasi beserta uraian tugas dan batas kewenangan tertulis.",
    "Petakan pekerjaan yang tumpang tindih dan tetapkan satu penanggung jawab.",
  ],
  3: [
    "Jadwalkan coaching rutin atasan–bawahan dengan catatan tindak lanjut.",
    "Susun standar pengambilan keputusan agar tidak bergantung pada satu figur.",
  ],
  4: [
    "Bangun forum komunikasi lintas level (townhall/temu karyawan) secara berkala.",
    "Sediakan kanal aspirasi yang aman beserta mekanisme umpan balik.",
  ],
  5: [
    "Tinjau skema remunerasi dan insentif berdasar beban kerja dan kinerja terukur.",
    "Transparansikan dasar perhitungan insentif kepada seluruh karyawan.",
  ],
  6: [
    "Lengkapi SOP inti dan lakukan uji keterterapan di lapangan.",
    "Perkuat sistem informasi/pelaporan agar data keputusan tersedia tepat waktu.",
  ],
  7: [
    "Aktifkan agenda pengawasan syariah rutin dan dokumentasikan temuannya.",
    "Selenggarakan penyegaran fikih muamalah bagi frontliner dan analis.",
  ],
  8: [
    "Perketat pemantauan kualitas pembiayaan dan disiplin penagihan.",
    "Susun proyeksi likuiditas bulanan sebagai dasar keputusan ekspansi.",
  ],
  9: [
    "Tetapkan nilai kerja yang konkret beserta contoh perilaku dan teladan pimpinan.",
    "Berikan apresiasi terjadwal atas perilaku sesuai nilai organisasi.",
  ],
  10: [
    "Tinjau beban kerja dan pola jam kerja pada unit dengan tekanan tertinggi.",
    "Perbaiki paket kesejahteraan dasar (kesehatan, cuti, jaminan sosial).",
  ],
};

export function buildRecommendations(summaries: DimensionSummary[]): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const s of summaries) {
    if (s.average == null) continue;
    const lowScore = s.average < 3.2;
    const midScore = s.average < 3.8;
    const priority: Priority =
      s.level === "high" || lowScore ? "mendesak" : s.level === "mid" || midScore ? "penting" : "pemeliharaan";

    const reasons: string[] = [];
    reasons.push(`Skor rata-rata ${s.average.toFixed(2)} dari 5.`);
    if (s.gap > 0) reasons.push(`Gap persepsi antar level Δ ${s.gap.toFixed(2)} (${GAP_LABELS[s.level].toLowerCase()}).`);
    const lowest = ROLES.filter((r) => s.roleScores[r] != null).sort(
      (a, b) => (s.roleScores[a] as number) - (s.roleScores[b] as number),
    )[0];
    if (lowest && s.gap >= 0.7) {
      reasons.push(`Penilaian terendah datang dari ${ROLE_LABELS[lowest]}.`);
    }

    const actions = [...(ACTION_LIBRARY[s.id] ?? [])];
    if (s.level !== "low") {
      actions.unshift(
        "Lakukan klarifikasi bersama tiga level (Pengurus, Manajemen, Karyawan) untuk menyamakan pemahaman pada dimensi ini.",
      );
    }
    recs.push({
      dimension: s.id,
      title: s.name,
      priority,
      reason: reasons.join(" "),
      actions,
    });
  }
  const order: Priority[] = ["mendesak", "penting", "pemeliharaan"];
  return recs.sort(
    (a, b) => order.indexOf(a.priority) - order.indexOf(b.priority) || a.dimension - b.dimension,
  );
}

export const PRIORITY_CLASS: Record<Priority, string> = {
  mendesak: "badge-gap-high",
  penting: "badge-gap-mid",
  pemeliharaan: "badge-gap-low",
};
