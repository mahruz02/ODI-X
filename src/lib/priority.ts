// Priority engine komposit — perumusan prioritas ODI-X
// Priority Score = (Urgency × 0.35) + (Impact × 0.30) + (Risk × 0.20) − (Confidence_penalty × 0.15)

import type { ConfidenceResult } from "./confidence";
import { CONFIDENCE_LABELS } from "./confidence";
import { GAP_LABELS } from "./questionnaire";
import type { DimensionSummary } from "./report";

/** Bobot dampak dimensi terhadap kesehatan organisasi (0–1). */
export const IMPACT_WEIGHT: Record<number, number> = {
  1: 0.85, // Konteks Eksternal
  2: 0.90, // Strategi & Arah
  3: 0.95, // Kepemimpinan & Tata Kelola
  4: 0.75, // Struktur Organisasi
  5: 0.85, // Budaya & Etika
  6: 0.80, // SDM & Kompetensi
  7: 0.70, // Desain Pekerjaan
  8: 0.80, // Tim & Kolaborasi
  9: 0.85, // Proses & Teknologi
  10: 0.90, // Manajemen Kinerja
  11: 1.00, // Risiko & Kontrol
  12: 0.85, // Pengalaman Stakeholder
};

/** Kategori risiko per dimensi: kepatuhan/keuangan/legal = 1, SDM/budaya = 0.5, administratif = 0.25. */
export const RISK_WEIGHT: Record<number, number> = {
  1: 0.6,
  2: 0.7,
  3: 0.9,
  4: 0.5,
  5: 0.8,
  6: 0.7,
  7: 0.5,
  8: 0.6,
  9: 0.75,
  10: 0.8,
  11: 1.0,
  12: 0.7,
};

export interface PriorityItem {
  dimension: number;
  name: string;
  score: number;
  urgency: number;
  impact: number;
  risk: number;
  confidence: ConfidenceResult;
  average: number | null;
  gap: number;
  reason: string;
}

export function buildPriorities(
  summaries: DimensionSummary[],
  confidenceOf: (dimension: number) => ConfidenceResult,
): PriorityItem[] {
  const items: PriorityItem[] = [];
  for (const s of summaries) {
    if (s.average == null) continue;
    const conf = confidenceOf(s.id);
    const urgency = Math.min(s.gap / 1.5, 1);
    const shortfall = Math.min(Math.max((5 - s.average) / 4, 0), 1);
    const weight = IMPACT_WEIGHT[s.id] ?? 0.7;
    const impact = 0.5 * weight + 0.5 * shortfall;
    const risk = RISK_WEIGHT[s.id] ?? 0.5;
    const penalty = 1 - conf.score;
    const score = Math.max(
      0,
      urgency * 0.35 + impact * 0.3 + risk * 0.2 - penalty * 0.15,
    );

    const reasons: string[] = [];
    if (urgency >= 0.5) reasons.push(`gap persepsi ${s.gap.toFixed(2)} (${GAP_LABELS[s.level].toLowerCase()})`);
    if (shortfall >= 0.45) reasons.push(`skor rata-rata rendah (${s.average.toFixed(2)})`);
    if (risk >= 0.9) reasons.push("menyentuh kepatuhan, risiko, dan tata kelola");
    else if (risk >= 0.6) reasons.push("berdampak pada SDM, efisiensi, dan kinerja");
    reasons.push(CONFIDENCE_LABELS[conf.level].toLowerCase());
    items.push({
      dimension: s.id,
      name: s.name,
      score,
      urgency,
      impact,
      risk,
      confidence: conf,
      average: s.average,
      gap: s.gap,
      reason: `Diprioritaskan karena ${reasons.join(" + ")}.`,
    });
  }
  return items.sort((a, b) => b.score - a.score || a.dimension - b.dimension);
}

export function topPriorities(items: PriorityItem[], max = 5): PriorityItem[] {
  return items.slice(0, Math.min(max, items.length));
}
