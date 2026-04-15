// ═══════════════════════════════════════════════
// Truth Engine — Truth Scoring Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type {
  TruthScoreResult,
  TruthLabel,
  SignalMap,
  IntegrityReport,
  TruthEngineSettings,
  DatasetFeatures,
  BaselineComparisonResult,
} from "./types";
import { DEFAULT_TRUTH_ENGINE_SETTINGS, ALL_NUMBERS_00_99, SIGNAL_NAMES } from "./constants";
import { buildFeatureMatrix, buildDatasetFeatures } from "./features";
import { buildSignalsForNumber } from "./signals";
import { buildPlainLanguageExplanation } from "./explain";

/**
 * Build truth scores for all 00-99 numbers.
 */
export function buildTruthScores(
  records: DrawResultRecord[],
  integrityReport: IntegrityReport,
  options?: {
    settings?: TruthEngineSettings;
    baselineDelta?: number;
    backtestHint?: number;
    drawType?: string | null;
  }
): TruthScoreResult[] {
  const settings = options?.settings ?? DEFAULT_TRUTH_ENGINE_SETTINGS;
  const baselineDelta = options?.baselineDelta ?? 0;
  const backtestHint = options?.backtestHint ?? 0;

  if (records.length === 0) {
    return ALL_NUMBERS_00_99.map((num) => ({
      number: num,
      trendScore: 0,
      confidenceScore: 0,
      evidenceStrength: 0,
      integrityScore: 0,
      label: "NO RELIABLE EDGE" as TruthLabel,
      topSignals: [],
      penalties: [],
      explanation: "ไม่มีข้อมูลในระบบ",
    }));
  }

  const featureMatrix = buildFeatureMatrix(records);
  const datasetFeatures = buildDatasetFeatures(records);

  const results: TruthScoreResult[] = featureMatrix.map((features) => {
    const signalMap = buildSignalsForNumber(features, {
      datasetFeatures,
      integrityReport,
    });

    const trendScore = calculateTrendScore(signalMap, settings);
    const confidenceScore = calculateConfidenceScore(
      signalMap,
      integrityReport,
      backtestHint,
      settings
    );
    const evidenceStrength = calculateEvidenceStrength(signalMap);
    const label = labelTruthScore(
      { trendScore, confidenceScore, evidenceStrength },
      integrityReport,
      baselineDelta,
      settings
    );

    const topSignals = summarizeTopSignals(signalMap);
    const penalties = summarizePenalties(signalMap);
    const explanation = buildPlainLanguageExplanation({
      number: features.number,
      trendScore,
      confidenceScore,
      evidenceStrength,
      label,
      positiveFactors: topSignals,
      negativeFactors: penalties,
      limitations: [],
      dataQualityNote: `Integrity: ${integrityReport.score}/100 (${integrityReport.level})`,
      warnings: [],
    });

    return {
      number: features.number,
      trendScore: clamp(trendScore, 0, 100),
      confidenceScore: clamp(confidenceScore, 0, 100),
      evidenceStrength: clamp(evidenceStrength, 0, 100),
      integrityScore: integrityReport.score,
      label,
      topSignals,
      penalties,
      explanation,
    };
  });

  // Sort by trendScore descending
  results.sort((a, b) => b.trendScore - a.trendScore);
  return results;
}

/**
 * Calculate weighted trend score from signals.
 */
export function calculateTrendScore(
  signalMap: SignalMap,
  settings: TruthEngineSettings
): number {
  const w = settings.weights;
  const p = settings.penalties;

  let score = 0;
  let totalWeight = 0;

  // Positive signals
  const positiveSignals: [string, number][] = [
    [SIGNAL_NAMES.HOTNESS, w.frequencyAllTime],
    [SIGNAL_NAMES.RECENCY, w.frequencyRecent],
    [SIGNAL_NAMES.GAP_RETURN, w.gapReturn],
    [SIGNAL_NAMES.TRANSITION, w.transition],
    [SIGNAL_NAMES.WEEKDAY, w.weekdayAlignment],
    [SIGNAL_NAMES.WINDOW_CONSISTENCY, w.windowConsistency],
    [SIGNAL_NAMES.DIGIT_BALANCE, w.digitBalance],
  ];

  for (const [name, weight] of positiveSignals) {
    const signal = signalMap[name];
    if (signal?.applicable && signal.normalized !== null) {
      score += signal.normalized * weight;
      totalWeight += weight;
    }
  }

  // Normalize to 0-100
  let normalized = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

  // Apply penalties
  const anomaly = signalMap[SIGNAL_NAMES.ANOMALY_PENALTY];
  if (anomaly?.applicable && anomaly.normalized !== null) {
    normalized -= anomaly.normalized * p.anomalyPenalty * 10;
  }

  const insuffData = signalMap[SIGNAL_NAMES.INSUFFICIENT_DATA_PENALTY];
  if (insuffData?.applicable && insuffData.normalized !== null) {
    normalized -= insuffData.normalized * p.insufficientDataPenalty * 5;
  }

  return clamp(normalized, 0, 100);
}

