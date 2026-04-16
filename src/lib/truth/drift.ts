// ═══════════════════════════════════════════════
// Truth Engine — Drift Detection Engine
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { DriftReport, DriftArea } from "./types";

/**
 * Detect distribution drift between reference (older) and recent data.
 */
export function detectDrift(
  referenceRecords: DrawResultRecord[],
  recentRecords: DrawResultRecord[]
): DriftReport {
  if (referenceRecords.length < 20 || recentRecords.length < 10) {
    return {
      driftScore: 0,
      volatilityIndex: 0,
      affectedAreas: [],
      severity: "none",
      message: "ข้อมูลไม่เพียงพอสำหรับตรวจ drift",
    };
  }

  // Calculate Volatility Index: Shift between Very Recent (5) and Recent (20)
  const veryRecent = recentRecords.slice(0, 5);
  const v1 = computeDigitDistribution(veryRecent);
  const v2 = computeDigitDistribution(recentRecords);
  const volatilityIndex = computeDistributionShift(v1, v2);

  const areas: DriftArea[] = [];

  // 1. Digit distribution shift (0-9)
  const refDigitDist = computeDigitDistribution(referenceRecords);
  const recDigitDist = computeDigitDistribution(recentRecords);
  const digitShift = computeDistributionShift(refDigitDist, recDigitDist);
  areas.push({
    area: "digit_distribution",
    shift: digitShift,
    significance: categorizeShift(digitShift),
  });

  // 2. Last2 frequency shift
  const refLast2 = computeLast2Top10(referenceRecords);
  const recLast2 = computeLast2Top10(recentRecords);
  const last2Shift = computeJaccardShift(refLast2, recLast2);
  areas.push({
    area: "last2_frequency",
    shift: last2Shift,
    significance: categorizeShift(last2Shift),
  });

  // 3. Weekday shift
  const refWeekday = computeWeekdayDistribution(referenceRecords);
  const recWeekday = computeWeekdayDistribution(recentRecords);
  const weekdayShift = computeDistributionShift(refWeekday, recWeekday);
  areas.push({
    area: "weekday_distribution",
    shift: weekdayShift,
    significance: categorizeShift(weekdayShift),
  });

  // 4. Odd/even shift
  const refOddRatio = referenceRecords.filter((r) => parseInt(r.last1) % 2 !== 0).length / referenceRecords.length;
  const recOddRatio = recentRecords.filter((r) => parseInt(r.last1) % 2 !== 0).length / recentRecords.length;
  const oddEvenShift = Math.abs(refOddRatio - recOddRatio);
  areas.push({
    area: "odd_even_ratio",
    shift: oddEvenShift,
    significance: categorizeShift(oddEvenShift * 2), // amplify for sensitivity
  });

  // 5. Transition behavior shift
  const refTransDiversity = computeTransitionDiversity(referenceRecords);
  const recTransDiversity = computeTransitionDiversity(recentRecords);
  const transShift = Math.abs(refTransDiversity - recTransDiversity);
  areas.push({
    area: "transition_behavior",
    shift: transShift,
    significance: categorizeShift(transShift * 3),
  });

  // Composite drift score
  const driftScore = areas.reduce((s, a) => s + a.shift, 0) / areas.length;
  const highAreas = areas.filter((a) => a.significance === "high");
  const medAreas = areas.filter((a) => a.significance === "medium");

  const severity: DriftReport["severity"] =
    highAreas.length >= 2 ? "high" :
    highAreas.length >= 1 || medAreas.length >= 3 ? "medium" :
    medAreas.length >= 1 ? "low" : "none";

  const message = buildDriftMessage(severity, areas);

  return { driftScore, volatilityIndex, affectedAreas: areas, severity, message };
}

/**
 * Detects if multiple markets are drifting at the same time.
 */
export function detectGlobalDrift(
    marketReports: Record<string, DriftReport>
): GlobalDriftReport {
    const activeMarkets = Object.entries(marketReports)
        .filter(([_, report]) => report.severity !== 'none' && report.severity !== 'low')
        .map(([name]) => name);

    const isDetected = activeMarkets.length >= 2;
    const maxSeverity = activeMarkets.length >= 3 ? 'high' : activeMarkets.length >= 2 ? 'medium' : 'low';

    return {
        isDetected,
        activeMarkets,
        severity: maxSeverity as any,
        message: isDetected 
            ? `⚠️ SENTINEL ALERT: ระบบตรวจพบการเบี่ยงเบนข้ามตลาดใน ${activeMarkets.join(', ')}`
            : "สภาวะตลาดโดยรวมยังคงเสถียร"
    };
}

