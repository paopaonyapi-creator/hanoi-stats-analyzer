"use client";

import { FileText } from "lucide-react";
import type { TruthScoreResult } from "@/lib/truth/types";
import { TruthScorePill } from "./truth-score-pill";
import { ConfidenceMeter } from "./confidence-meter";

export function ScoreExplanationPanel({
  result,
  onClose,
}: {
  result: TruthScoreResult;
  onClose: () => void;
}) {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-violet-dim)] flex items-center justify-center">
            <span className="text-lg font-bold text-[var(--accent-violet)]">
              {result.number}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              รายละเอียดเชิงลึก — เลข {result.number}
            </h3>
            <TruthScorePill label={result.label} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          ✕ ปิด
        </button>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-[var(--bg-input)] text-center">
          <p className="text-2xl font-bold text-[var(--accent-violet)]">
            {result.trendScore.toFixed(1)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Trend Score</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-input)] text-center">
          <p className="text-2xl font-bold text-[var(--accent-blue)]">
            {result.confidenceScore.toFixed(1)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Confidence</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-input)] text-center">
          <p className="text-2xl font-bold text-[var(--accent-emerald)]">
            {result.evidenceStrength.toFixed(1)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Evidence</p>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="mb-4">
        <p className="text-xs text-[var(--text-muted)] mb-1">ระดับความมั่นใจ</p>
        <ConfidenceMeter value={result.confidenceScore} />
      </div>

      {/* Top Signals */}
      {result.topSignals.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-[var(--accent-emerald)] mb-2">
            ✦ ปัจจัยบวก
          </h4>
          <div className="space-y-1">
            {result.topSignals.map((s, i) => (
              <p key={i} className="text-[11px] text-[var(--text-secondary)] pl-3">
                • {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Penalties */}
      {result.penalties.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-[var(--accent-rose)] mb-2">
            ⚠ ปัจจัยลบ
          </h4>
          <div className="space-y-1">
            {result.penalties.map((p, i) => (
              <p key={i} className="text-[11px] text-[var(--text-secondary)] pl-3">
                • {p}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Full Explanation */}
      <div className="mt-4 p-3 rounded-xl bg-[var(--bg-input)]">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[10px] text-[var(--text-muted)]">คำอธิบาย</span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
          {result.explanation}
        </p>
      </div>

      <p className="mt-3 text-[10px] text-[var(--text-muted)] text-center">
        Integrity Score: {result.integrityScore}/100
      </p>
    </div>
  );
}
