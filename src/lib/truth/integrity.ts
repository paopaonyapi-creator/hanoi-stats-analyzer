// ═══════════════════════════════════════════════
// Truth Engine — Data Integrity Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { IntegrityReport, IntegrityIssue, IntegrityLevelType } from "./types";
import { INTEGRITY_LEVEL_THRESHOLDS, INTEGRITY_PENALTY_MAP } from "./constants";

/**
 * Compute a full integrity report for a set of draw records.
 * Checks chronology, duplicates, suspicious patterns, and data quality.
 */
export function computeIntegrityReport(records: DrawResultRecord[]): IntegrityReport {
  if (records.length === 0) {
    return {
      score: 0,
      level: "BROKEN",
      issues: [{ code: "NO_DATA", severity: "error", message: "ไม่มีข้อมูลในระบบ" }],
      quarantinedRowIds: [],
      acceptedRows: 0,
      rejectedRows: 0,
    };
  }

  const issues: IntegrityIssue[] = [];

  // Run all checks
  issues.push(...validateChronology(records));
  issues.push(...validateTimeSlots(records));
  issues.push(...detectDuplicateRecords(records));
  issues.push(...detectSuspiciousRepeats(records));
  issues.push(...validateRecordFields(records));

  // Score and quarantine
  const score = scoreIntegrityIssues(issues, records.length);
  const level = getIntegrityLevel(score);
  const quarantinedRowIds = getQuarantinedRowIds(issues);

  const rejectedRows = quarantinedRowIds.length;
  const acceptedRows = records.length - rejectedRows;

  return { score, level, issues, quarantinedRowIds, acceptedRows, rejectedRows };
}

/**
 * Compute integrity score from 100 down based on issues found.
 */
export function scoreIntegrityIssues(issues: IntegrityIssue[], totalRecords: number): number {
  let score = 100;
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  // Penalize per issue code
  for (const issue of issues) {
    const penalty = INTEGRITY_PENALTY_MAP[issue.code] ?? 1;
    if (issue.severity === "error") {
      score -= penalty;
    } else if (issue.severity === "warning") {
      score -= penalty * 0.5;
    } else {
      score -= penalty * 0.1;
    }
  }

  // Additional penalty if error ratio is high
  const errorRatio = errorCount / Math.max(totalRecords, 1);
  if (errorRatio > 0.1) score -= 15;
  else if (errorRatio > 0.05) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/**
 * Get integrity level from score.
 */
export function getIntegrityLevel(score: number): IntegrityLevelType {
  if (score >= INTEGRITY_LEVEL_THRESHOLDS.HIGH) return "HIGH";
  if (score >= INTEGRITY_LEVEL_THRESHOLDS.MEDIUM) return "MEDIUM";
  if (score >= INTEGRITY_LEVEL_THRESHOLDS.LOW) return "LOW";
  return "BROKEN";
}

/**
 * Filter out quarantined (broken) rows, returning only accepted records.
 */
export function quarantineBrokenRows(
  records: DrawResultRecord[],
  report: IntegrityReport
): DrawResultRecord[] {
  const quarantineSet = new Set(report.quarantinedRowIds);
  return records.filter((r) => !quarantineSet.has(r.id));
}

/**
 * Check date chronology — flag out-of-order or duplicated dates.
 */
export function validateChronology(records: DrawResultRecord[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].drawDate).getTime();
    const curr = new Date(sorted[i].drawDate).getTime();
    if (curr < prev) {
      issues.push({
        code: "DATE_ORDER_ANOMALY",
        severity: "warning",
        message: `ลำดับวันที่ไม่ต่อเนื่อง: ${sorted[i].drawDate}`,
        rowId: sorted[i].id,
      });
    }
  }
  return issues;
}

/**
 * Validate draw time slots — flag times outside expected ranges.
 */
