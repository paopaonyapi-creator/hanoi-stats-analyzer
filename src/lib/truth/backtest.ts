// ═══════════════════════════════════════════════
// Truth Engine — Walk-Forward Backtest Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type {
  WalkForwardFold,
  BacktestSummary,
  BacktestVerdictType,
  TruthEngineSettings,
  CalibrationBucket,
} from "./types";
import { DEFAULT_TRUTH_ENGINE_SETTINGS, BACKTEST_DEFAULTS } from "./constants";
import { computeIntegrityReport } from "./integrity";
import { buildTruthScores } from "./scoring";
import { estimateRandomTopKHitRate } from "./baseline";
import { computeCalibration } from "./calibration";

/**
 * Run a full walk-forward backtest with no future data leakage.
 */
export function runWalkForwardBacktest(
  records: DrawResultRecord[],
  options?: {
    trainMinSize?: number;
    testSize?: number;
    stepSize?: number;
    topK?: number;
    settings?: TruthEngineSettings;
    drawType?: string | null;
  }
): BacktestSummary {
  const trainMinSize = options?.trainMinSize ?? BACKTEST_DEFAULTS.trainMinSize;
  const testSize = options?.testSize ?? BACKTEST_DEFAULTS.testSize;
  const stepSize = options?.stepSize ?? BACKTEST_DEFAULTS.stepSize;
  const topK = options?.topK ?? BACKTEST_DEFAULTS.topK;
  const settings = options?.settings ?? DEFAULT_TRUTH_ENGINE_SETTINGS;

  // Sort chronologically
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  // Check minimum data
  if (sorted.length < trainMinSize + testSize) {
    return {
      folds: [],
      totalFolds: 0,
      averageHitRate: 0,
      averageBaseline: estimateRandomTopKHitRate(topK),
      averageDelta: 0,
      calibrationBuckets: [],
      verdict: "NO_RELIABLE_EDGE",
      insufficientData: true,
      message: `ข้อมูลไม่เพียงพอสำหรับ backtest (ต้องการอย่างน้อย ${trainMinSize + testSize} รายการ, มี ${sorted.length} รายการ)`,
    };
  }

  // Build folds
  const folds = buildBacktestFolds(sorted, trainMinSize, testSize, stepSize, topK, settings, options?.drawType);

  if (folds.length === 0) {
    return {
      folds: [],
      totalFolds: 0,
      averageHitRate: 0,
      averageBaseline: estimateRandomTopKHitRate(topK),
      averageDelta: 0,
      calibrationBuckets: [],
      verdict: "NO_RELIABLE_EDGE",
      insufficientData: true,
      message: "ไม่สามารถสร้าง fold สำหรับ backtest ได้",
    };
  }

  return summarizeBacktestResults(folds, topK);
}

/**
 * Build walk-forward backtest folds.
 * Each fold uses [0..trainEnd] as training, [trainEnd+1..trainEnd+testSize] as test.
 */
export function buildBacktestFolds(
  sorted: DrawResultRecord[],
  trainMinSize: number,
  testSize: number,
  stepSize: number,
  topK: number,
  settings: TruthEngineSettings,
  drawType?: string | null
): WalkForwardFold[] {
  const folds: WalkForwardFold[] = [];
  const maxFolds = 50; // cap folds to avoid excessive computation

  for (
    let trainEnd = trainMinSize - 1;
    trainEnd + testSize < sorted.length && folds.length < maxFolds;
    trainEnd += stepSize
  ) {
    const trainRecords = sorted.slice(0, trainEnd + 1);
    const testRecords = sorted.slice(trainEnd + 1, trainEnd + 1 + testSize);

    if (testRecords.length === 0) continue;

    const fold = evaluateFold(trainRecords, testRecords, topK, settings, folds.length, drawType);
    folds.push(fold);
  }

  return folds;
}

/**
 * Evaluate a single fold: train on trainRecords, test on testRecords.
 */
export function evaluateFold(
  trainRecords: DrawResultRecord[],
  testRecords: DrawResultRecord[],
  topK: number,
  settings: TruthEngineSettings,
  foldIndex: number,
  drawType?: string | null
): WalkForwardFold {
  // Build integrity from training data only
  const integrityReport = computeIntegrityReport(trainRecords);

  // Score using training data only — no future leakage
  const scores = buildTruthScores(trainRecords, integrityReport, { 
    settings,
    drawType
  });

  // Get engine's top-K predictions
  const engineTopK = new Set(scores.slice(0, topK).map((s) => s.number));

  // Evaluate against test outcomes
  const testOutcomes = testRecords.map((r) => r.last2);
  let hits = 0;
  for (const outcome of testOutcomes) {
    if (engineTopK.has(outcome)) hits++;
  }

  const hitRate = testOutcomes.length > 0 ? hits / testOutcomes.length : 0;
  const baselineExpected = estimateRandomTopKHitRate(topK);
  const delta = hitRate - baselineExpected;

  return {
    foldIndex,
    trainSize: trainRecords.length,
    testSize: testRecords.length,
    topK,
    hitRate,
    baselineExpected,
    delta,
  };
}

