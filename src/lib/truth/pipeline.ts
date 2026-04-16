// ═══════════════════════════════════════════════
// Truth Engine — Pipeline Orchestrator
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { TruthPipelineResult, TruthEngineSettings } from "./types";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "./constants";
import { computeIntegrityReport, quarantineBrokenRows } from "./integrity";
import { buildDatasetFeatures } from "./features";
import { buildTruthScores } from "./scoring";
import { runRandomBaseline, evaluateEngineOnHistoricalData } from "./baseline";
import { runWalkForwardBacktest } from "./backtest";
import { detectDrift } from "./drift";
import { buildRealityVerdict } from "./verdict";

/**
 * Run the full Truth Pipeline from raw data to final verdict.
 * Steps:
 *  1. Compute integrity
 *  2. Quarantine broken rows
 *  3. Build features (internal to scoring)
 *  4. Build signals (internal to scoring)
 *  5. Compute truth scores
 *  6. Run baseline comparison
 *  7. Run walk-forward backtest
 *  8. Detect drift
 *  9. Build reality verdict
 * 10. Return complete report
 */
export function runTruthPipeline(
  records: DrawResultRecord[],
  options?: {
    settings?: TruthEngineSettings;
    drawType?: string | null;
    persistSnapshots?: boolean;
  }
): TruthPipelineResult {
  const settings = options?.settings ?? DEFAULT_TRUTH_ENGINE_SETTINGS;

  // Step 1: Integrity
  const integrityReport = computeIntegrityReport(records);

  // Step 2: Quarantine
  const acceptedRecords = quarantineBrokenRows(records, integrityReport);

  const sorted = [...acceptedRecords].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  // Step 3: Drift detection (Harden early for scoring)
  let driftReport;
  if (sorted.length >= 40) {
    const splitPoint = Math.floor(sorted.length * 0.6);
    const referenceRecords = sorted.slice(0, splitPoint);
    const recentRecords = sorted.slice(splitPoint);
    driftReport = detectDrift(referenceRecords, recentRecords);
  } else {
    driftReport = { 
        driftScore: 0, 
        volatilityIndex: 0,
        affectedAreas: [], 
        severity: "none" as const, 
        message: "ข้อมูลไม่เพียงพอสำหรับตรวจ drift" 
    };
  }

  // Step 4-5-6: Features + Signals + Truth Scores
  const truthScores = buildTruthScores(acceptedRecords, integrityReport, {
    settings,
    driftReport,
    drawType: options?.drawType,
  });

  // Step 6: Baseline comparison
  const sorted = [...acceptedRecords].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  let baselineComparison;
  if (sorted.length >= 20) {
    // Use last 10% as test for baseline evaluation
    const split = Math.max(10, Math.floor(sorted.length * 0.1));
    const trainRecords = sorted.slice(0, sorted.length - split);
    const testRecords = sorted.slice(sorted.length - split);

    const trainIntegrity = computeIntegrityReport(trainRecords);
    const trainScores = buildTruthScores(trainRecords, trainIntegrity, { settings });

    baselineComparison = evaluateEngineOnHistoricalData(
      trainScores,
      testRecords,
      settings.baselineTopK
    );
  } else {
    baselineComparison = runRandomBaseline(acceptedRecords, {
      topK: settings.baselineTopK,
    });
  }

  // Step 7: Walk-forward backtest
  const backtestSummary = runWalkForwardBacktest(acceptedRecords, {
    settings,
    topK: settings.baselineTopK,
  });

  // Step 9: Reality verdict
  const realityVerdict = buildRealityVerdict({
    integrityReport,
    backtestSummary,
    baselineResult: baselineComparison,
    driftReport,
    settings,
  });

  // Re-build truth scores with hints if necessary (keeping drift context)
  const updatedScores = buildTruthScores(acceptedRecords, integrityReport, {
    settings,
    driftReport,
    baselineDelta: baselineComparison.delta,
    backtestHint: backtestSummary.averageDelta,
    drawType: options?.drawType,
  });

  // Step 10: Build dataset features for output
  const datasetFeatures = buildDatasetFeatures(acceptedRecords);

  return {
    integrityReport,
    truthScores: updatedScores,
    baselineComparison,
    backtestSummary,
    driftReport,
    realityVerdict,
    datasetFeatures,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Convenience functions for automation hooks
// ─────────────────────────────────────────────

/**
 * Run integrity check + scoring only (faster, no backtest).
 */
export function runIntegrityThenScoring(
  records: DrawResultRecord[],
  options?: { settings?: TruthEngineSettings }
): Pick<TruthPipelineResult, "integrityReport" | "truthScores" | "datasetFeatures" | "generatedAt"> {
  const settings = options?.settings ?? DEFAULT_TRUTH_ENGINE_SETTINGS;
  const integrityReport = computeIntegrityReport(records);
  const accepted = quarantineBrokenRows(records, integrityReport);
  const truthScores = buildTruthScores(accepted, integrityReport, { settings });
  const datasetFeatures = buildDatasetFeatures(accepted);

  return {
    integrityReport,
    truthScores,
    datasetFeatures,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Refresh backtest summary (can be expensive, good for scheduled jobs).
 */
export function runBacktestRefresh(
  records: DrawResultRecord[],
  options?: { settings?: TruthEngineSettings; topK?: number }
): TruthPipelineResult["backtestSummary"] {
  return runWalkForwardBacktest(records, {
    settings: options?.settings,
    topK: options?.topK,
  });
}

/**
 * Refresh drift report.
 */
export function runDriftRefresh(
  records: DrawResultRecord[]
): TruthPipelineResult["driftReport"] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );
  if (sorted.length < 40) {
    return { driftScore: 0, affectedAreas: [], severity: "none", message: "ข้อมูลไม่เพียงพอ" };
  }
  const split = Math.floor(sorted.length * 0.6);
  return detectDrift(sorted.slice(0, split), sorted.slice(split));
}

/**
 * Recompute truth snapshot (for Railway cron/scheduled job).
 */
export function recomputeTruthSnapshot(
  records: DrawResultRecord[],
  options?: { settings?: TruthEngineSettings }
): TruthPipelineResult {
  return runTruthPipeline(records, options);
}
