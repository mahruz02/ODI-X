import { X, FileText, MessageSquare, Users, Award, ShieldAlert } from "lucide-react";
import type { DimensionSummary } from "@/lib/report";
import { ROLE_LABELS, GAP_LABELS, type Role } from "@/lib/questionnaire";

export interface DomainDetailModalProps {
  summary: DimensionSummary | null;
  onClose: () => void;
  evidenceData?: {
    fgdCount: number;
    interviewCount: number;
    docCount: number;
    fgdQuotes?: string[];
    interviewFindings?: string[];
    metrics?: { name: string; target?: string | null; actual?: string | null }[];
  };
}

const ROLES: Role[] = ["pengurus", "manajemen", "karyawan", "stakeholder"];

export function DomainDetailModal({ summary, onClose, evidenceData }: DomainDetailModalProps) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Domain {summary.id} · Triangulasi Detail
            </span>
            <h3 className="font-display text-2xl font-extrabold tracking-tight mt-0.5">
              {summary.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{summary.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 text-xs">
          {/* Scorecards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-background p-3">
              <span className="text-muted-foreground font-semibold block text-[10px]">Skor Agregat</span>
              <p className="text-xl font-extrabold text-primary mt-0.5">
                {summary.scoreNormalized != null ? `${summary.scoreNormalized}/100` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Rata-rata Likert: {summary.average?.toFixed(2) ?? "—"}</p>
            </div>
            <div className="rounded-xl border bg-background p-3">
              <span className="text-muted-foreground font-semibold block text-[10px]">Gap Persepsi Δ</span>
              <p className="text-xl font-extrabold text-foreground mt-0.5">{summary.gap.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">Status: {GAP_LABELS[summary.level]}</p>
            </div>
            <div className="rounded-xl border bg-background p-3">
              <span className="text-muted-foreground font-semibold block text-[10px]">Bukti Kualitatif</span>
              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {(evidenceData?.fgdCount ?? 0) + (evidenceData?.interviewCount ?? 0) + (evidenceData?.docCount ?? 0)} Bukti
              </p>
              <p className="text-[10px] text-muted-foreground">
                FGD: {evidenceData?.fgdCount ?? 0} · IV: {evidenceData?.interviewCount ?? 0} · Dok: {evidenceData?.docCount ?? 0}
              </p>
            </div>
          </div>

          {/* Table Role Scores */}
          <div>
            <h4 className="font-bold text-foreground mb-2 uppercase tracking-wider text-[10px]">
              Rincian Persepsi Per Level Manajemen
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map((r) => {
                const score = summary.roleScores[r];
                return (
                  <div key={r} className="rounded-xl border bg-background p-2.5 text-center">
                    <span className="text-muted-foreground text-[10px] font-semibold block">{ROLE_LABELS[r]}</span>
                    <span className="font-extrabold text-sm text-foreground block mt-0.5">
                      {score != null ? score.toFixed(2) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence Quotes / Findings */}
          {evidenceData && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                Kutipan Kualitatif & Bukti Dokumen
              </h4>

              {evidenceData.fgdQuotes && evidenceData.fgdQuotes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-primary block flex items-center gap-1">
                    <Users className="size-3" /> Temuan FGD:
                  </span>
                  {evidenceData.fgdQuotes.map((q, i) => (
                    <blockquote key={i} className="rounded-xl border bg-background p-2.5 italic text-muted-foreground">
                      “{q}”
                    </blockquote>
                  ))}
                </div>
              )}

              {evidenceData.interviewFindings && evidenceData.interviewFindings.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-primary block flex items-center gap-1">
                    <MessageSquare className="size-3" /> Temuan Wawancara:
                  </span>
                  {evidenceData.interviewFindings.map((f, i) => (
                    <div key={i} className="rounded-xl border bg-background p-2.5 text-muted-foreground">
                      {f}
                    </div>
                  ))}
                </div>
              )}

              {evidenceData.metrics && evidenceData.metrics.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-primary block flex items-center gap-1">
                    <FileText className="size-3" /> Data Objektif Kuantitatif:
                  </span>
                  <div className="rounded-xl border bg-background p-2.5 space-y-1">
                    {evidenceData.metrics.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px]">
                        <span className="font-medium">{m.name}</span>
                        <span className="font-bold">Target: {m.target || "—"} | Actual: {m.actual || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
}
