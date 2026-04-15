"use client";

import { TRUTH_LABEL_COLORS, TRUTH_LABEL_THAI } from "@/lib/truth/constants";
import type { TruthLabel } from "@/lib/truth/types";

export function TruthScorePill({ label }: { label: TruthLabel }) {
  const color = TRUTH_LABEL_COLORS[label] || "#6b7280";
  const text = TRUTH_LABEL_THAI[label] || label;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}
