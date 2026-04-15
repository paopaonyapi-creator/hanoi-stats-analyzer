// ═══════════════════════════════════════════════
// Types for Hanoi Stats Analyzer
// ═══════════════════════════════════════════════

export type DrawType = "SPECIAL" | "NORMAL" | "VIP";

export interface DrawResultRecord {
  id: string;
  drawDate: string;
  drawType: DrawType;
  drawTime: string | null;
  resultRaw: string;
  resultDigits: string;
  last1: string;
  last2: string;
  last3: string;
  weekday: number;
  monthKey: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSummary {
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  reason: string;
  data?: Record<string, string>;
}

export interface CsvPreviewRow {
  rowIndex: number;
  date: string;
  type: string;
  time: string;
  result: string;
  status: "valid" | "invalid" | "duplicate";
  reason?: string;
  parsedType?: DrawType;
  parsedDigits?: string;
}

export interface FrequencyEntry {
  value: string;
  count: number;
  percentage: number;
}

export interface GapEntry {
  value: string;
  currentGap: number;
  maxGap: number;
  avgGap: number;
  lastSeen: string | null;
}

export interface TransitionEntry {
  from: string;
  to: string;
  count: number;
}

export interface WeekdayStats {
  weekday: number;
  label: string;
  count: number;
}

export interface MonthStats {
  monthKey: string;
  count: number;
}

export interface AnalysisSummary {
  totalRecords: number;
  totalDays: number;
  dateRange: { from: string; to: string } | null;
  byType: Record<DrawType, number>;
  topLast2: FrequencyEntry[];
  topLast3: FrequencyEntry[];
  digitFrequency: FrequencyEntry[];
  tensFrequency: FrequencyEntry[];
  unitsFrequency: FrequencyEntry[];
  oddEvenRatio: { odd: number; even: number };
  lowHighRatio: { low: number; high: number };
  weekdayStats: WeekdayStats[];
  monthStats: MonthStats[];
  gapAnalysis: GapEntry[];
  transitions: TransitionEntry[];
  recentRecords: DrawResultRecord[];
}

export interface TrendScore {
  number: string;
  score: number;
  normalizedScore: number;
  factors: TrendFactors;
}

export interface TrendFactors {
  frequencyAllTime: number;
  frequencyRecent: number;
  gapFactor: number;
  transitionFactor: number;
  digitBalanceFactor: number;
  repeatBehaviorFactor: number;
  weekdayAlignmentFactor: number;
}

export interface TrendScoreExplanation {
  number: string;
  score: number;
  normalizedScore: number;
  factors: {
    name: string;
    weight: number;
    rawValue: number;
    weightedValue: number;
    description: string;
  }[];
}

export interface ScoreWeights {
  allTime: number;
  recent: number;
  gap: number;
  transition: number;
  digitBalance: number;
  repeat: number;
  weekday: number;
}

export interface FilterParams {
  drawType?: DrawType | "ALL";
  dateFrom?: string;
  dateTo?: string;
  last2?: string;
  last3?: string;
  weekday?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppSettingValue {
  scoreWeights?: ScoreWeights;
  [key: string]: unknown;
}
