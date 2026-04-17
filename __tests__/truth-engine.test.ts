// ═══════════════════════════════════════════════
// Truth Engine Tests
// ═══════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { computeIntegrityReport, scoreIntegrityIssues, getIntegrityLevel, detectDuplicateRecords, detectSuspiciousRepeats } from "../src/lib/truth/integrity";
import { buildFeatureMatrix, buildDatasetFeatures } from "../src/lib/truth/features";
import { computeHotnessSignal, buildSignalsForNumber } from "../src/lib/truth/signals";
import { labelTruthScore, buildTruthScores } from "../src/lib/truth/scoring";
import { runWalkForwardBacktest, buildBacktestFolds } from "../src/lib/truth/backtest";
import { detectDrift, compareDistributionShift } from "../src/lib/truth/drift";
import { buildRealityVerdict, shouldShowNoReliableSignalBanner } from "../src/lib/truth/verdict";
import { DEFAULT_TRUTH_ENGINE_SETTINGS, SIGNAL_NAMES } from "../src/lib/truth/constants";
import type { DrawResultRecord } from "../src/types";

// ─────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────

function makeRecord(overrides: Partial<DrawResultRecord> = {}, index: number = 0): DrawResultRecord {
  const date = new Date(2024, 0, 1 + index);
  const digits = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return {
    id: `test-${index}`,
    drawDate: date.toISOString(),
    drawType: "NORMAL",
    drawTime: "18:15",
    resultRaw: digits,
    resultDigits: digits,
    last1: digits.slice(-1),
    last2: digits.slice(-2),
    last3: digits.slice(-3),
    weekday: date.getDay(),
    monthKey: `2024-01`,
    source: "test",
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    ...overrides,
  };
}

function makeRecords(count: number, overrides?: Partial<DrawResultRecord>): DrawResultRecord[] {
  return Array.from({ length: count }, (_, i) => makeRecord(overrides, i));
}

function makeDeterministicRecords(count: number): DrawResultRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(2024, 0, 1 + i);
    const num = String(i % 100).padStart(2, "0");
    const digits = `123${num}`;
    return {
      id: `det-${i}`,
      drawDate: date.toISOString(),
      drawType: "NORMAL",
      drawTime: "18:15",
      resultRaw: digits,
      resultDigits: digits,
      last1: digits.slice(-1),
      last2: num,
      last3: digits.slice(-3),
      weekday: date.getDay(),
      monthKey: `2024-${String(Math.floor(i / 30) + 1).padStart(2, "0")}`,
      source: "test",
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };
  });
}

