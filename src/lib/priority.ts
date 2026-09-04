// Priority engine komposit — menggantikan pemeringkatan yang hanya melihat besar Δ gap.
// Priority Score = (Urgency × 0.35) + (Impact × 0.30) + (Risk × 0.20) − (Confidence_penalty × 0.15)
// Confidence_penalty = 1 − skor confidence: evidence tipis menurunkan prioritas
// (artinya "perlu digali", bukan otomatis "mendesak").

import type { ConfidenceResult } from "./confidence";
import { CONFIDENCE_LABELS } from "./confidence";
import { GAP_LABELS } from "./questionnaire";
import type { DimensionSummary } from "./report";

/** Bobot dampak dimensi terhadap kesehatan organisasi (0–1). */
export const IMPACT_WEIGHT: Record<number, number> = {
  1: 0.8,
  2: 0.7,
  3: 0.8,
  4: 0.7,
  5: 0.7,
  6: 0.7,
  7: 1,
  8: 1,
  9: 0.65,
  10: 0.7,
};

/** Kategori risiko per dimensi: kepatuhan/keuangan/legal = 1, SDM/budaya = 0.5, administratif = 0.25. */
export const RISK_WEIGHT: Record<number, number> = {
  1: 0.5,
  2: 0.25,
  3: 0.5,
  4: 0.5,
  5: 0.5,
  6: 0.25,
  7: 1,
  8: 1,
  9: 0.5,
  10: 0.5,
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
    if (risk >= 1) reasons.push("menyentuh kepatuhan syariah/keuangan");
    else if (risk >= 0.5) reasons.push("berdampak pada SDM dan budaya kerja");
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

/** Top prioritas utama: maksimal 5, minimal 3 selama datanya ada. */
export function topPriorities(items: PriorityItem[], max = 5): PriorityItem[] {
  return items.slice(0, Math.min(max, items.length));
}