function buildDriftMessage(severity: DriftReport["severity"], areas: DriftArea[]): string {
  if (severity === "none") return "ไม่พบการเปลี่ยนแปลงรูปแบบข้อมูลที่มีนัยสำคัญ";
  const affected = areas.filter(a => a.significance !== "low").map(a => areaLabel(a.area)).join(", ");
  return `พบ drift ระดับ ${severityLabel(severity)} ใน: ${affected}`;
}

/**
 * Compare distribution shift between two frequency arrays.
 * Returns a value 0..1 where 0 = identical, 1 = completely different.
 */
export function compareDistributionShift(
  reference: number[],
  recent: number[]
): number {
  return computeDistributionShift(reference, recent);
}

/**
 * Build a human-readable drift warning message.
 */
export function buildDriftWarning(report: DriftReport): string {
  if (report.severity === "none") {
    return "ไม่พบการเปลี่ยนแปลงรูปแบบข้อมูลที่มีนัยสำคัญ";
  }

  const affected = report.affectedAreas
    .filter((a) => a.significance !== "low")
    .map((a) => areaLabel(a.area))
    .join(", ");

  return `พบการเปลี่ยนแปลงรูปแบบข้อมูล (drift) — ด้านที่เปลี่ยน: ${affected}. ` +
    `ความรุนแรง: ${severityLabel(report.severity)}. ` +
    `ระบบอาจต้องลดความเชื่อมั่นในผลวิเคราะห์`;
}

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

function computeDigitDistribution(records: DrawResultRecord[]): number[] {
  const counts = new Array(10).fill(0);
  for (const r of records) {
    for (const ch of r.resultDigits) {
      const d = parseInt(ch);
      if (!isNaN(d)) counts[d]++;
    }
  }
  const total = counts.reduce((s: number, c: number) => s + c, 0) || 1;
  return counts.map((c: number) => c / total);
}

function computeWeekdayDistribution(records: DrawResultRecord[]): number[] {
  const counts = new Array(7).fill(0);
  for (const r of records) counts[r.weekday]++;
  const total = records.length || 1;
  return counts.map((c: number) => c / total);
}

function computeLast2Top10(records: DrawResultRecord[]): Set<string> {
  const freq: Record<string, number> = {};
  for (const r of records) freq[r.last2] = (freq[r.last2] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return new Set(sorted.slice(0, 10).map(([k]) => k));
}

function computeJaccardShift(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return 1 - intersection.size / union.size;
}

function computeDistributionShift(ref: number[], rec: number[]): number {
  // L1 distance (total variation distance)
  const len = Math.max(ref.length, rec.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += Math.abs((ref[i] || 0) - (rec[i] || 0));
  }
  return sum / 2; // normalize to 0..1
}

function computeTransitionDiversity(records: DrawResultRecord[]): number {
  const sorted = [...records].sort(
    (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );
  const transitions = new Set<string>();
  for (let i = 1; i < sorted.length; i++) {
    transitions.add(`${sorted[i - 1].last2}->${sorted[i].last2}`);
  }
  return transitions.size / Math.max(sorted.length - 1, 1);
}

function categorizeShift(shift: number): "low" | "medium" | "high" {
  if (shift >= 0.3) return "high";
  if (shift >= 0.15) return "medium";
  return "low";
}

function areaLabel(area: string): string {
  const labels: Record<string, string> = {
    digit_distribution: "การกระจายตัวเลข",
    last2_frequency: "ความถี่เลข 2 ตัวท้าย",
    weekday_distribution: "การกระจายวัน",
    odd_even_ratio: "สัดส่วนคี่/คู่",
    transition_behavior: "พฤติกรรม transition",
  };
  return labels[area] || area;
}

function severityLabel(s: string): string {
  const labels: Record<string, string> = {
    none: "ไม่มี",
    low: "ต่ำ",
    medium: "ปานกลาง",
    high: "สูง",
  };
  return labels[s] || s;
}
