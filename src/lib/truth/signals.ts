// ═══════════════════════════════════════════════
// Truth Engine — Signal Engine
// ═══════════════════════════════════════════════

import type { NumberFeatures, DatasetFeatures, SignalValue, SignalMap, IntegrityReport } from "./types";
import { SIGNAL_NAMES } from "./constants";

/**
 * Build all signals for a single number.
 */
export function buildSignalsForNumber(
  features: NumberFeatures,
  context: {
    datasetFeatures: DatasetFeatures;
    integrityReport?: IntegrityReport;
    momentum?: Record<string, { compositeScore: number; explanation?: string }>;
  }
): SignalMap {
  const { datasetFeatures, integrityReport, momentum } = context;
  const signals: SignalMap = {};

  signals[SIGNAL_NAMES.HOTNESS] = computeHotnessSignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.RECENCY] = computeRecencySignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.GAP_RETURN] = computeGapSignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.TRANSITION] = computeTransitionSignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.WEEKDAY] = computeWeekdaySignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.WINDOW_CONSISTENCY] = computeWindowConsistencySignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.DIGIT_BALANCE] = computeDigitBalanceSignal(features);
  signals[SIGNAL_NAMES.VARIANCE_STABILITY] = computeVarianceStabilitySignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.PATTERN_STRENGTH] = computePatternStrengthSignal(features, datasetFeatures);
  signals[SIGNAL_NAMES.BAYESIAN_BIAS] = computeBayesianBiasSignal(features);
  signals[SIGNAL_NAMES.MARKET_CORRELATION] = computeMarketCorrelationSignal(features);
  signals[SIGNAL_NAMES.MOMENTUM_ACCELERATION] = computeMomentumSignal(features.number, momentum);
  signals[SIGNAL_NAMES.ANOMALY_PENALTY] = computeAnomalyPenaltySignal(features, integrityReport);
  signals[SIGNAL_NAMES.INSUFFICIENT_DATA_PENALTY] = computeInsufficientDataPenaltySignal(datasetFeatures);

  return signals;
}

export function computeHotnessSignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (!ds.hasMinimumForAnalysis) {
    return notApplicable("hotness", "ข้อมูลไม่เพียงพอสำหรับวิเคราะห์ความถี่");
  }
  const expected = 1 / 100; // uniform random for 00-99
  const ratio = f.frequencyAllTime / expected;
  const normalized = clamp01((ratio - 0.5) / 2); // 0.5x..2.5x => 0..1

  return {
    name: "hotness",
    raw: f.frequencyAllTime,
    normalized,
    confidence: Math.min(1, ds.totalRecords / 100),
    explanation: `ความถี่รวม ${(f.frequencyAllTime * 100).toFixed(2)}% (คาดหวัง ${(expected * 100).toFixed(2)}%, ratio ${ratio.toFixed(2)}×)`,
    applicable: true,
  };
}

export function computeRecencySignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 10) {
    return notApplicable("recency", "ข้อมูลไม่ถึง 10 รายการ");
  }
  const recentAvg = (f.frequencyRecent10 + f.frequencyRecent20) / 2;
  const normalized = clamp01(f.recencyDecayScore);

  return {
    name: "recency",
    raw: recentAvg,
    normalized,
    confidence: Math.min(1, ds.totalRecords / 50),
    explanation: `คะแนนความใหม่ ${(f.recencyDecayScore * 100).toFixed(1)}% | ช่วง 10 ล่าสุด: ${(f.frequencyRecent10 * 100).toFixed(1)}%`,
    applicable: true,
  };
}

export function computeGapSignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (f.recencyGap === null || !ds.hasMinimumForAnalysis) {
    return notApplicable("gapReturn", "ไม่มีข้อมูล gap เพียงพอ");
  }
  // Higher gap = higher chance of return (gambler's observation, not fallacy — just statistical measurement)
  const meanGap = f.meanGap ?? ds.totalRecords;
  const gapRatio = f.recencyGap / Math.max(meanGap, 1);
  const normalized = clamp01(gapRatio / 3); // 0..3x mean => 0..1

  return {
    name: "gapReturn",
    raw: f.recencyGap,
    normalized,
    confidence: f.meanGap !== null ? Math.min(1, (f.meanGap > 0 ? 0.8 : 0.3)) : 0.3,
    explanation: `ห่างจากครั้งสุดท้าย ${f.recencyGap} งวด (เฉลี่ย ${(f.meanGap ?? 0).toFixed(1)} งวด, ratio ${gapRatio.toFixed(2)}×)`,
    applicable: true,
  };
}

export function computeTransitionSignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 20) {
    return notApplicable("transition", "ข้อมูลไม่เพียงพอสำหรับ transition analysis");
  }
  const normalized = clamp01(f.transitionSupportScore * 10); // small values, scale up

  return {
    name: "transition",
    raw: f.transitionSupportScore,
    normalized,
    confidence: Math.min(1, ds.totalRecords / 80),
    explanation: `คะแนน transition จากเลขก่อนหน้า: ${(f.transitionSupportScore * 100).toFixed(2)}%`,
    applicable: true,
  };
}

