import type {
  DrawResultRecord,
  ScoreWeights,
  TrendScore,
  TrendFactors,
} from "@/types";
import { generateLast2Range, getTens, getUnits } from "@/lib/utils";
import { computeFrequency } from "@/lib/stats/analysis";
import { getGapFactor } from "@/lib/stats/gap";
import { getTransitionFactor } from "@/lib/stats/transitions";
import { getDefaultWeights } from "./defaults";

// ═══════════════════════════════════════════════
// Trend Score Calculator
// ═══════════════════════════════════════════════

/**
 * Calculate trend scores for all 00-99 numbers
 * This is a deterministic statistical analysis, NOT a prediction
 */
export function calculateTrendScores(
  records: DrawResultRecord[],
  weights?: ScoreWeights,
  windowSize?: number,
  targetWeekday?: number
): TrendScore[] {
  const w = weights || getDefaultWeights();
  const allNumbers = generateLast2Range();

  if (records.length === 0) {
    return allNumbers.map((num) => ({
      number: num,
      score: 0,
      normalizedScore: 0,
      factors: createEmptyFactors(),
    }));
  }

  // Sort records by date ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  const allLast2 = sorted.map((r) => r.last2);

  // Recent window
  const recentSize = windowSize && windowSize > 0 ? windowSize : Math.min(50, sorted.length);
  const recentLast2 = allLast2.slice(-recentSize);

  // All-time frequency
  const allTimeFreq = computeFrequency(allLast2, allNumbers);
  const allTimeMap = new Map(allTimeFreq.map((e) => [e.value, e.count]));

  // Recent frequency
  const recentFreq = computeFrequency(recentLast2, allNumbers);
  const recentMap = new Map(recentFreq.map((e) => [e.value, e.count]));

  // Last drawn value for transition
  const lastDrawn = allLast2.length > 0 ? allLast2[allLast2.length - 1] : "";

  // Weekday frequency
  const wdRecords =
    targetWeekday !== undefined
      ? sorted.filter((r) => r.weekday === targetWeekday)
      : sorted;
  const wdLast2 = wdRecords.map((r) => r.last2);
  const wdFreq = computeFrequency(wdLast2, allNumbers);
  const wdMap = new Map(wdFreq.map((e) => [e.value, e.count]));

  // Max values for normalization
  const maxAllTime = Math.max(...Array.from(allTimeMap.values()), 1);
  const maxRecent = Math.max(...Array.from(recentMap.values()), 1);

  // Calculate raw scores
  const rawScores = allNumbers.map((num) => {
    const factors = calculateFactors(
      num,
      allLast2,
      allTimeMap,
      recentMap,
      lastDrawn,
      wdMap,
      maxAllTime,
      maxRecent,
      allNumbers
    );

    const score =
      w.allTime * factors.frequencyAllTime +
      w.recent * factors.frequencyRecent +
      w.gap * factors.gapFactor +
      w.transition * factors.transitionFactor +
      w.digitBalance * factors.digitBalanceFactor +
      w.repeat * factors.repeatBehaviorFactor +
      w.weekday * factors.weekdayAlignmentFactor;

    return { number: num, score, normalizedScore: 0, factors };
  });

  // Normalize scores to 0-100
  const maxScore = Math.max(...rawScores.map((s) => s.score), 0.001);
  rawScores.forEach((s) => {
    s.normalizedScore = Math.round((s.score / maxScore) * 100 * 100) / 100;
  });

  return rawScores.sort((a, b) => b.normalizedScore - a.normalizedScore);
}

function calculateFactors(
  num: string,
  allLast2: string[],
  allTimeMap: Map<string, number>,
  recentMap: Map<string, number>,
  lastDrawn: string,
  wdMap: Map<string, number>,
  maxAllTime: number,
  maxRecent: number,
  allNumbers: string[]
): TrendFactors {
  // 1. Frequency all-time (normalized)
  const frequencyAllTime = (allTimeMap.get(num) || 0) / maxAllTime;

  // 2. Frequency recent (normalized)
  const frequencyRecent = (recentMap.get(num) || 0) / maxRecent;

  // 3. Gap factor
  const gapFactor = getGapFactor(num, allLast2, allNumbers);

  // 4. Transition factor
  const transitionFactor = getTransitionFactor(num, lastDrawn, allLast2);

  // 5. Digit balance factor
  const tens = parseInt(getTens(num), 10);
  const units = parseInt(getUnits(num), 10);
  const digitBalanceFactor = 1 - Math.abs(tens - units) / 9; // closer digits = higher

  // 6. Repeat behavior factor
  const repeatBehaviorFactor = computeRepeatFactor(num, allLast2);

  // 7. Weekday alignment factor
  const maxWd = Math.max(...Array.from(wdMap.values()), 1);
  const weekdayAlignmentFactor = (wdMap.get(num) || 0) / maxWd;

  return {
    frequencyAllTime,
    frequencyRecent,
    gapFactor,
    transitionFactor,
    digitBalanceFactor,
    repeatBehaviorFactor,
    weekdayAlignmentFactor,
  };
}

function computeRepeatFactor(num: string, values: string[]): number {
  if (values.length < 3) return 0;
  // Check if the number appeared in consecutive or near-consecutive draws recently
  const last20 = values.slice(-20);
  let repeats = 0;
  for (let i = 1; i < last20.length; i++) {
    if (last20[i] === num && last20[i - 1] === num) {
      repeats++;
    }
  }
  // Also check if it appeared within last 3 draws
  const last3 = values.slice(-3);
  const recentAppearance = last3.includes(num) ? 0.3 : 0;

  return Math.min(repeats * 0.5 + recentAppearance, 1);
}

function createEmptyFactors(): TrendFactors {
  return {
    frequencyAllTime: 0,
    frequencyRecent: 0,
    gapFactor: 0,
    transitionFactor: 0,
    digitBalanceFactor: 0,
    repeatBehaviorFactor: 0,
    weekdayAlignmentFactor: 0,
  };
}

/**
 * Normalize a single score to 0-100 range
 */
export function normalizeScore(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100 * 100) / 100;
}
