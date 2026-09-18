import {
  DIMENSIONS,
  GAP_LABELS,
  ROLE_LABELS,
  gapLevel,
  type ActionDirection,
  type GapLevel,
  type Horizon,
  type Role,
} from "./questionnaire";

export interface DimensionSummary {
  id: number;
  name: string;
  short: string;
  description: string;
  roleScores: Partial<Record<Role, number | null>>;
  average: number | null;
  scoreNormalized: number | null; // 0-100
  gap: number;
  level: GapLevel;
}

export const ROLES: Role[] = ["pengurus", "manajemen", "karyawan", "stakeholder"];

export interface CompositeIndices {
  healthIndex: number; // 0-100
  alignmentIndex: number; // 0-100
  adaptabilityIndex: number; // 0-100
  maturityLevel: number; // 1-5
  maturityLabel: string;
  riskExposure: "Low" | "Medium" | "High" | "Critical";
  readinessScore: number; // 0-100
}

export function computeCompositeIndices(summaries: DimensionSummary[]): CompositeIndices {
  const scored = summaries.filter((s) => s.average != null);
  if (scored.length === 0) {
    return {
      healthIndex: 0,
      alignmentIndex: 0,
      adaptabilityIndex: 0,
      maturityLevel: 1,
      maturityLabel: "Level 1 — Inisiasi / Reaktif",
      riskExposure: "Medium",
      readinessScore: 0,
    };
  }

  // Health Index: Rata-rata normalisasi 0-100
  const avgLikert = scored.reduce((a, s) => a + (s.average as number), 0) / scored.length;
  const healthIndex = Math.round(((avgLikert - 1) / 4) * 100);

  // Alignment Index: 100 - (rata-rata gap persepsi / 2.0 * 100)
  const avgGap = scored.reduce((a, s) => a + s.gap, 0) / scored.length;
  const alignmentIndex = Math.max(0, Math.round(100 - (avgGap / 1.6) * 100));

  // Adaptability Index: Rata-rata Konteks Eksternal (1), Strategi (2), Proses & IT (9), Pengalaman Stakeholder (12)
  const adaptDims = scored.filter((s) => [1, 2, 9, 12].includes(s.id));
  const adaptAvg = adaptDims.length
    ? adaptDims.reduce((a, s) => a + (s.average as number), 0) / adaptDims.length
    : avgLikert;
  const adaptabilityIndex = Math.round(((adaptAvg - 1) / 4) * 100);

  // Maturity Level (1-5)
  let maturityLevel = 1;
  let maturityLabel = "Level 1 — Reaktif & Informal";
  if (healthIndex >= 85 && alignmentIndex >= 80) {
    maturityLevel = 5;
    maturityLabel = "Level 5 — Teroptimasi & Resilien";
  } else if (healthIndex >= 70 && alignmentIndex >= 70) {
    maturityLevel = 4;
    maturityLabel = "Level 4 — Terkelola & Terukur";
  } else if (healthIndex >= 55 && alignmentIndex >= 60) {
    maturityLevel = 3;
    maturityLabel = "Level 3 — Terdefinisi & Terstruktur";
  } else if (healthIndex >= 40) {
    maturityLevel = 2;
    maturityLabel = "Level 2 — Terulang & Parsial";
  }

  // Risk Exposure calculation (§5.8 instructions.md)
  // RE = (1/|Dr|) * sum_{d in Dr} (100 - S_d) * R_d, Dr = {4, 9, 11}
  // R_4 (Struktur) = 0.5, R_9 (Proses & Tech) = 0.75, R_11 (Risiko & Kontrol) = 1.0
  const riskWeights: Record<number, number> = { 4: 0.5, 9: 0.75, 11: 1.0 };
  const drDimensions = [4, 9, 11];
  let totalWeightedRisk = 0;
  let drCount = 0;

  for (const dId of drDimensions) {
    const dimSum = scored.find((s) => s.id === dId);
    const scoreNorm = dimSum?.scoreNormalized ?? (avgLikert ? ((avgLikert - 1) / 4) * 100 : 50);
    const weight = riskWeights[dId] ?? 0.5;
    totalWeightedRisk += (100 - scoreNorm) * weight;
    drCount += 1;
  }

  const rawRiskExposureScore = drCount > 0 ? totalWeightedRisk / drCount : 50;

  let riskExposure: "Low" | "Medium" | "High" | "Critical" = "Medium";
  if (rawRiskExposureScore >= 60 || avgGap > 1.2) riskExposure = "Critical";
  else if (rawRiskExposureScore >= 40 || avgGap > 0.8) riskExposure = "High";
  else if (rawRiskExposureScore <= 20 && avgGap < 0.5) riskExposure = "Low";

  // Readiness for Change Score
  const readinessScore = Math.round(healthIndex * 0.4 + alignmentIndex * 0.3 + adaptabilityIndex * 0.3);

  return {
    healthIndex,
    alignmentIndex,
    adaptabilityIndex,
    maturityLevel,
    maturityLabel,
    riskExposure,
    readinessScore,
  };
}

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
    const scoreNormalized = average != null ? Math.round(((average - 1) / 4) * 100) : null;
    const gap = present.length >= 2 ? Math.max(...present) - Math.min(...present) : 0;
    return {
      id: dim.id,
      name: dim.name,
      short: dim.short,
      description: dim.description,
      roleScores,
      average,
      scoreNormalized,
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
  direction: ActionDirection;
  horizon: Horizon;
  pic: string;
  kpi: string;
  target: string;
  reason: string;
  evidenceTrace: string;
  actions: string[];
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  mendesak: "Prioritas Mendesak (Critical/High)",
  penting: "Prioritas Penting (Medium)",
  pemeliharaan: "Pemeliharaan (Low)",
};

