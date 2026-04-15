"use client";

import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { IntegrityReport } from "@/lib/truth/types";

const levelConfig = {
  HIGH: { color: "var(--accent-emerald)", icon: CheckCircle, label: "สูง" },
  MEDIUM: { color: "var(--accent-amber)", icon: AlertTriangle, label: "ปานกลาง" },
  LOW: { color: "var(--accent-rose)", icon: AlertTriangle, label: "ต่ำ" },
  BROKEN: { color: "#ef4444", icon: XCircle, label: "ใช้งานไม่ได้" },
};

export function IntegrityOverview({ report }: { report: IntegrityReport }) {
  const config = levelConfig[report.level];
  const Icon = config.icon;
  const errorCount = report.issues.filter((i) => i.severity === "error").length;
  const warnCount = report.issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5" style={{ color: config.color }} />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Data Integrity
        </h3>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: config.color }}>
            {report.score.toFixed(0)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">คะแนน</p>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-[var(--bg-input)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${report.score}%`,
                background: config.color,
              }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Icon className="w-3 h-3" style={{ color: config.color }} />
            <span className="text-xs" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-[var(--bg-input)]">
          <p className="text-lg font-bold text-[var(--accent-emerald)]">
            {report.acceptedRows}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Accepted</p>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-input)]">
          <p className="text-lg font-bold text-[var(--accent-rose)]">
            {report.rejectedRows}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Rejected</p>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-input)]">
          <p className="text-lg font-bold text-[var(--accent-amber)]">
            {report.issues.length}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Issues</p>
        </div>
      </div>

      {report.issues.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
            ดู issues ({errorCount} errors, {warnCount} warnings)
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {report.issues.slice(0, 20).map((issue, i) => (
              <div
                key={i}
                className="text-[11px] p-2 rounded bg-[var(--bg-input)] flex items-start gap-2"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                    issue.severity === "error"
                      ? "bg-[var(--accent-rose)]"
                      : issue.severity === "warning"
                      ? "bg-[var(--accent-amber)]"
                      : "bg-[var(--accent-blue)]"
                  }`}
                />
                <span className="text-[var(--text-secondary)]">
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
