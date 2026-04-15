import type { TrendScore, TrendScoreExplanation, ScoreWeights } from "@/types";
import { FACTOR_DESCRIPTIONS, FACTOR_NAMES, getDefaultWeights } from "./defaults";

// ═══════════════════════════════════════════════
// Trend Score Explanation
// ═══════════════════════════════════════════════

/**
 * Generate a human-readable breakdown of how a trend score was calculated
 */
export function explainTrendScore(
  trendScore: TrendScore,
  weights?: ScoreWeights
): TrendScoreExplanation {
  const w = weights || getDefaultWeights();

  const factorEntries: TrendScoreExplanation["factors"] = [
    {
      name: FACTOR_NAMES.frequencyAllTime,
      weight: w.allTime,
      rawValue: round(trendScore.factors.frequencyAllTime),
      weightedValue: round(w.allTime * trendScore.factors.frequencyAllTime),
      description: FACTOR_DESCRIPTIONS.frequencyAllTime,
    },
    {
      name: FACTOR_NAMES.frequencyRecent,
      weight: w.recent,
      rawValue: round(trendScore.factors.frequencyRecent),
      weightedValue: round(w.recent * trendScore.factors.frequencyRecent),
      description: FACTOR_DESCRIPTIONS.frequencyRecent,
    },
    {
      name: FACTOR_NAMES.gapFactor,
      weight: w.gap,
      rawValue: round(trendScore.factors.gapFactor),
      weightedValue: round(w.gap * trendScore.factors.gapFactor),
      description: FACTOR_DESCRIPTIONS.gapFactor,
    },
    {
      name: FACTOR_NAMES.transitionFactor,
      weight: w.transition,
      rawValue: round(trendScore.factors.transitionFactor),
      weightedValue: round(w.transition * trendScore.factors.transitionFactor),
      description: FACTOR_DESCRIPTIONS.transitionFactor,
    },
    {
      name: FACTOR_NAMES.digitBalanceFactor,
      weight: w.digitBalance,
      rawValue: round(trendScore.factors.digitBalanceFactor),
      weightedValue: round(w.digitBalance * trendScore.factors.digitBalanceFactor),
      description: FACTOR_DESCRIPTIONS.digitBalanceFactor,
    },
    {
      name: FACTOR_NAMES.repeatBehaviorFactor,
      weight: w.repeat,
      rawValue: round(trendScore.factors.repeatBehaviorFactor),
      weightedValue: round(w.repeat * trendScore.factors.repeatBehaviorFactor),
      description: FACTOR_DESCRIPTIONS.repeatBehaviorFactor,
    },
    {
      name: FACTOR_NAMES.weekdayAlignmentFactor,
      weight: w.weekday,
      rawValue: round(trendScore.factors.weekdayAlignmentFactor),
      weightedValue: round(w.weekday * trendScore.factors.weekdayAlignmentFactor),
      description: FACTOR_DESCRIPTIONS.weekdayAlignmentFactor,
    },
  ];

  return {
    number: trendScore.number,
    score: round(trendScore.score),
    normalizedScore: trendScore.normalizedScore,
    factors: factorEntries,
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
