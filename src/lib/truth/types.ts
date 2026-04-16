// ═══════════════════════════════════════════════
// Truth Engine — Type Definitions
// ═══════════════════════════════════════════════

/** Canonical 2-digit number from "00" to "99" */
export type CanonicalNumber = string;

// ═══════════════════════════════════════════════
// Data Integrity
// ═══════════════════════════════════════════════

export type IntegritySeverity = "info" | "warning" | "error";
export type IntegrityLevelType = "HIGH" | "MEDIUM" | "LOW" | "BROKEN";

export interface IntegrityIssue {
  code: string;
  severity: IntegritySeverity;
  message: string;
  rowId?: string;
}

export interface IntegrityReport {
  score: number;
  level: IntegrityLevelType;
  issues: IntegrityIssue[];
  quarantinedRowIds: string[];
  acceptedRows: number;
  rejectedRows: number;
}

// ═══════════════════════════════════════════════
// Feature Engine
// ═══════════════════════════════════════════════

export interface NumberFeatures {
  number: CanonicalNumber;
  frequencyAllTime: number;
  frequencyRecent10: number;
  frequencyRecent20: number;
  frequencyRecent50: number;
  recencyGap: number | null;
  meanGap: number | null;
  medianGap: number | null;
  recurrenceRate: number;
  recencyDecayScore: number;
  windowStabilityScore: number;
  digitBalanceScore: number;
  transitionSupportScore: number;
  entropyScore: number;
  varianceScore: number;
  marketCorrelationScore: number;
}

export interface DatasetFeatures {
  totalRecords: number;
  uniqueNumbers: number;
  dateSpanDays: number;
  avgRecordsPerDay: number;
  hasMinimumForAnalysis: boolean;
  hasMinimumForBacktest: boolean;
}

export interface FeatureContext {
  datasetFeatures: DatasetFeatures;
  currentWeekday: number;
  previousLast2: string | null;
  drawType: string | null;
}

// ═══════════════════════════════════════════════
// Signal Engine
// ═══════════════════════════════════════════════

export interface SignalValue {
  name: string;
  raw: number | null;
  normalized: number | null;
  confidence: number;
  explanation: string;
  applicable: boolean;
}

export type SignalMap = Record<string, SignalValue>;

// ═══════════════════════════════════════════════
// Truth Scoring
// ═══════════════════════════════════════════════

export type TruthLabel =
  | "STRONG SIGNAL"
  | "WEAK SIGNAL"
  | "LOW CONFIDENCE"
  | "DATA NOT TRUSTWORTHY"
  | "NO RELIABLE EDGE";

export interface TruthScoreResult {
  number: CanonicalNumber;
  trendScore: number;
  confidenceScore: number;
  evidenceStrength: number;
  integrityScore: number;
  label: TruthLabel;
  topSignals: string[];
  penalties: string[];
  explanation: string;
}

export interface TruthExplanation {
  number: CanonicalNumber;
  trendScore: number;
  confidenceScore: number;
  evidenceStrength: number;
  label: TruthLabel;
  positiveFactors: string[];
  negativeFactors: string[];
  limitations: string[];
  dataQualityNote: string;
  warnings: string[];
}

// ═══════════════════════════════════════════════
// Baseline Comparison
// ═══════════════════════════════════════════════

export interface BaselineComparisonResult {
  method: string;
  topK: number;
  engineHitRate: number;
  randomExpectedHitRate: number;
  delta: number;
  interpretation: string;
}

// ═══════════════════════════════════════════════
// Walk-Forward Backtest
// ═══════════════════════════════════════════════

export interface WalkForwardFold {
  foldIndex: number;
  trainSize: number;
  testSize: number;
  topK: number;
  hitRate: number;
  baselineExpected: number;
  delta: number;
}

export interface CalibrationBucket {
  bucket: string;
  avgScore: number;
  observedRate: number;
  count: number;
}

export type BacktestVerdictType = "STRONG" | "MODERATE" | "WEAK" | "NO_RELIABLE_EDGE";

export interface BacktestSummary {
  folds: WalkForwardFold[];
  totalFolds: number;
  averageHitRate: number;
  averageBaseline: number;
  averageDelta: number;
  calibrationBuckets: CalibrationBucket[];
  verdict: BacktestVerdictType;
  insufficientData: boolean;
  message: string;
}

// ═══════════════════════════════════════════════
// Calibration
// ═══════════════════════════════════════════════

export interface CalibrationResult {
  buckets: CalibrationBucket[];
  isWellCalibrated: boolean;
  summary: string;
}

// ═══════════════════════════════════════════════
// Drift Detection
// ═══════════════════════════════════════════════

export interface DriftArea {
  area: string;
  shift: number;
  significance: "low" | "medium" | "high";
}

export interface DriftReport {
  driftScore: number;
  volatilityIndex: number; // 0..1 measuring rate of drift change
  affectedAreas: DriftArea[];
  severity: "none" | "low" | "medium" | "high";
  message: string;
}

export interface GlobalDriftReport {
    isDetected: boolean;
    activeMarkets: string[];
    severity: "low" | "medium" | "high";
    message: string;
}

// ═══════════════════════════════════════════════
// Reality Verdict
// ═══════════════════════════════════════════════

export type RealityVerdictType = "STRONG" | "MODERATE" | "WEAK" | "NO_RELIABLE_EDGE";

export interface RealityVerdictResult {
  verdict: RealityVerdictType;
  summary: string;
  integrityOk: boolean;
  baselineBeaten: boolean;
  backtestSupported: boolean;
  driftActive: boolean;
  showNoReliableSignalBanner: boolean;
}

// ═══════════════════════════════════════════════
// Pipeline Output
// ═══════════════════════════════════════════════

export interface TruthPipelineResult {
  integrityReport: IntegrityReport;
  truthScores: TruthScoreResult[];
  baselineComparison: BaselineComparisonResult;
  backtestSummary: BacktestSummary;
  driftReport: DriftReport;
  realityVerdict: RealityVerdictResult;
  datasetFeatures: DatasetFeatures;
  globalDrift?: GlobalDriftReport;
  generatedAt: string;
}

// ═══════════════════════════════════════════════
// Engine Settings
// ═══════════════════════════════════════════════

export interface TruthEngineSettings {
  minIntegrityScore: number;
  minSampleForSignal: number;
  minSampleForWindow: number;
  recentWindows: number[];
  baselineTopK: number;
  driftThreshold: number;
  confidenceLowThreshold: number;
  confidenceMediumThreshold: number;
  strongSignalThreshold: number;
  noReliableEdgeIfBaselineDeltaBelow: number;
  weights: TruthWeights;
  penalties: TruthPenalties;
  confidenceWeights: TruthConfidenceWeights;
}

export interface TruthWeights {
  frequencyAllTime: number;
  frequencyRecent: number;
  recencyDecay: number;
  transition: number;
  gapReturn: number;
  digitBalance: number;
  weekdayAlignment: number;
  windowConsistency: number;
  varianceStability: number;
  patternStrength: number;
  bayesianBias: number;
  marketCorrelation: number;
}

export interface TruthPenalties {
  anomalyPenalty: number;
  overfitPenalty: number;
  insufficientDataPenalty: number;
  driftPenalty: number;
}

export interface TruthConfidenceWeights {
  sampleSizeQuality: number;
  featureAgreement: number;
  windowStability: number;
  outOfSampleConsistency: number;
  integrity: number;
}

// ═══════════════════════════════════════════════
// Audit
// ═══════════════════════════════════════════════

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  eventType: string;
  severity: string;
  detailJson: Record<string, unknown>;
}