/**
 * Calculate confidence score based on data quality, agreement, and consistency.
 */
export function calculateConfidenceScore(
  signalMap: SignalMap,
  integrityReport: IntegrityReport,
  backtestHint: number,
  settings: TruthEngineSettings
): number {
  const cw = settings.confidenceWeights;

  // Sample size quality
  const insuffSignal = signalMap[SIGNAL_NAMES.INSUFFICIENT_DATA_PENALTY];
  const sampleQuality = insuffSignal?.raw !== null ? (1 - (insuffSignal?.raw ?? 0)) : 0;

  // Feature agreement: how many signals are applicable and agree
  const applicableSignals = Object.values(signalMap).filter(
    (s) => s.applicable && s.normalized !== null
  );
  const agreementRatio = applicableSignals.length / Math.max(Object.keys(signalMap).length, 1);

  // Window stability
  const windowSignal = signalMap[SIGNAL_NAMES.WINDOW_CONSISTENCY];
  const windowStability = windowSignal?.normalized ?? 0;

  // Backtest hint
  const backtestConsistency = clamp01(backtestHint);

  // Integrity effect
  const integrityEffect = integrityReport.score / 100;

  let confidence =
    sampleQuality * cw.sampleSizeQuality +
    agreementRatio * cw.featureAgreement +
    windowStability * cw.windowStability +
    backtestConsistency * cw.outOfSampleConsistency +
    integrityEffect * cw.integrity;

  const totalWeight =
    cw.sampleSizeQuality +
    cw.featureAgreement +
    cw.windowStability +
    cw.outOfSampleConsistency +
    cw.integrity;

  return clamp((confidence / totalWeight) * 100, 0, 100);
}

/**
 * Calculate evidence strength — how many valid, agreeing signals support this number.
 */
export function calculateEvidenceStrength(signalMap: SignalMap): number {
  const applicablePositive = Object.values(signalMap).filter(
    (s) => s.applicable && s.normalized !== null && s.normalized > 0.3 && !s.name.includes("Penalty")
  );

  const totalPositiveSignals = 7; // number of positive signal types
  const strength = (applicablePositive.length / totalPositiveSignals) * 100;
  return clamp(strength, 0, 100);
}

/**
 * Assign a truth label based on all inputs.
 */
export function labelTruthScore(
  scores: { trendScore: number; confidenceScore: number; evidenceStrength: number },
  integrityReport: IntegrityReport,
  baselineDelta: number,
  settings: TruthEngineSettings
): TruthLabel {
  // Check integrity first
  if (integrityReport.score < settings.minIntegrityScore) {
    return "DATA NOT TRUSTWORTHY";
  }

  // Check baseline
  if (baselineDelta < settings.noReliableEdgeIfBaselineDeltaBelow) {
    return "NO RELIABLE EDGE";
  }

  // Score-based labels
  if (
    scores.trendScore >= settings.strongSignalThreshold &&
    scores.confidenceScore >= settings.confidenceMediumThreshold
  ) {
    return "STRONG SIGNAL";
  }

  if (scores.confidenceScore < settings.confidenceLowThreshold) {
    return "LOW CONFIDENCE";
  }

  return "WEAK SIGNAL";
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function summarizeTopSignals(signalMap: SignalMap): string[] {
  return Object.values(signalMap)
    .filter((s) => s.applicable && s.normalized !== null && s.normalized > 0.4 && !s.name.includes("Penalty"))
    .sort((a, b) => (b.normalized ?? 0) - (a.normalized ?? 0))
    .slice(0, 3)
    .map((s) => s.explanation);
}

function summarizePenalties(signalMap: SignalMap): string[] {
  return Object.values(signalMap)
    .filter((s) => s.applicable && s.name.includes("Penalty") && (s.normalized ?? 0) > 0)
    .map((s) => s.explanation);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}
