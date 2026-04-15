"use client";

import { Activity } from "lucide-react";
import type { DriftReport } from "@/lib/truth/types";

export function DriftWarningCard({ report }: { report: DriftReport }) {
  const severityConfig: Record<string, { color: string; label: string }> = {
    none: { color: "var(--accent-emerald)", label: "ไม่พบ drift" },
    low: { color: "var(--accent-blue)", label: "Drift ต่ำ" },
    medium: { color: "var(--accent-amber)", label: "Drift ปานกลาง" },
    high: { color: "var(--accent-rose)", label: "Drift สูง" },
  };

  const config = severityConfig[report.severity] || severityConfig.none;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-[var(--accent-amber)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Drift Detection
        </h3>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: config.color }}>
            {(report.driftScore * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Drift Score</p>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, report.driftScore * 100)}%`,
                background: config.color,
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: config.color }}>
            {config.label}
          </p>
        </div>
      </div>

      {report.affectedAreas.length > 0 && (
        <div className="space-y-1.5 mt-3">
          {report.affectedAreas.map((area, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[var(--bg-input)]"
            >
              <span className="text-[var(--text-secondary)]">{areaLabel(area.area)}</span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">
                  {(area.shift * 100).toFixed(1)}%
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    area.significance === "high"
                      ? "bg-[var(--accent-rose)]"
                      : area.significance === "medium"
                      ? "bg-[var(--accent-amber)]"
                      : "bg-[var(--accent-emerald)]"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-[var(--text-muted)]">
        {report.message}
      </p>
    </div>
  );
}

function areaLabel(area: string): string {
  const labels: Record<string, string> = {
    digit_distribution: "การกระจายตัวเลข",
    last2_frequency: "ความถี่เลข 2 ตัวท้าย",
    weekday_distribution: "การกระจายวัน",
    odd_even_ratio: "สัดส่วนคี่/คู่",
    transition_behavior: "พฤติกรรม transition",
  };
  return labels[area] || area;
}
