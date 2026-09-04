// Lapisan confidence per dimensi: seberapa kuat bukti di balik satu skor dimensi.
// Murni logika — dihitung dari jumlah titik data independen (kuesioner, FGD,
// wawancara, telaah dokumen) dan kecukupan responden tiap peran.

import { ROLE_LABELS, type Role } from "./questionnaire";

export type ConfidenceLevel = "tipis" | "cukup" | "kuat";

export interface DimensionEvidence {
  dimension: number;
  /** Jumlah responden kuesioner per peran */
  respondentsByRole: Partial<Record<Role, number>>;
  fgd: number;
  interviews: number;
  documents: number;
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  /** 0–1, dipakai priority engine */
  score: number;
  /** Jumlah metode independen yang punya data */
  methods: number;
  rolesCovered: number;
  minRespondents: number;
  reason: string;
}

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  tipis: "Evidence Tipis",
  cukup: "Evidence Cukup",
  kuat: "Evidence Kuat",
};

export const CONFIDENCE_CLASS: Record<ConfidenceLevel, string> = {
  tipis: "badge-gap-mid",
  cukup: "badge-gap-low",
  kuat: "badge-gap-low",
};

export const CONFIDENCE_SCORE: Record<ConfidenceLevel, number> = {
  tipis: 0.3,
  cukup: 0.65,
  kuat: 1,
};

export const THIN_EVIDENCE_NOTE =
  "Skor ini berbasis data terbatas — perlu digali lebih lanjut sebelum dipakai sebagai dasar keputusan.";

const ALL_ROLES: Role[] = ["pengurus", "manajemen", "karyawan"];

export function computeConfidence(ev: DimensionEvidence): ConfidenceResult {
  const counts = ALL_ROLES.map((r) => ev.respondentsByRole[r] ?? 0);
  const totalRespondents = counts.reduce((a, b) => a + b, 0);
  const rolesCovered = counts.filter((c) => c >= 1).length;
  const minRespondents = Math.min(...counts);

  const qualMethods =
    (ev.fgd > 0 ? 1 : 0) + (ev.interviews > 0 ? 1 : 0) + (ev.documents > 0 ? 1 : 0);
  const methods = (totalRespondents > 0 ? 1 : 0) + qualMethods;

  let level: ConfidenceLevel;
  if (methods >= 3 && qualMethods >= 2 && minRespondents >= 3) {
    level = "kuat";
  } else if (methods >= 2 && rolesCovered === ALL_ROLES.length && minRespondents >= 1) {
    level = "cukup";
  } else {
    level = "tipis";
  }

  const missing = ALL_ROLES.filter((r) => (ev.respondentsByRole[r] ?? 0) < 1).map(
    (r) => ROLE_LABELS[r],
  );
  const parts = [`${methods} metode data`];
  if (missing.length) parts.push(`belum ada responden ${missing.join(", ")}`);
  else parts.push(`responden minimum per peran ${minRespondents}`);
  if (qualMethods === 0) parts.push("belum ada data kualitatif");

  return {
    level,
    score: CONFIDENCE_SCORE[level],
    methods,
    rolesCovered,
    minRespondents,
    reason: parts.join(" · "),
  };
}

/** Bangun peta evidence per dimensi dari data dashboard + data kualitatif. */
export function buildEvidenceMap(input: {
  scores: { dimension: number; role: Role; respondents: number }[];
  fgd: { dimension: number }[];
  interviews: { dimension: number }[];
  documents: { dimension: number }[];
}): Map<number, DimensionEvidence> {
  const map = new Map<number, DimensionEvidence>();
  const get = (dimension: number) => {
    let e = map.get(dimension);
    if (!e) {
      e = { dimension, respondentsByRole: {}, fgd: 0, interviews: 0, documents: 0 };
      map.set(dimension, e);
    }
    return e;
  };
  for (const row of input.scores) {
    const e = get(row.dimension);
    e.respondentsByRole[row.role] = Math.max(
      e.respondentsByRole[row.role] ?? 0,
      row.respondents,
    );
  }
  for (const f of input.fgd) get(f.dimension).fgd += 1;
  for (const i of input.interviews) get(i.dimension).interviews += 1;
  for (const d of input.documents) get(d.dimension).documents += 1;
  return map;
}

export function evidenceFor(
  map: Map<number, DimensionEvidence>,
  dimension: number,
): DimensionEvidence {
  return (
    map.get(dimension) ?? {
      dimension,
      respondentsByRole: {},
      fgd: 0,
      interviews: 0,
      documents: 0,
    }
  );
}