/**
 * Summarize backtest results into final verdict.
 */
export function summarizeBacktestResults(
  folds: WalkForwardFold[],
  topK: number
): BacktestSummary {
  if (folds.length === 0) {
    return {
      folds: [],
      totalFolds: 0,
      averageHitRate: 0,
      averageBaseline: estimateRandomTopKHitRate(topK),
      averageDelta: 0,
      calibrationBuckets: [],
      verdict: "NO_RELIABLE_EDGE",
      insufficientData: true,
      message: "ไม่มี fold สำหรับกคำนวณ",
    };
  }

  const averageHitRate =
    folds.reduce((s, f) => s + f.hitRate, 0) / folds.length;
  const averageBaseline =
    folds.reduce((s, f) => s + f.baselineExpected, 0) / folds.length;
  const averageDelta =
    folds.reduce((s, f) => s + f.delta, 0) / folds.length;

  // Simple calibration: group by hit rate
  const calibrationBuckets = buildSimpleCalibrationBuckets(folds);

  // Determine verdict
  const verdict = determineBacktestVerdict(averageDelta, folds);

  const message = buildBacktestMessage(verdict, averageDelta, folds.length);

  return {
    folds,
    totalFolds: folds.length,
    averageHitRate,
    averageBaseline,
    averageDelta,
    calibrationBuckets,
    verdict,
    insufficientData: folds.length < 10,
    message,
  };
}

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

function determineBacktestVerdict(
  averageDelta: number,
  folds: WalkForwardFold[]
): BacktestVerdictType {
  // Count folds where engine beat baseline
  const positiveFolds = folds.filter((f) => f.delta > 0).length;
  const positiveRatio = positiveFolds / folds.length;

  if (averageDelta >= 0.05 && positiveRatio >= 0.6) return "STRONG";
  if (averageDelta >= 0.02 && positiveRatio >= 0.5) return "MODERATE";
  if (averageDelta >= 0 && positiveRatio >= 0.4) return "WEAK";
  return "NO_RELIABLE_EDGE";
}

function buildSimpleCalibrationBuckets(folds: WalkForwardFold[]): CalibrationBucket[] {
  // Split folds into buckets by training size
  const buckets = new Map<string, { rates: number[]; baselines: number[] }>();

  for (const fold of folds) {
    let bucket: string;
    if (fold.trainSize < 80) bucket = "60-79";
    else if (fold.trainSize < 100) bucket = "80-99";
    else bucket = "100+";

    if (!buckets.has(bucket)) buckets.set(bucket, { rates: [], baselines: [] });
    buckets.get(bucket)!.rates.push(fold.hitRate);
    buckets.get(bucket)!.baselines.push(fold.baselineExpected);
  }

  return Array.from(buckets.entries()).map(([bucket, data]) => ({
    bucket,
    avgScore: data.rates.reduce((s, r) => s + r, 0) / data.rates.length,
    observedRate: data.rates.reduce((s, r) => s + r, 0) / data.rates.length,
    count: data.rates.length,
  }));
}

function buildBacktestMessage(
  verdict: BacktestVerdictType,
  delta: number,
  foldCount: number
): string {
  const messages: Record<BacktestVerdictType, string> = {
    STRONG: `Backtest ชี้ว่า engine ทำได้ดีกว่า random baseline อย่างสม่ำเสมอ (delta ${(delta * 100).toFixed(2)}%, ${foldCount} folds)`,
    MODERATE: `Backtest ชี้ว่า engine ทำได้ดีกว่าเล็กน้อย (delta ${(delta * 100).toFixed(2)}%, ${foldCount} folds) แต่ยังต้องติดตามต่อ`,
    WEAK: `Backtest ชี้ว่า engine ทำได้ใกล้เคียง baseline (delta ${(delta * 100).toFixed(2)}%, ${foldCount} folds) สัญญาณยังไม่ชัดเจน`,
    NO_RELIABLE_EDGE: `Backtest ไม่พบ edge ที่น่าเชื่อถือเหนือ random baseline (delta ${(delta * 100).toFixed(2)}%, ${foldCount} folds)`,
  };
  return messages[verdict];
}
