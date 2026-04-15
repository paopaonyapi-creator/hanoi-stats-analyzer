"use client";

import { FlaskConical } from "lucide-react";
import type { BacktestSummary } from "@/lib/truth/types";
import { VERDICT_LABELS } from "@/lib/truth/constants";

export function BacktestSummaryCard({ summary }: { summary: BacktestSummary }) {
  const verdictColor =
    summary.verdict === "STRONG"
      ? "var(--accent-emerald)"
      : summary.verdict === "MODERATE"
      ? "var(--accent-blue)"
      : summary.verdict === "WEAK"
      ? "var(--accent-amber)"
      : "var(--text-muted)";

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <FlaskConical className="w-5 h-5 text-[var(--accent-violet)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Walk-Forward Backtest
        </h3>
      </div>

      {summary.insufficientData ? (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--text-muted)]">{summary.message}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[var(--bg-input)] text-center">
              <p className="text-2xl font-bold text-[var(--accent-violet)]">
                {summary.totalFolds}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Folds</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-input)] text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: verdictColor }}
              >
                {VERDICT_LABELS[summary.verdict] || summary.verdict}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Verdict</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="p-2 rounded-lg bg-[var(--bg-input)]">
              <p className="text-lg font-bold text-[var(--accent-blue)]">
                {(summary.averageHitRate * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Hit Rate</p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-input)]">
              <p className="text-lg font-bold text-[var(--text-muted)]">
                {(summary.averageBaseline * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Baseline</p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-input)]">
              <p
                className="text-lg font-bold"
                style={{ color: verdictColor }}
              >
                {summary.averageDelta >= 0 ? "+" : ""}
                {(summary.averageDelta * 100).toFixed(2)}%
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Delta</p>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            {summary.message}
          </p>

          {summary.calibrationBuckets.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-[var(--text-muted)] cursor-pointer">
                Calibration Buckets ({summary.calibrationBuckets.length})
              </summary>
              <div className="mt-2 space-y-1">
                {summary.calibrationBuckets.map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-[11px] p-1.5 rounded bg-[var(--bg-input)]"
                  >
                    <span className="text-[var(--text-secondary)]">
                      คะแนน {b.bucket}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      ปรากฏจริง {(b.observedRate * 100).toFixed(1)}% ({b.count} เลข)
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
