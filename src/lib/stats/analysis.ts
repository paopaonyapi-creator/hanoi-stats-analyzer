import type {
  FrequencyEntry,
  WeekdayStats,
  MonthStats,
  AnalysisSummary,
  DrawResultRecord,
  DrawType,
} from "@/types";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { generateLast2Range, generateDigitRange, getTens, getUnits } from "@/lib/utils";
import { computeGapAnalysis } from "./gap";
import { computeTransitions } from "./transitions";

// ═══════════════════════════════════════════════
// Frequency Analysis
// ═══════════════════════════════════════════════

export function computeFrequency(
  values: string[],
  allPossible?: string[]
): FrequencyEntry[] {
  const counts = new Map<string, number>();

  // Initialize with all possible values
  if (allPossible) {
    allPossible.forEach((v) => counts.set(v, 0));
  }

  values.forEach((v) => {
    counts.set(v, (counts.get(v) || 0) + 1);
  });

  const total = values.length || 1;
  const entries: FrequencyEntry[] = [];

  counts.forEach((count, value) => {
    entries.push({
      value,
      count,
      percentage: Math.round((count / total) * 10000) / 100,
    });
  });

  return entries.sort((a, b) => b.count - a.count);
}

// ═══════════════════════════════════════════════
// Odd/Even & Low/High Ratios
// ═══════════════════════════════════════════════

export function computeOddEvenRatio(last2Values: string[]): {
  odd: number;
  even: number;
} {
  let odd = 0;
  let even = 0;
  last2Values.forEach((v) => {
    const num = parseInt(v, 10);
    if (num % 2 === 0) even++;
    else odd++;
  });
  return { odd, even };
}

export function computeLowHighRatio(last2Values: string[]): {
  low: number;
  high: number;
} {
  let low = 0;
  let high = 0;
  last2Values.forEach((v) => {
    const num = parseInt(v, 10);
    if (num < 50) low++;
    else high++;
  });
  return { low, high };
}

// ═══════════════════════════════════════════════
// Weekday Stats
// ═══════════════════════════════════════════════

export function computeWeekdayStats(records: DrawResultRecord[]): WeekdayStats[] {
  const counts = Array(7).fill(0);
  records.forEach((r) => {
    if (r.weekday >= 0 && r.weekday <= 6) {
      counts[r.weekday]++;
    }
  });
  return counts.map((count, i) => ({
    weekday: i,
    label: WEEKDAY_LABELS[i],
    count,
  }));
}

// ═══════════════════════════════════════════════
// Month Stats
// ═══════════════════════════════════════════════

export function computeMonthStats(records: DrawResultRecord[]): MonthStats[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    const key = r.monthKey;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([monthKey, count]) => ({ monthKey, count }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

// ═══════════════════════════════════════════════
// Build Full Analysis Summary
// ═══════════════════════════════════════════════

export function buildAnalysisSummary(
  records: DrawResultRecord[]
): AnalysisSummary {
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  const last2Values = sorted.map((r) => r.last2);
  const last3Values = sorted.map((r) => r.last3);

  // Get unique days
  const uniqueDays = new Set(sorted.map((r) => r.drawDate.slice(0, 10)));

  // Count by type
  const byType: Record<DrawType, number> = { SPECIAL: 0, NORMAL: 0, VIP: 0 };
  sorted.forEach((r) => {
    byType[r.drawType]++;
  });

  // Digit frequencies
  const allDigits = last2Values.flatMap((v) => v.split(""));
  const tensValues = last2Values.map((v) => getTens(v));
  const unitsValues = last2Values.map((v) => getUnits(v));

  // Date range
  const dateRange =
    sorted.length > 0
      ? {
          from: sorted[0].drawDate,
          to: sorted[sorted.length - 1].drawDate,
        }
      : null;

  return {
    totalRecords: sorted.length,
    totalDays: uniqueDays.size,
    dateRange,
    byType,
    topLast2: computeFrequency(last2Values, generateLast2Range()).slice(0, 20),
    topLast3: computeFrequency(last3Values).slice(0, 20),
    digitFrequency: computeFrequency(allDigits, generateDigitRange()),
    tensFrequency: computeFrequency(tensValues, generateDigitRange()),
    unitsFrequency: computeFrequency(unitsValues, generateDigitRange()),
    oddEvenRatio: computeOddEvenRatio(last2Values),
    lowHighRatio: computeLowHighRatio(last2Values),
    weekdayStats: computeWeekdayStats(sorted),
    monthStats: computeMonthStats(sorted),
    gapAnalysis: computeGapAnalysis(last2Values, generateLast2Range()).slice(0, 30),
    transitions: computeTransitions(last2Values).slice(0, 30),
    recentRecords: sorted.slice(-10).reverse(),
  };
}
