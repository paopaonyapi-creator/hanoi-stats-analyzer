// ═══════════════════════════════════════════════
// Truth Engine — Explanation Engine
// ═══════════════════════════════════════════════

import type { TruthExplanation, TruthScoreResult, SignalMap } from "./types";

/**
 * Build a plain-language explanation in Thai for a truth score result.
 */
export function buildPlainLanguageExplanation(input: TruthExplanation): string {
  const parts: string[] = [];

  parts.push(
    `เลข ${input.number} มีคะแนนแนวโน้มเชิงสถิติ ${input.trendScore.toFixed(1)}/100 ` +
    `(ความมั่นใจ ${input.confidenceScore.toFixed(1)}%, หลักฐาน ${input.evidenceStrength.toFixed(1)}%)`
  );

  // Label
  const labelText = getLabelDescription(input.label);
  parts.push(`สถานะ: ${labelText}`);

  // Positive factors
  if (input.positiveFactors.length > 0) {
    parts.push(`ปัจจัยบวก: ${input.positiveFactors.join(" | ")}`);
  }

  // Negative factors
  if (input.negativeFactors.length > 0) {
    parts.push(`ปัจจัยลบ: ${input.negativeFactors.join(" | ")}`);
  }

  // Limitations
  if (input.limitations.length > 0) {
    parts.push(`ข้อจำกัด: ${input.limitations.join(", ")}`);
  }

  // Data quality
  if (input.dataQualityNote) {
    parts.push(`คุณภาพข้อมูล: ${input.dataQualityNote}`);
  }

  // Warnings
  if (input.warnings.length > 0) {
    parts.push(`⚠ ${input.warnings.join(" | ")}`);
  }

  return parts.join("\n");
}

/**
 * Build explanation for a single truth score result with its signal map.
 */
export function explainTruthScore(
  result: TruthScoreResult,
  signalMap?: SignalMap
): TruthExplanation {
  const positiveFactors = result.topSignals;
  const negativeFactors = result.penalties;
  const limitations: string[] = [];
  const warnings: string[] = [];

  // Derive limitations from signals
  if (signalMap) {
    for (const signal of Object.values(signalMap)) {
      if (!signal.applicable) {
        limitations.push(signal.explanation);
      }
    }
  }

  // Add automatic warnings based on label
  if (result.label === "NO RELIABLE EDGE") {
    warnings.push(
      "ระบบยังไม่พบสัญญาณเชิงสถิติที่น่าเชื่อถือจากข้อมูลปัจจุบัน"
    );
  }
  if (result.label === "DATA NOT TRUSTWORTHY") {
    warnings.push(
      "คุณภาพข้อมูลไม่ผ่านเกณฑ์ ผลวิเคราะห์อาจไม่ถูกต้อง"
    );
  }
  if (result.label === "LOW CONFIDENCE") {
    warnings.push(
      "แม้คะแนนแนวโน้มจะสูง แต่ความมั่นใจในผลวิเคราะห์ยังต่ำ"
    );
  }

  return {
    number: result.number,
    trendScore: result.trendScore,
    confidenceScore: result.confidenceScore,
    evidenceStrength: result.evidenceStrength,
    label: result.label,
    positiveFactors,
    negativeFactors,
    limitations,
    dataQualityNote: `Integrity Score: ${result.integrityScore}/100`,
    warnings,
  };
}

/**
 * Summarize top signals from a signal map.
 */
export function summarizeTopSignals(signalMap: SignalMap): string[] {
  return Object.values(signalMap)
    .filter((s) => s.applicable && s.normalized !== null && s.normalized > 0.3)
    .sort((a, b) => (b.normalized ?? 0) - (a.normalized ?? 0))
    .slice(0, 3)
    .map((s) => `${s.name}: ${s.explanation}`);
}

/**
 * Summarize penalties from a signal map.
 */
export function summarizePenalties(signalMap: SignalMap): string[] {
  return Object.values(signalMap)
    .filter((s) => s.name.includes("Penalty") && s.applicable && (s.normalized ?? 0) > 0)
    .map((s) => `${s.name}: ${s.explanation}`);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getLabelDescription(label: string): string {
  const descriptions: Record<string, string> = {
    "STRONG SIGNAL":
      "สัญญาณแข็งแรง — มีหลักฐานสนับสนุนจากหลาย signal และ backtest",
    "WEAK SIGNAL":
      "สัญญาณอ่อน — มีแนวโน้มบ้าง แต่ยังไม่แข็งแรงพอ",
    "LOW CONFIDENCE":
      "ความมั่นใจต่ำ — คะแนนอาจสูง แต่ข้อมูลยังไม่เพียงพอหรือไม่คงที่",
    "DATA NOT TRUSTWORTHY":
      "ข้อมูลไม่น่าเชื่อถือ — คุณภาพข้อมูลต่ำเกินไป ไม่ควรใช้ผลวิเคราะห์",
    "NO RELIABLE EDGE":
      "ไม่พบสัญญาณที่น่าเชื่อถือ — ผลไม่ดีกว่า random baseline อย่างมีนัยสำคัญ",
  };
  return descriptions[label] || label;
}
