// ═══════════════════════════════════════════════
// Truth Engine — Constants & Default Settings
// ═══════════════════════════════════════════════

import type { TruthEngineSettings } from "./types";

// All canonical 2-digit numbers
export const ALL_NUMBERS_00_99: string[] = Array.from({ length: 100 }, (_, i) =>
  String(i).padStart(2, "0")
);

// ─────────────────────────────────────────────
// Default Engine Settings
// ─────────────────────────────────────────────

export const DEFAULT_TRUTH_ENGINE_SETTINGS: TruthEngineSettings = {
  minIntegrityScore: 70,
  minSampleForSignal: 30,
  minSampleForWindow: 12,
  recentWindows: [10, 20, 50],
  baselineTopK: 10,
  driftThreshold: 0.2,
  confidenceLowThreshold: 40,
  confidenceMediumThreshold: 65,
  strongSignalThreshold: 75,
  noReliableEdgeIfBaselineDeltaBelow: 0.02,

  weights: {
    frequencyAllTime: 1.0,
    frequencyRecent: 1.2,
    recencyDecay: 1.1,
    transition: 0.9,
    gapReturn: 1.0,
    digitBalance: 0.5,
    weekdayAlignment: 0.4,
    windowConsistency: 1.0,
    varianceStability: 1.3,
    patternStrength: 1.5,
    bayesianBias: 1.1,
    marketCorrelation: 1.2,
  },

  penalties: {
    anomalyPenalty: 1.2,
    overfitPenalty: 1.5,
    insufficientDataPenalty: 2.0,
    driftPenalty: 1.0,
  },

  confidenceWeights: {
    sampleSizeQuality: 1.0,
    featureAgreement: 1.1,
    windowStability: 1.2,
    outOfSampleConsistency: 1.3,
    integrity: 1.2,
  },
};

// ─────────────────────────────────────────────
// Integrity Thresholds
// ─────────────────────────────────────────────

export const INTEGRITY_LEVEL_THRESHOLDS = {
  HIGH: 85,
  MEDIUM: 70,
  LOW: 50,
  // Below 50 = BROKEN
} as const;

export const INTEGRITY_PENALTY_MAP: Record<string, number> = {
  MISSING_DATE: 5,
  INVALID_DATE: 5,
  INVALID_DRAW_TYPE: 4,
  INVALID_RESULT_DIGITS: 5,
  RESULT_LENGTH_SHORT: 3,
  DUPLICATE_COMPOSITE: 2,
  DRAW_TIME_OUT_OF_RANGE: 1,
  DATE_ORDER_ANOMALY: 3,
  SUSPICIOUS_REPEAT: 4,
  MALFORMED_TIME: 1,
};

// ─────────────────────────────────────────────
// Verdict Labels (Thai)
// ─────────────────────────────────────────────

export const VERDICT_LABELS: Record<string, string> = {
  STRONG: "สัญญาณแข็งแรง",
  MODERATE: "สัญญาณปานกลาง",
  WEAK: "สัญญาณอ่อน",
  NO_RELIABLE_EDGE: "ไม่พบสัญญาณที่น่าเชื่อถือ",
};

export const TRUTH_LABEL_COLORS: Record<string, string> = {
  "STRONG SIGNAL": "#10b981",
  "WEAK SIGNAL": "#f59e0b",
  "LOW CONFIDENCE": "#6366f1",
  "DATA NOT TRUSTWORTHY": "#ef4444",
  "NO RELIABLE EDGE": "#6b7280",
};

export const TRUTH_LABEL_THAI: Record<string, string> = {
  "STRONG SIGNAL": "สัญญาณแข็งแรง",
  "WEAK SIGNAL": "สัญญาณอ่อน",
  "LOW CONFIDENCE": "ความมั่นใจต่ำ",
  "DATA NOT TRUSTWORTHY": "ข้อมูลไม่น่าเชื่อถือ",
  "NO RELIABLE EDGE": "ไม่พบสัญญาณ",
};

// ─────────────────────────────────────────────
// Backtest Defaults
// ─────────────────────────────────────────────

export const BACKTEST_DEFAULTS = {
  trainMinSize: 60,
  testSize: 1,
  stepSize: 1,
  topK: 10,
} as const;

// ─────────────────────────────────────────────
// Forbidden UI Words (Thai)
// ─────────────────────────────────────────────

export const FORBIDDEN_WORDS = [
  "ฟันธง",
  "เลขแม่น",
  "รับรองผล",
  "การันตี",
  "แน่นอน",
] as const;

// ─────────────────────────────────────────────
// Signal Names
// ─────────────────────────────────────────────

export const SIGNAL_NAMES = {
  HOTNESS: "hotness",
  RECENCY: "recency",
  GAP_RETURN: "gapReturn",
  TRANSITION: "transition",
  WEEKDAY: "weekday",
  WINDOW_CONSISTENCY: "windowConsistency",
  DIGIT_BALANCE: "digitBalance",
  VARIANCE_STABILITY: "varianceStability",
  PATTERN_STRENGTH: "patternStrength",
  BAYESIAN_BIAS: "bayesianBias",
  MARKET_CORRELATION: "marketCorrelation",
  MOMENTUM_ACCELERATION: "momentumAcceleration",
  ANOMALY_PENALTY: "anomalyPenalty",
  INSUFFICIENT_DATA_PENALTY: "insufficientDataPenalty",
} as const;