export const DIRECTION_BADGE_CLASS: Record<ActionDirection, string> = {
  Pertahankan: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Perbaiki: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Bangun: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Transformasi: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  Kurangi: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  Hentikan: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  Eksplorasi: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
};

const ACTION_METADATA: Record<
  number,
  {
    direction: ActionDirection;
    horizon: Horizon;
    pic: string;
    kpi: string;
    target: string;
    actions: string[];
  }
> = {
  1: {
    direction: "Eksplorasi",
    horizon: "3-6 bulan",
    pic: "Pengurus & Perencana Strategis",
    kpi: "Frekuensi Kajian Pasar & Regulasi",
    target: "1x per semester",
    actions: [
      "Lakukan pemetaaan peluang dan ancaman eksternal semesteran.",
      "Susun adendum mitigasi regulasi baru dan tren pasar.",
    ],
  },
  2: {
    direction: "Perbaiki",
    horizon: "0-90 hari",
    pic: "Direksi & Manager Unit",
    kpi: "Cascading KPI ke Unit Kerja",
    target: "100% unit punya target turunan",
    actions: [
      "Turunkan sasaran strategis menjadi target terukur per unit kerja.",
      "Adakan forum sosialisasi arah strategi ke seluruh jajaran.",
    ],
  },
  3: {
    direction: "Transformasi",
    horizon: "0-90 hari",
    pic: "Ketua Pengurus & Pengawas",
    kpi: "Matriks Delegasi Kewenangan (DoA)",
    target: "SOP DoA disetujui & aktif",
    actions: [
      "Formulasikan kembali batas keputusan independen dan tata kelola transparan.",
      "Buka forum komunikasi vertikal rutin Pengurus–Karyawan.",
    ],
  },
  4: {
    direction: "Perbaiki",
    horizon: "0-90 hari",
    pic: "HR & Org Development",
    kpi: "Revisi Job Description & Cascading KPI",
    target: "100% posisi terdefinisi & terukur",
    actions: [
      "Turunkan (cascade) KPI organisasi ke KPI bulanan per individu/staf.",
      "Perbarui struktur organisasi beserta uraian tugas dan batas kewenangan.",
      "Selenggarakan townhall triwulanan Pengurus-Staf untuk penyelarasan visi.",
    ],
  },
  5: {
    direction: "Pertahankan",
    horizon: "6-12 bulan",
    pic: "Komite Etika & DPS",
    kpi: "Indeks Kepatuhan Etika Organisasi",
    target: "Skor etika >= 90%",
    actions: [
      "Tegakkan nilai amanah dan etika syariah dalam keseharian.",
      "Buka saluran pelaporan pelanggaran (whistleblowing) independen.",
    ],
  },
  6: {
    direction: "Bangun",
    horizon: "3-6 bulan",
    pic: "HR & Operational Manager",
    kpi: "Jam Pelatihan & Kamus Kompetensi",
    target: "Minimal 30 jam / tahun per staf",
    actions: [
      "Susun kamus kompetensi, matriks keahlian, dan jalur karir (career path).",
      "Buka program pelatihan berkelanjutan pasca-onboarding untuk tim AO & Marketing.",
    ],
  },
  7: {
    direction: "Kurangi",
    horizon: "0-90 hari",
    pic: "HR & Manajer Operasional",
    kpi: "Distribusi Beban Kerja & Overtime Rate",
    target: "Overtime < 10% & Psychological Safety High",
    actions: [
      "Lakukan Workload Analysis (WLA) untuk meratakan distribusi beban kerja.",
      "Buka saluran masukan/umpan balik anonim untuk membangun iklim psikologis aman.",
    ],
  },
  8: {
    direction: "Perbaiki",
    horizon: "0-90 hari",
    pic: "Kepala Cabang & Team Leader",
    kpi: "Skor Sinergi Antar-Unit",
    target: "Tanpa sekat silogisme",
    actions: [
      "Bangun forum koordinasi lintas cabang/unit secara berkala.",
      "Tetapkan mekanisme resolusi konflik yang adil.",
    ],
  },
  9: {
    direction: "Transformasi",
    horizon: "6-12 bulan",
    pic: "IT & Process Development",
    kpi: "Otomatisasi Core System & SOP Mutakhir",
    target: "Digitalisasi 80% proses utama",
    actions: [
      "Audit dan perbarui SOP operasional yang usang.",
      "Implementasikan otomatisasi IT dan stabilisasi core application.",
    ],
  },
  10: {
    direction: "Perbaiki",
    horizon: "3-6 bulan",
    pic: "HR & Pengurus Remunerasi",
    kpi: "Transparansi Remunerasi & Insentif",
    target: "Skor Keadilan Kinerja >= 85%",
    actions: [
      "Restrukturisasi formula insentif & bonus berbasis pencapaian KPI objektif.",
      "Transparansikan kriteria insentif, bonus, dan kenaikan pangkat untuk menekan turnover.",
    ],
  },
  11: {
    direction: "Pertahankan",
    horizon: "0-90 hari",
    pic: "Manajemen Risiko & Audit Internal",
    kpi: "Tingkat NPF/NPL & Audit Closure Rate",
    target: "NPF < 3%, Audit Closed 100%",
    actions: [
      "Perketat sistem kontrol internal dan kepatuhan syariah.",
      "Tindak lanjuti 100% temuan audit dan laporan DPS tepat waktu.",
    ],
  },
  12: {
    direction: "Bangun",
    horizon: "1-3 tahun",
    pic: "Pemasaran & Stakeholder Relation",
    kpi: "Customer Satisfaction Index (CSI)",
    target: "CSI >= 90%",
    actions: [
      "Lakukan survei kepuasan anggota dan penanganan komplain cepat.",
      "Perkuat dampak sosial dan kemitraan strategis lembaga.",
    ],
  },
};

