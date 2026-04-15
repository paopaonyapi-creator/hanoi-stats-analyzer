// ═══════════════════════════════════════════════
// Truth Engine — Baseline Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { BaselineComparisonResult, TruthScoreResult } from "./types";

/**
 * Estimate the expected random hit rate for top-K selection.
 * For 00-99 with uniform distribution, P(hit) = topK / 100 per draw.
 */
export function estimateRandomTopKHitRate(topK: number): number {
  return topK / 100;
}

/**
 * Run a deterministic random baseline simulation.
 * Instead of random sampling, use mathematical expectation.
 */
export function runRandomBaseline(
  records: DrawResultRecord[],
  options: { topK: number }
): BaselineComparisonResult {
  const expectedHitRate = estimateRandomTopKHitRate(options.topK);

  return {
    method: "mathematical_expectation",
    topK: options.topK,
    engineHitRate: 0, // to be filled by comparison
    randomExpectedHitRate: expectedHitRate,
    delta: 0,
    interpretation: "baseline_only",
  };
}

/**
 * Compare engine results against baseline.
 * Evaluates how well the engine's top-K picks actually performed
 * on a known outcome set.
 */
export function compareEngineVsBaseline(
  engineTopK: string[],
  outcomeValues: string[],
  topK: number
): BaselineComparisonResult {
  const expectedHitRate = estimateRandomTopKHitRate(topK);

  // Count hits: how many outcomes fell within engine's top-K
  const topKSet = new Set(engineTopK);
  let hits = 0;
  for (const outcome of outcomeValues) {
    if (topKSet.has(outcome)) hits++;
  }
  const engineHitRate = outcomeValues.length > 0 ? hits / outcomeValues.length : 0;
  const delta = engineHitRate - expectedHitRate;

  const interpretation = interpretDelta(delta, topK, outcomeValues.length);

  return {
    method: "engine_vs_expected",
    topK,
    engineHitRate,
    randomExpectedHitRate: expectedHitRate,
    delta,
    interpretation,
  };
}

/**
 * Compare engine truth scores against baseline using historical data.
 * Uses the top-K scored numbers and checks what actually appeared next.
 */
export function evaluateEngineOnHistoricalData(
  truthScores: TruthScoreResult[],
  testRecords: DrawResultRecord[],
  topK: number
): BaselineComparisonResult {
  const engineTopK = truthScores
    .slice(0, topK)
    .map((s) => s.number);

  const outcomeValues = testRecords.map((r) => r.last2);

  return compareEngineVsBaseline(engineTopK, outcomeValues, topK);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function interpretDelta(delta: number, topK: number, sampleSize: number): string {
  if (sampleSize < 10) {
    return "sample_too_small";
  }

  if (delta >= 0.05) {
    return "clearly_above_baseline";
  }
  if (delta >= 0.02) {
    return "slightly_above_baseline";
  }
  if (delta >= -0.02) {
    return "indistinguishable_from_baseline";
  }
  return "below_baseline";
}
