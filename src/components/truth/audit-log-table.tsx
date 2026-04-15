"use client";

import { ScrollText } from "lucide-react";
import type { AuditLogEntry } from "@/lib/truth/types";

const severityColors: Record<string, string> = {
  info: "var(--accent-blue)",
  warning: "var(--accent-amber)",
  error: "var(--accent-rose)",
};

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <ScrollText className="w-5 h-5 text-[var(--accent-blue)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Audit Trail
        </h3>
        <span className="text-[10px] text-[var(--text-muted)]">
          ({logs.length} events)
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">
          ยังไม่มี log
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="text-left py-2 pr-2">เวลา</th>
                <th className="text-left py-2 pr-2">Event</th>
                <th className="text-left py-2 pr-2">Severity</th>
                <th className="text-left py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[var(--border)] border-opacity-30"
                >
                  <td className="py-2 pr-2 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-2 text-[var(--text-secondary)] font-mono">
                    {log.eventType}
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        color: severityColors[log.severity] || "var(--text-muted)",
                        background: `${severityColors[log.severity] || "var(--text-muted)"}15`,
                      }}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-muted)] max-w-[200px] truncate">
                    {JSON.stringify(log.detailJson).slice(0, 80)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
