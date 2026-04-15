// ═══════════════════════════════════════════════
// Truth Engine — Feature Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { NumberFeatures, DatasetFeatures } from "./types";
import { ALL_NUMBERS_00_99 } from "./constants";

/**
 * Build features for all 100 canonical numbers (00-99).
 */
export function buildFeatureMatrix(
  records: DrawResultRecord[],
  options?: { currentWeekday?: number; previousLast2?: string | null }
): NumberFeatures[] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );
  const last2Values = sorted.map((r) => r.last2);
  const weekdays = sorted.map((r) => r.weekday);
  const total = last2Values.length;

  // Pre-compute per-number indices
  const indexMap = new Map<string, number[]>();
  for (const num of ALL_NUMBERS_00_99) indexMap.set(num, []);
  last2Values.forEach((v, i) => {
    const arr = indexMap.get(v);
    if (arr) arr.push(i);
  });

  const currentWeekday = options?.currentWeekday ?? new Date().getDay();
  const prevLast2 = options?.previousLast2 ?? (total > 0 ? last2Values[total - 1] : null);

  // Recent windows
  const recent10 = last2Values.slice(-10);
  const recent20 = last2Values.slice(-20);
  const recent50 = last2Values.slice(-50);

  return ALL_NUMBERS_00_99.map((num) => {
    const indices = indexMap.get(num) || [];
    const count = indices.length;

    // Frequency
    const frequencyAllTime = total > 0 ? count / total : 0;
    const frequencyRecent10 = recent10.filter((v) => v === num).length / Math.max(recent10.length, 1);
    const frequencyRecent20 = recent20.filter((v) => v === num).length / Math.max(recent20.length, 1);
    const frequencyRecent50 = recent50.filter((v) => v === num).length / Math.max(recent50.length, 1);

    // Gap
    const recencyGap = count > 0 ? total - 1 - indices[indices.length - 1] : null;
    const gaps = computeGaps(indices, total);
    const meanGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null;
    const medianGap = gaps.length > 0 ? sortedMedian(gaps) : null;

    // Recurrence rate
    const recurrenceRate = total > 1 ? count / total : 0;

    // Recency decay: exponential decay from last appearance
    const recencyDecayScore =
      recencyGap !== null ? Math.exp(-0.1 * recencyGap) : 0;

    // Window stability: variance across windows
    const windowFreqs = [frequencyRecent10, frequencyRecent20, frequencyRecent50, frequencyAllTime];
    const windowStabilityScore = 1 - normalizedVariance(windowFreqs);

    // Variance of occurrence intervals
    const varianceOfOccurrence = gaps.length >= 2 ? variance(gaps) : null;

    // Weekday alignment
    const weekdayAlignmentScore = computeWeekdayAlignment(
      indices,
      weekdays,
      currentWeekday,
      total
    );

    // Digit balance
    const digitBalanceScore = computeDigitBalance(num);

    // Transition support
    const transitionSupportScore =
      prevLast2 !== null ? computeTransitionSupport(prevLast2, num, last2Values) : 0;

    return {
      number: num,
      frequencyAllTime,
      frequencyRecent10,
      frequencyRecent20,
      frequencyRecent50,
      recencyGap,
      meanGap,
      medianGap,
      recurrenceRate,
      recencyDecayScore,
      windowStabilityScore,
      varianceOfOccurrence,
      weekdayAlignmentScore,
      digitBalanceScore,
      transitionSupportScore,
    };
  });
}

/**
 * Build dataset-level features.
 */
export function buildDatasetFeatures(records: DrawResultRecord[]): DatasetFeatures {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      uniqueNumbers: 0,
      dateSpanDays: 0,
      avgRecordsPerDay: 0,
      hasMinimumForAnalysis: false,
      hasMinimumForBacktest: false,
    };
  }

  const dates = records.map((r) => new Date(r.drawDate).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpanDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000));

  const uniqueNumbers = new Set(records.map((r) => r.last2)).size;

  return {
    totalRecords: records.length,
    uniqueNumbers,
    dateSpanDays,
    avgRecordsPerDay: records.length / dateSpanDays,
    hasMinimumForAnalysis: records.length >= 30,
    hasMinimumForBacktest: records.length >= 80,
  };
}

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

function computeGaps(indices: number[], total: number): number[] {
  if (indices.length < 2) return [];
  const gaps: number[] = [];
  for (let i = 1; i < indices.length; i++) {
    gaps.push(indices[i] - indices[i - 1]);
  }
  return gaps;
}

function sortedMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

function normalizedVariance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const v = variance(arr);
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  if (mean === 0) return 0;
  // Coefficient of variation, clamped to [0, 1]
  return Math.min(1, Math.sqrt(v) / Math.max(mean, 0.001));
}

function computeWeekdayAlignment(
  indices: number[],
  weekdays: number[],
  targetWeekday: number,
  total: number
): number {
  if (indices.length === 0 || total === 0) return 0;
  const matchCount = indices.filter((i) => weekdays[i] === targetWeekday).length;
  const totalOnWeekday = weekdays.filter((w) => w === targetWeekday).length;
  if (totalOnWeekday === 0) return 0;
  return matchCount / totalOnWeekday;
}

function computeDigitBalance(num: string): number {
  const d1 = parseInt(num[0]);
  const d2 = parseInt(num[1]);
  // Perfect balance = 1.0, max imbalance = 0
  return 1 - Math.abs(d1 - d2) / 9;
}

function computeTransitionSupport(
  fromNum: string,
  toNum: string,
  allValues: string[]
): number {
  if (allValues.length < 2) return 0;
  let transitionCount = 0;
  let fromCount = 0;
  for (let i = 0; i < allValues.length - 1; i++) {
    if (allValues[i] === fromNum) {
      fromCount++;
      if (allValues[i + 1] === toNum) transitionCount++;
    }
  }
  return fromCount > 0 ? transitionCount / fromCount : 0;
}
