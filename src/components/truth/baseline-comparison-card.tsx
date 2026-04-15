"use client";

import { BarChart3 } from "lucide-react";
import type { BaselineComparisonResult } from "@/lib/truth/types";

const interpColors: Record<string, string> = {
  clearly_above_baseline: "var(--accent-emerald)",
  slightly_above_baseline: "var(--accent-blue)",
  indistinguishable_from_baseline: "var(--accent-amber)",
  below_baseline: "var(--accent-rose)",
  sample_too_small: "var(--text-muted)",
  baseline_only: "var(--text-muted)",
};

const interpLabels: Record<string, string> = {
  clearly_above_baseline: "ดีกว่า baseline อย่างชัดเจน",
  slightly_above_baseline: "ดีกว่า baseline เล็กน้อย",
  indistinguishable_from_baseline: "ไม่แตกต่างจาก baseline",
  below_baseline: "แย่กว่า baseline",
  sample_too_small: "ข้อมูลน้อยเกินไป",
  baseline_only: "ยังไม่ได้เปรียบเทียบ",
};

export function BaselineComparisonCard({
  result,
}: {
  result: BaselineComparisonResult;
}) {
  const color = interpColors[result.interpretation] || "var(--text-muted)";
  const label = interpLabels[result.interpretation] || result.interpretation;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--accent-blue)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Baseline Comparison
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="p-3 rounded-xl bg-[var(--bg-input)]">
          <p className="text-2xl font-bold text-[var(--accent-blue)]">
            {(result.engineHitRate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Engine</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-input)]">
          <p className="text-2xl font-bold text-[var(--text-muted)]">
            {(result.randomExpectedHitRate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Random</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-input)]">
          <p
            className="text-2xl font-bold"
            style={{ color }}
          >
            {result.delta >= 0 ? "+" : ""}
            {(result.delta * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Delta</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs" style={{ color }}>
          {label}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Top-{result.topK} | Method: {result.method}
      </p>
    </div>
  );
}
