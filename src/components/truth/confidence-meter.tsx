"use client";

export function ConfidenceMeter({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const label =
    clamped >= 65 ? "สูง" : clamped >= 40 ? "ปานกลาง" : "ต่ำ";
  const color =
    clamped >= 65
      ? "var(--accent-emerald)"
      : clamped >= 40
      ? "var(--accent-amber)"
      : "var(--accent-rose)";

  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-[var(--bg-input)] rounded-full overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all`}
          style={{
            width: `${clamped}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>
        {clamped.toFixed(0)}% ({label})
      </span>
    </div>
  );
}
