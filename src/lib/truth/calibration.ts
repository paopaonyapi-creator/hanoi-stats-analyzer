// ═══════════════════════════════════════════════
// Truth Engine — Calibration Engine
// ═══════════════════════════════════════════════

import type { CalibrationBucket, CalibrationResult } from "./types";

/**
 * Compute calibration: do higher scores correspond to higher observed rates?
 * Splits predictions into buckets and compares avg score vs observed hit rate.
 */
export function computeCalibration(
  predictions: Array<{ number: string; score: number }>,
  outcomes: string[],
  bucketCount: number = 5
): CalibrationResult {
  if (predictions.length === 0 || outcomes.length === 0) {
    return {
      buckets: [],
      isWellCalibrated: false,
      summary: "ข้อมูลไม่เพียงพอสำหรับ calibration",
    };
  }

  const outcomeSet = new Set(outcomes);
  const sorted = [...predictions].sort((a, b) => a.score - b.score);

  const buckets = buildCalibrationBuckets(sorted, outcomeSet, bucketCount);
  const isWellCalibrated = checkCalibration(buckets);

  const summary = isWellCalibrated
    ? "คะแนนที่สูงกว่ามีอัตราการปรากฏจริงสูงกว่า — calibration ดี"
    : "ไม่พบความสัมพันธ์ชัดเจนระหว่างคะแนนกับอัตราการปรากฏจริง — calibration อ่อน";

  return { buckets, isWellCalibrated, summary };
}

/**
 * Build calibration buckets from sorted predictions.
 */
export function buildCalibrationBuckets(
  sortedPredictions: Array<{ number: string; score: number }>,
  outcomeSet: Set<string>,
  bucketCount: number
): CalibrationBucket[] {
  const perBucket = Math.max(1, Math.floor(sortedPredictions.length / bucketCount));
  const buckets: CalibrationBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = i * perBucket;
    const end = i === bucketCount - 1 ? sortedPredictions.length : start + perBucket;
    const chunk = sortedPredictions.slice(start, end);

    if (chunk.length === 0) continue;

    const avgScore = chunk.reduce((s, p) => s + p.score, 0) / chunk.length;
    const hitCount = chunk.filter((p) => outcomeSet.has(p.number)).length;
    const observedRate = hitCount / chunk.length;

    const scoreLow = chunk[0].score.toFixed(0);
    const scoreHigh = chunk[chunk.length - 1].score.toFixed(0);

    buckets.push({
      bucket: `${scoreLow}-${scoreHigh}`,
      avgScore,
      observedRate,
      count: chunk.length,
    });
  }

  return buckets;
}

/**
 * Check if calibration is decent: higher buckets should have >= observed rate of lower buckets.
 */
function checkCalibration(buckets: CalibrationBucket[]): boolean {
  if (buckets.length < 2) return false;

  // Check monotonic tendency: top half should have higher observed rate than bottom half
  const mid = Math.floor(buckets.length / 2);
  const bottomAvg =
    buckets.slice(0, mid).reduce((s, b) => s + b.observedRate, 0) / mid;
  const topAvg =
    buckets.slice(mid).reduce((s, b) => s + b.observedRate, 0) /
    (buckets.length - mid);

  return topAvg > bottomAvg;
}

/**
 * Summarize calibration as text.
 */
export function summarizeCalibration(bucketData: CalibrationBucket[]): string {
  if (bucketData.length === 0) return "ไม่มีข้อมูล calibration";

  const lines = bucketData.map(
    (b) =>
      `คะแนน ${b.bucket}: ปรากฏจริง ${(b.observedRate * 100).toFixed(1)}% (${b.count} เลข)`
  );
  return lines.join(" | ");
}