// ═══════════════════════════════════════════════
// 1. INTEGRITY ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Data Integrity Engine", () => {
  it("should return BROKEN for empty records", () => {
    const report = computeIntegrityReport([]);
    expect(report.level).toBe("BROKEN");
    expect(report.score).toBe(0);
    expect(report.acceptedRows).toBe(0);
  });

  it("should return HIGH integrity for clean data", () => {
    const records = makeRecords(50);
    const report = computeIntegrityReport(records);
    expect(report.level).toBe("HIGH");
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.acceptedRows).toBeGreaterThan(0);
  });

  it("should detect duplicate composite records", () => {
    const records = makeRecords(10);
    // Add a duplicate
    const dup = { ...records[0], id: "dup-1" };
    records.push(dup);
    const issues = detectDuplicateRecords(records);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].code).toBe("DUPLICATE_COMPOSITE");
  });

  it("should grade integrity level correctly", () => {
    expect(getIntegrityLevel(90)).toBe("HIGH");
    expect(getIntegrityLevel(75)).toBe("MEDIUM");
    expect(getIntegrityLevel(55)).toBe("LOW");
    expect(getIntegrityLevel(30)).toBe("BROKEN");
  });

  it("should score issues correctly", () => {
    const issues = [
      { code: "MISSING_DATE", severity: "error" as const, message: "test" },
      { code: "MALFORMED_TIME", severity: "info" as const, message: "test" },
    ];
    const score = scoreIntegrityIssues(issues, 100);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(80);
  });

  it("should detect suspicious repeats", () => {
    const records = makeRecords(10);
    // Force same last2 for 5 consecutive records
    for (let i = 0; i < 5; i++) records[i].last2 = "77";
    const issues = detectSuspiciousRepeats(records);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  it("should quarantine error-level issues", () => {
    const records = [
      makeRecord({ id: "bad-1", resultDigits: "1" }, 0), // too short
      makeRecord({ id: "good-1" }, 1),
    ];
    const report = computeIntegrityReport(records);
    expect(report.quarantinedRowIds).toContain("bad-1");
    expect(report.rejectedRows).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════
// 2. FEATURE ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Feature Engine", () => {
  it("should produce 100 number features for 00-99", () => {
    const records = makeDeterministicRecords(100);
    const features = buildFeatureMatrix(records);
    expect(features.length).toBe(100);
    expect(features[0].number).toBe("00");
    expect(features[99].number).toBe("99");
  });

  it("should compute non-zero frequency for numbers that appear", () => {
    const records = makeDeterministicRecords(200);
    const features = buildFeatureMatrix(records);
    // Each number appears at least once or twice in 200 records
    const someFeature = features.find((f) => f.frequencyAllTime > 0);
    expect(someFeature).toBeDefined();
  });

  it("should compute dataset features correctly", () => {
    const records = makeDeterministicRecords(100);
    const ds = buildDatasetFeatures(records);
    expect(ds.totalRecords).toBe(100);
    expect(ds.hasMinimumForAnalysis).toBe(true);
    expect(ds.uniqueNumbers).toBeGreaterThan(0);
    expect(ds.dateSpanDays).toBeGreaterThanOrEqual(1);
  });

  it("should handle empty records gracefully", () => {
    const ds = buildDatasetFeatures([]);
    expect(ds.totalRecords).toBe(0);
    expect(ds.hasMinimumForAnalysis).toBe(false);
    expect(ds.hasMinimumForBacktest).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// 3. SIGNAL ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Signal Engine", () => {
  it("should compute hotness signal for number with data", () => {
    const features = {
      number: "23",
      frequencyAllTime: 0.02, // 2% (above 1% expected)
      frequencyRecent10: 0.1,
      frequencyRecent20: 0.05,
      frequencyRecent50: 0.03,
      recencyGap: 5,
      meanGap: 10,
      medianGap: 8,
      recurrenceRate: 0.02,
      recencyDecayScore: 0.6,
      windowStabilityScore: 0.8,
      varianceOfOccurrence: 5,
      weekdayAlignmentScore: 0.3,
      digitBalanceScore: 0.9,
      transitionSupportScore: 0.05,
      entropyScore: 2.1,
      varianceScore: 15,
      marketCorrelationScore: 0.2,
    };

    const ds = { totalRecords: 100, uniqueNumbers: 80, dateSpanDays: 100, avgRecordsPerDay: 1, hasMinimumForAnalysis: true, hasMinimumForBacktest: true };

    const signal = computeHotnessSignal(features, ds);
    expect(signal.applicable).toBe(true);
    expect(signal.raw).toBe(0.02);
    expect(signal.normalized).toBeGreaterThan(0);
    expect(signal.confidence).toBeGreaterThan(0);
  });

  it("should mark signal as not applicable for small dataset", () => {
    const features = {
      number: "23", frequencyAllTime: 0, frequencyRecent10: 0, frequencyRecent20: 0, frequencyRecent50: 0,
      recencyGap: null, meanGap: null, medianGap: null, recurrenceRate: 0, recencyDecayScore: 0,
      windowStabilityScore: 0, weekdayAlignmentScore: 0,
      digitBalanceScore: 0.5, transitionSupportScore: 0,
      entropyScore: 0, varianceScore: 0, marketCorrelationScore: 0,
    };
    const ds = { totalRecords: 5, uniqueNumbers: 5, dateSpanDays: 5, avgRecordsPerDay: 1, hasMinimumForAnalysis: false, hasMinimumForBacktest: false };

    const signal = computeHotnessSignal(features, ds);
    expect(signal.applicable).toBe(false);
    expect(signal.raw).toBeNull();
  });

  it("should build all 9 signals for a number", () => {
    const records = makeDeterministicRecords(100);
    const features = buildFeatureMatrix(records)[0];
    const ds = buildDatasetFeatures(records);
    const signals = buildSignalsForNumber(features, { datasetFeatures: ds });

    expect(Object.keys(signals).length).toBe(Object.keys(SIGNAL_NAMES).length);
    expect(signals.hotness).toBeDefined();
    expect(signals.recency).toBeDefined();
    expect(signals.anomalyPenalty).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
// 4. SCORING ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Truth Scoring Engine", () => {
  it("should produce scores for all 100 numbers", () => {
    const records = makeDeterministicRecords(150);
    const integrityReport = computeIntegrityReport(records);
    const scores = buildTruthScores(records, integrityReport);
    expect(scores.length).toBe(100);
  });

  it("should clamp scores to 0-100", () => {
    const records = makeDeterministicRecords(150);
    const integrityReport = computeIntegrityReport(records);
    const scores = buildTruthScores(records, integrityReport);
    for (const s of scores) {
      expect(s.trendScore).toBeGreaterThanOrEqual(0);
      expect(s.trendScore).toBeLessThanOrEqual(100);
      expect(s.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(s.confidenceScore).toBeLessThanOrEqual(100);
    }
  });

  it("should assign label 'NO RELIABLE EDGE' when baseline delta is too low", () => {
    const label = labelTruthScore(
      { trendScore: 80, confidenceScore: 80, evidenceStrength: 70 },
      { score: 90, level: "HIGH", issues: [], quarantinedRowIds: [], acceptedRows: 100, rejectedRows: 0 },
      0.001, // below threshold
      DEFAULT_TRUTH_ENGINE_SETTINGS
    );
    expect(label).toBe("NO RELIABLE EDGE");
  });

  it("should assign 'DATA NOT TRUSTWORTHY' for low integrity", () => {
    const label = labelTruthScore(
      { trendScore: 90, confidenceScore: 80, evidenceStrength: 70 },
      { score: 30, level: "BROKEN", issues: [], quarantinedRowIds: [], acceptedRows: 50, rejectedRows: 50 },
      0.1,
      DEFAULT_TRUTH_ENGINE_SETTINGS
    );
    expect(label).toBe("DATA NOT TRUSTWORTHY");
  });

  it("should assign 'STRONG SIGNAL' for high trend + high confidence + good baseline", () => {
    const label = labelTruthScore(
      { trendScore: 85, confidenceScore: 75, evidenceStrength: 80 },
      { score: 95, level: "HIGH", issues: [], quarantinedRowIds: [], acceptedRows: 200, rejectedRows: 0 },
      0.1,
      DEFAULT_TRUTH_ENGINE_SETTINGS
    );
    expect(label).toBe("STRONG SIGNAL");
  });

  it("should be deterministic", () => {
    const records = makeDeterministicRecords(100);
    const ir = computeIntegrityReport(records);
    const scores1 = buildTruthScores(records, ir);
    const scores2 = buildTruthScores(records, ir);
    expect(scores1.map((s) => s.trendScore)).toEqual(scores2.map((s) => s.trendScore));
  });
});

// ═══════════════════════════════════════════════
// 5. BACKTEST ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Walk-Forward Backtest", () => {
  it("should return insufficient data for small datasets", () => {
    const records = makeDeterministicRecords(30);
    const result = runWalkForwardBacktest(records);
    expect(result.insufficientData).toBe(true);
    expect(result.totalFolds).toBe(0);
  });

  it("should produce folds for sufficient data", () => {
    const records = makeDeterministicRecords(150);
    const result = runWalkForwardBacktest(records, { trainMinSize: 60, testSize: 1 });
    expect(result.totalFolds).toBeGreaterThan(0);
    expect(result.folds.length).toBeGreaterThan(0);
  });

  it("should not use future data in folds", () => {
    const records = makeDeterministicRecords(100);
    const sorted = [...records].sort(
      (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
    );
    const folds = buildBacktestFolds(sorted, 60, 1, 1, 10, DEFAULT_TRUTH_ENGINE_SETTINGS);

    for (const fold of folds) {
      // Train size should be less than total
      expect(fold.trainSize).toBeLessThan(sorted.length);
      // Test size should always be 1
      expect(fold.testSize).toBe(1);
    }
  });

  it("should compute average delta", () => {
    const records = makeDeterministicRecords(150);
    const result = runWalkForwardBacktest(records);
    expect(typeof result.averageDelta).toBe("number");
    expect(typeof result.averageHitRate).toBe("number");
    expect(typeof result.averageBaseline).toBe("number");
  });

  it("should assign a valid verdict", () => {
    const records = makeDeterministicRecords(150);
    const result = runWalkForwardBacktest(records);
    expect(["STRONG", "MODERATE", "WEAK", "NO_RELIABLE_EDGE"]).toContain(result.verdict);
  });
});

// ═══════════════════════════════════════════════
// 6. DRIFT ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Drift Detection", () => {
  it("should return 'none' for insufficient data", () => {
    const ref = makeDeterministicRecords(5);
    const recent = makeDeterministicRecords(5);
    const report = detectDrift(ref, recent);
    expect(report.severity).toBe("none");
  });

  it("should detect drift in modified distributions", () => {
    const ref = makeDeterministicRecords(50);
    // Create recent records with completely different last2 pattern
    const recent = makeDeterministicRecords(30).map((r, i) => ({
      ...r,
      id: `recent-${i}`,
      last2: String((i % 10) + 50).padStart(2, "0"), // all in 50-59 range
    }));
    const report = detectDrift(ref, recent);
    expect(report.driftScore).toBeGreaterThan(0);
    expect(report.affectedAreas.length).toBeGreaterThan(0);
  });

  it("should compare distribution shifts correctly", () => {
    const uniform = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
    const skewed = [0.5, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.02, 0.01, 0.01];
    const shift = compareDistributionShift(uniform, skewed);
    expect(shift).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════
// 7. VERDICT ENGINE TESTS
// ═══════════════════════════════════════════════

describe("Reality Verdict", () => {
  it("should return NO_RELIABLE_EDGE for low integrity", () => {
    const result = buildRealityVerdict({
      integrityReport: { score: 30, level: "BROKEN", issues: [], quarantinedRowIds: [], acceptedRows: 30, rejectedRows: 70 },
      backtestSummary: { folds: [], totalFolds: 0, averageHitRate: 0, averageBaseline: 0.1, averageDelta: 0, calibrationBuckets: [], verdict: "NO_RELIABLE_EDGE", insufficientData: true, message: "" },
      baselineResult: { method: "test", topK: 10, engineHitRate: 0, randomExpectedHitRate: 0.1, delta: 0, interpretation: "below_baseline" },
      driftReport: { driftScore: 0, volatilityIndex: 0, affectedAreas: [], severity: "none", message: "" },
    });
    expect(result.verdict).toBe("NO_RELIABLE_EDGE");
    expect(result.integrityOk).toBe(false);
  });

  it("should return STRONG for supported backtest without drift", () => {
    const result = buildRealityVerdict({
      integrityReport: { score: 95, level: "HIGH", issues: [], quarantinedRowIds: [], acceptedRows: 200, rejectedRows: 0 },
      backtestSummary: { folds: [], totalFolds: 50, averageHitRate: 0.15, averageBaseline: 0.1, averageDelta: 0.05, calibrationBuckets: [], verdict: "STRONG", insufficientData: false, message: "" },
      baselineResult: { method: "test", topK: 10, engineHitRate: 0.15, randomExpectedHitRate: 0.1, delta: 0.05, interpretation: "clearly_above_baseline" },
      driftReport: { driftScore: 0.05, volatilityIndex: 0.1, affectedAreas: [], severity: "none", message: "" },
    });
    expect(result.verdict).toBe("STRONG");
    expect(result.backtestSupported).toBe(true);
    expect(result.showNoReliableSignalBanner).toBe(false);
  });

  it("should degrade STRONG to MODERATE when drift is active", () => {
    const result = buildRealityVerdict({
      integrityReport: { score: 95, level: "HIGH", issues: [], quarantinedRowIds: [], acceptedRows: 200, rejectedRows: 0 },
      backtestSummary: { folds: [], totalFolds: 50, averageHitRate: 0.15, averageBaseline: 0.1, averageDelta: 0.05, calibrationBuckets: [], verdict: "STRONG", insufficientData: false, message: "" },
      baselineResult: { method: "test", topK: 10, engineHitRate: 0.15, randomExpectedHitRate: 0.1, delta: 0.05, interpretation: "clearly_above_baseline" },
      driftReport: { driftScore: 0.4, volatilityIndex: 0.5, affectedAreas: [{ area: "digit_distribution", shift: 0.35, significance: "high" }], severity: "high", message: "drift" },
    });
    expect(result.verdict).toBe("MODERATE"); // degraded from STRONG
    expect(result.driftActive).toBe(true);
  });

  it("should show no reliable signal banner correctly", () => {
    expect(shouldShowNoReliableSignalBanner({ verdict: "NO_RELIABLE_EDGE", integrityOk: true, baselineBeaten: false })).toBe(true);
    expect(shouldShowNoReliableSignalBanner({ verdict: "STRONG", integrityOk: true, baselineBeaten: true })).toBe(false);
  });
});
