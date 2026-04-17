"use client";

import { Eye, CheckCircle, AlertTriangle, XOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RealityVerdictResult } from "@/lib/truth/types";
import { VERDICT_LABELS } from "@/lib/truth/constants";

const verdictConfig: Record<string, { color: string; icon: LucideIcon; bg: string }> = {
  STRONG: { color: "#10b981", icon: CheckCircle, bg: "rgba(16,185,129,0.1)" },
  MODERATE: { color: "#3b82f6", icon: Eye, bg: "rgba(59,130,246,0.1)" },
  WEAK: { color: "#f59e0b", icon: AlertTriangle, bg: "rgba(245,158,11,0.1)" },
  NO_RELIABLE_EDGE: { color: "#6b7280", icon: XOctagon, bg: "rgba(107,114,128,0.1)" },
};

export function RealityOverview({ result }: { result: RealityVerdictResult }) {
  const config = verdictConfig[result.verdict] ?? verdictConfig.WEAK;
  const Icon = config.icon;

  return (
    <div
      className="glass-card p-5"
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: config.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Reality Check
          </h3>
          <p className="text-lg font-bold" style={{ color: config.color }}>
            {VERDICT_LABELS[result.verdict]}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.integrityOk ? "bg-[var(--accent-emerald)]" : "bg-[var(--accent-rose)]"}`} />
          <span>Data Integrity: {result.integrityOk ? "ผ่าน" : "ไม่ผ่าน"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.baselineBeaten ? "bg-[var(--accent-emerald)]" : "bg-[var(--accent-rose)]"}`} />
          <span>Baseline: {result.baselineBeaten ? "ชนะ" : "ไม่ชนะ"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.backtestSupported ? "bg-[var(--accent-emerald)]" : "bg-[var(--accent-amber)]"}`} />
          <span>Backtest: {result.backtestSupported ? "สนับสนุน" : "ยังไม่ชัดเจน"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.driftActive ? "bg-[var(--accent-amber)]" : "bg-[var(--accent-emerald)]"}`} />
          <span>Drift: {result.driftActive ? "พบ drift" : "ไม่พบ"}</span>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-[var(--text-muted)] whitespace-pre-line">
        {result.summary}
      </p>
    </div>
  );
}
