import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "blue" | "amber" | "violet" | "emerald" | "rose" | "cyan";
  subtitle?: string;
}

const colorMap = {
  blue: "rgba(59, 130, 246, 0.15)",
  amber: "rgba(245, 158, 11, 0.15)",
  violet: "rgba(139, 92, 246, 0.15)",
  emerald: "rgba(16, 185, 129, 0.15)",
  rose: "rgba(244, 63, 94, 0.15)",
  cyan: "rgba(6, 182, 212, 0.15)",
};

const iconColorMap = {
  blue: "#3b82f6",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  cyan: "#06b6d4",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
}: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: colorMap[color] }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColorMap[color] }} />
          </div>
        )}
      </div>
    </div>
  );
}