export function buildRecommendations(summaries: DimensionSummary[]): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const s of summaries) {
    if (s.average == null) continue;
    const lowScore = s.average < 3.2;
    const midScore = s.average < 3.8;
    const priority: Priority =
      s.level === "high" || lowScore ? "mendesak" : s.level === "mid" || midScore ? "penting" : "pemeliharaan";

    const meta = ACTION_METADATA[s.id] ?? {
      direction: "Perbaiki" as ActionDirection,
      horizon: "3-6 bulan" as Horizon,
      pic: "Tim Manajemen",
      kpi: "Indikator Kinerja Dimensi",
      target: "Skor > 4.0",
      actions: ["Lakukan klarifikasi dan tindakan perbaikan."],
    };

    const reasons: string[] = [];
    reasons.push(`Skor rata-rata ${s.average.toFixed(2)} / 5.0 (Index ${s.scoreNormalized ?? 0}/100).`);
    if (s.gap > 0) reasons.push(`Gap persepsi Δ ${s.gap.toFixed(2)} (${GAP_LABELS[s.level].toLowerCase()}).`);

    const trace = `Data kuesioner dimensi ${s.id} (${s.name}) — gap persepsi Δ ${s.gap.toFixed(
      2,
    )} dikombinasikan dengan telaah kualitatif/dokumen terkait.`;

    recs.push({
      dimension: s.id,
      title: s.name,
      priority,
      direction: meta.direction,
      horizon: meta.horizon,
      pic: meta.pic,
      kpi: meta.kpi,
      target: meta.target,
      reason: reasons.join(" "),
      evidenceTrace: trace,
      actions: meta.actions,
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

export interface PublicReportToken {
  tokenId: string;
  projectId: string;
  createdAt: string;
  expiresAt: string;
}

export function generatePublicReportToken(projectId: string, expiryDays = 30): string {
  const payload = {
    pId: projectId,
    exp: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
    rnd: Math.random().toString(36).substring(2, 9),
  };
  if (typeof btoa !== "undefined") {
    return btoa(JSON.stringify(payload));
  }
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyPublicReportToken(tokenStr: string): { isValid: boolean; projectId?: string; expiresAt?: string } {
  try {
    const jsonStr = typeof atob !== "undefined" ? atob(tokenStr) : Buffer.from(tokenStr, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (!parsed.pId || !parsed.exp) return { isValid: false };
    const isExpired = Date.now() > parsed.exp;
    return {
      isValid: !isExpired,
      projectId: parsed.pId,
      expiresAt: new Date(parsed.exp).toLocaleDateString("id-ID"),
    };
  } catch {
    return { isValid: false };
  }
}

