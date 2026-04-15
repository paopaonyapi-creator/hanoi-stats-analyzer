import type { DrawResultRecord, FrequencyEntry } from "@/types";
import { computeFrequency } from "./analysis";
import { generateLast2Range } from "@/lib/utils";

// ═══════════════════════════════════════════════
// Rolling Window Stats
// ═══════════════════════════════════════════════

export interface WindowStats {
  windowSize: number;
  records: DrawResultRecord[];
  last2Frequency: FrequencyEntry[];
  last2Values: string[];
}

/**
 * Get records for a rolling window (0 = all records)
 */
export function getWindowRecords(
  records: DrawResultRecord[],
  windowSize: number
): DrawResultRecord[] {
  if (windowSize <= 0 || windowSize >= records.length) {
    return records;
  }
  // Sort by drawDate descending, take last N
  const sorted = [...records].sort(
    (a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
  );
  return sorted.slice(0, windowSize);
}

/**
 * Compute stats for a specific rolling window
 */
export function getRecentWindowStats(
  records: DrawResultRecord[],
  windowSize: number
): WindowStats {
  const windowRecords = getWindowRecords(records, windowSize);
  const last2Values = windowRecords.map((r) => r.last2);

  return {
    windowSize: windowSize || records.length,
    records: windowRecords,
    last2Frequency: computeFrequency(last2Values, generateLast2Range()),
    last2Values,
  };
}