export function computeWeekdaySignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 30) {
    return notApplicable("weekday", "ข้อมูลไม่เพียงพอสำหรับวิเคราะห์วัน");
  }
  const normalized = clamp01(f.weekdayAlignmentScore * 5);

  return {
    name: "weekday",
    raw: f.weekdayAlignmentScore,
    normalized,
    confidence: Math.min(1, ds.totalRecords / 100),
    explanation: `ความสอดคล้องวันในสัปดาห์: ${(f.weekdayAlignmentScore * 100).toFixed(1)}%`,
    applicable: true,
  };
}

export function computeWindowConsistencySignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 20) {
    return notApplicable("windowConsistency", "ข้อมูลไม่เพียงพอสำหรับเปรียบเทียบหน้าต่าง");
  }
  const normalized = clamp01(f.windowStabilityScore);

  return {
    name: "windowConsistency",
    raw: f.windowStabilityScore,
    normalized,
    confidence: Math.min(1, ds.totalRecords / 60),
    explanation: `ความคงที่ข้ามหน้าต่าง: ${(f.windowStabilityScore * 100).toFixed(1)}%`,
    applicable: true,
  };
}

export function computeDigitBalanceSignal(f: NumberFeatures): SignalValue {
  return {
    name: "digitBalance",
    raw: f.digitBalanceScore,
    normalized: clamp01(f.digitBalanceScore),
    confidence: 1, // always available
    explanation: `ความสมดุลหลักสิบ/หน่วย: ${(f.digitBalanceScore * 100).toFixed(1)}%`,
    applicable: true,
  };
}

export function computeAnomalyPenaltySignal(
  f: NumberFeatures,
  integrityReport?: IntegrityReport
): SignalValue {
  if (!integrityReport) {
    return {
      name: "anomalyPenalty",
      raw: 0,
      normalized: 0,
      confidence: 1,
      explanation: "ไม่มีรายงาน integrity",
      applicable: false,
    };
  }
  // Penalty based on integrity score
  const penalty = integrityReport.level === "BROKEN" ? 1 : integrityReport.level === "LOW" ? 0.5 : 0;

  return {
    name: "anomalyPenalty",
    raw: penalty,
    normalized: penalty,
    confidence: 1,
    explanation: penalty > 0
      ? `โทษจากคุณภาพข้อมูล (integrity: ${integrityReport.score})`
      : `ข้อมูลผ่านการตรวจสอบ (integrity: ${integrityReport.score})`,
    applicable: penalty > 0,
  };
}

  };
}

export function computeVarianceStabilitySignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 50) {
    return notApplicable("varianceStability", "ต้องการข้อมูล 50 งวดเพื่อวิเคราะห์เสถียรภาพ");
  }
  // High variance = low stability. Score is inverted and normalized.
  const normalized = clamp01(1 - (f.varianceScore / 100));

  return {
    name: "varianceStability",
    raw: f.varianceScore,
    normalized,
    confidence: 0.8,
    explanation: `ความนิ่งของรอบการออก: ${(normalized * 100).toFixed(1)}% (Variance: ${f.varianceScore.toFixed(0)})`,
    applicable: true,
  };
}

export function computePatternStrengthSignal(f: NumberFeatures, ds: DatasetFeatures): SignalValue {
  if (ds.totalRecords < 30) {
    return notApplicable("patternStrength", "ข้อมูลไม่พอสำหรับ Pattern Strength");
  }
  // Combined signal: Entropy (low is good) + Transition
  const entropyFactor = clamp01(1 - (f.entropyScore / 5));
  const normalized = clamp01((entropyFactor + f.transitionSupportScore) / 2);

  return {
    name: "patternStrength",
    raw: normalized,
    normalized,
    confidence: 0.7,
    explanation: `ความซับซ้อนของก้อนตัวเลข: ${(normalized * 100).toFixed(1)}%`,
    applicable: true,
  };
}

  return {
    name: "bayesianBias",
    raw: f.recurrenceRate,
    normalized,
    confidence: 0.5,
    explanation: `คะแนนปรับจูน Bayesian: ${(normalized * 100).toFixed(1)}%`,
    applicable: true,
  };
}

  return {
    name: "marketCorrelation",
    raw: f.marketCorrelationScore,
    normalized,
    confidence: 0.6,
    explanation: `ความสอดคล้องข้ามตลาด: ${(normalized * 100).toFixed(1)}%`,
    applicable: f.marketCorrelationScore > 0,
  };
}

export function computeMomentumSignal(
    num: string, 
    momentum?: Record<string, { compositeScore: number }>
): SignalValue {
    if (!momentum || !momentum[num]) {
        return notApplicable("momentumAcceleration", "ไม่มีข้อมูล momentum");
    }
    const m = momentum[num];
    const normalized = clamp01((m.compositeScore - 1) / 2); // 1.0..3.0 => 0..1

    return {
        name: "momentumAcceleration",
        raw: m.compositeScore,
        normalized,
        confidence: 0.8,
        explanation: `แรงส่งของตัวเลข (Momentum): ${m.compositeScore.toFixed(2)}×`,
        applicable: m.compositeScore > 1.0,
    };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function notApplicable(name: string, explanation: string): SignalValue {
  return {
    name,
    raw: null,
    normalized: null,
    confidence: 0,
    explanation,
    applicable: false,
  };
}