export function validateTimeSlots(records: DrawResultRecord[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const validHourRanges: Record<string, [number, number]> = {
    SPECIAL: [16, 18],
    NORMAL: [17, 19],
    VIP: [18, 20],
  };

  for (const r of records) {
    if (!r.drawTime) continue;
    const match = r.drawTime.match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
      issues.push({
        code: "MALFORMED_TIME",
        severity: "info",
        message: `เวลาไม่ถูกรูปแบบ: "${r.drawTime}"`,
        rowId: r.id,
      });
      continue;
    }
    const hour = parseInt(match[1]);
    const range = validHourRanges[r.drawType];
    if (range && (hour < range[0] || hour > range[1])) {
      issues.push({
        code: "DRAW_TIME_OUT_OF_RANGE",
        severity: "info",
        message: `เวลา ${r.drawTime} อยู่นอกช่วงปกติของ ${r.drawType}`,
        rowId: r.id,
      });
    }
  }
  return issues;
}

/**
 * Detect exact duplicate composite rows (same date + type + digits).
 */
export function detectDuplicateRecords(records: DrawResultRecord[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const seen = new Set<string>();

  for (const r of records) {
    const key = `${r.drawDate}|${r.drawType}|${r.resultDigits}`;
    if (seen.has(key)) {
      issues.push({
        code: "DUPLICATE_COMPOSITE",
        severity: "warning",
        message: `พบข้อมูลซ้ำ: ${r.drawDate} ${r.drawType} ${r.resultDigits}`,
        rowId: r.id,
      });
    }
    seen.add(key);
  }
  return issues;
}

/**
 * Detect suspiciously repeated values in short consecutive windows.
 */
export function detectSuspiciousRepeats(records: DrawResultRecord[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  // Check if same last2 appears 3+ times in a sliding window of 5
  for (let i = 0; i <= sorted.length - 5; i++) {
    const window = sorted.slice(i, i + 5);
    const last2Counts: Record<string, number> = {};
    for (const r of window) {
      last2Counts[r.last2] = (last2Counts[r.last2] || 0) + 1;
    }
    for (const [val, count] of Object.entries(last2Counts)) {
      if (count >= 3) {
        issues.push({
          code: "SUSPICIOUS_REPEAT",
          severity: "warning",
          message: `เลข ${val} ซ้ำ ${count} ครั้งใน 5 งวดติดกัน (อาจผิดปกติ)`,
          rowId: window[window.length - 1].id,
        });
      }
    }
  }

  // Deduplicate issues by unique message
  const uniqueIssues = new Map<string, IntegrityIssue>();
  for (const issue of issues) {
    uniqueIssues.set(issue.message, issue);
  }
  return Array.from(uniqueIssues.values());
}

/**
 * Validate individual record fields.
 */
function validateRecordFields(records: DrawResultRecord[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  for (const r of records) {
    if (!r.drawDate) {
      issues.push({
        code: "MISSING_DATE",
        severity: "error",
        message: `ไม่มีวันที่`,
        rowId: r.id,
      });
    }
    if (!r.resultDigits || r.resultDigits.length < 2) {
      issues.push({
        code: "RESULT_LENGTH_SHORT",
        severity: "error",
        message: `ผลลัพธ์ไม่ครบ: "${r.resultDigits}"`,
        rowId: r.id,
      });
    }
    const validTypes = ["SPECIAL", "NORMAL", "VIP"];
    if (!validTypes.includes(r.drawType)) {
      issues.push({
        code: "INVALID_DRAW_TYPE",
        severity: "error",
        message: `ประเภทไม่ถูกต้อง: "${r.drawType}"`,
        rowId: r.id,
      });
    }
  }
  return issues;
}

/**
 * Get IDs of rows that should be quarantined based on error-level issues.
 */
function getQuarantinedRowIds(issues: IntegrityIssue[]): string[] {
  const ids = new Set<string>();
  for (const issue of issues) {
    if (issue.severity === "error" && issue.rowId) {
      ids.add(issue.rowId);
    }
  }
  return Array.from(ids);
}
