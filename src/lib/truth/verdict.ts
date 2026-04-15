// ═══════════════════════════════════════════════
// Truth Engine — Reality Verdict Engine
// ═══════════════════════════════════════════════

import type {
  IntegrityReport,
  BacktestSummary,
  BaselineComparisonResult,
  DriftReport,
  RealityVerdictResult,
  RealityVerdictType,
  TruthEngineSettings,
} from "./types";
import { DEFAULT_TRUTH_ENGINE_SETTINGS, VERDICT_LABELS } from "./constants";

/**
 * Build the final reality verdict by combining all subsystem outputs.
 */
export function buildRealityVerdict(input: {
  integrityReport: IntegrityReport;
  backtestSummary: BacktestSummary;
  baselineResult: BaselineComparisonResult;
  driftReport: DriftReport;
  settings?: TruthEngineSettings;
}): RealityVerdictResult {
  const {
    integrityReport,
    backtestSummary,
    baselineResult,
    driftReport,
    settings = DEFAULT_TRUTH_ENGINE_SETTINGS,
  } = input;

  const integrityOk = integrityReport.score >= settings.minIntegrityScore;
  const baselineBeaten = baselineResult.delta > settings.noReliableEdgeIfBaselineDeltaBelow;
  const backtestSupported = backtestSummary.verdict === "STRONG" || backtestSummary.verdict === "MODERATE";
  const driftActive = driftReport.severity === "medium" || driftReport.severity === "high";

  let verdict: RealityVerdictType;

  if (!integrityOk) {
    verdict = "NO_RELIABLE_EDGE";
  } else if (!baselineBeaten && backtestSummary.verdict === "NO_RELIABLE_EDGE") {
    verdict = "NO_RELIABLE_EDGE";
  } else if (backtestSupported && !driftActive) {
    verdict = backtestSummary.verdict === "STRONG" ? "STRONG" : "MODERATE";
  } else if (backtestSupported && driftActive) {
    // Degrade by one level due to drift
    verdict = backtestSummary.verdict === "STRONG" ? "MODERATE" : "WEAK";
  } else if (baselineBeaten) {
    verdict = driftActive ? "WEAK" : "MODERATE";
  } else {
    verdict = "WEAK";
  }

  const summary = buildRealitySummaryText({
    verdict,
    integrityOk,
    baselineBeaten,
    backtestSupported,
    driftActive,
    baselineDelta: baselineResult.delta,
  });

  const showNoReliableSignalBanner = shouldShowNoReliableSignalBanner({
    verdict,
    integrityOk,
    baselineBeaten,
  });

  return {
    verdict,
    summary,
    integrityOk,
    baselineBeaten,
    backtestSupported,
    driftActive,
    showNoReliableSignalBanner,
  };
}

/**
 * Build a human-readable summary of the reality verdict.
 */
export function buildRealitySummaryText(input: {
  verdict: RealityVerdictType;
  integrityOk: boolean;
  baselineBeaten: boolean;
  backtestSupported: boolean;
  driftActive: boolean;
  baselineDelta: number;
}): string {
  const parts: string[] = [];

  parts.push(`ผลการตรวจสอบ: ${VERDICT_LABELS[input.verdict]}`);

  if (!input.integrityOk) {
    parts.push("⚠ คุณภาพข้อมูลไม่ผ่านเกณฑ์ขั้นต่ำ");
  }
  if (!input.baselineBeaten) {
    parts.push("ระบบยังไม่ทำได้ดีกว่า random baseline อย่างมีนัยสำคัญ");
  }
  if (input.backtestSupported) {
    parts.push("Walk-forward backtest สนับสนุนผลวิเคราะห์");
  } else {
    parts.push("Walk-forward backtest ยังไม่สนับสนุนผลวิเคราะห์อย่างชัดเจน");
  }
  if (input.driftActive) {
    parts.push("⚠ พบ drift ในข้อมูล — รูปแบบอาจเปลี่ยนไปจากข้อมูลเดิม");
  }

  parts.push(`Baseline delta: ${(input.baselineDelta * 100).toFixed(2)}%`);

  return parts.join("\n");
}

/**
 * Determine if the "No Reliable Signal" banner should be shown.
 */
export function shouldShowNoReliableSignalBanner(input: {
  verdict: RealityVerdictType;
  integrityOk: boolean;
  baselineBeaten: boolean;
}): boolean {
  return (
    input.verdict === "NO_RELIABLE_EDGE" ||
    (!input.integrityOk && !input.baselineBeaten)
  );
}
