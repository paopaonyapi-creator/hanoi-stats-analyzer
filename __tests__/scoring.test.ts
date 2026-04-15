/**
 * Tests for gap analysis and trend score calculator
 *
 * Run with: npx tsx __tests__/scoring.test.ts
 */

import { computeGapAnalysis, getGapFactor } from "../src/lib/stats/gap";
import { computeTransitions } from "../src/lib/stats/transitions";
import { calculateTrendScores } from "../src/lib/scoring/score";
import { explainTrendScore } from "../src/lib/scoring/explain";
import type { DrawResultRecord } from "../src/types";

// ═══════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

function assertGt(actual: number, expected: number, testName: string) {
  if (actual > expected) {
    console.log(`  ✅ ${testName} (${actual} > ${expected})`);
    passed++;
  } else {
    console.log(`  ❌ ${testName} — expected > ${expected}, got: ${actual}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════
// Gap Analysis
// ═══════════════════════════════════════════════

console.log("\n📌 Gap Analysis");

const values = ["01", "02", "03", "01", "04", "01"];
const allPossible = ["01", "02", "03", "04", "05"];
const gaps = computeGapAnalysis(values, allPossible);

assert(gaps.length === 5, "returns entries for all possible values");

const gap05 = gaps.find((g) => g.value === "05");
assert(gap05 !== undefined, "missing number has entry");
assert(gap05!.currentGap === 6, "missing number gap = total length");

const gap01 = gaps.find((g) => g.value === "01");
assert(gap01 !== undefined, "frequent number has entry");
assert(gap01!.currentGap === 0, "last value has gap = 0");

// ═══════════════════════════════════════════════
// Gap Factor
// ═══════════════════════════════════════════════

console.log("\n📌 Gap Factor");

const gapFactor01 = getGapFactor("01", values, allPossible);
const gapFactor05 = getGapFactor("05", values, allPossible);

assert(gapFactor05 > gapFactor01, "missing number has higher gap factor");

// ═══════════════════════════════════════════════
// Transitions
// ═══════════════════════════════════════════════

console.log("\n📌 Transitions");

const transValues = ["01", "02", "01", "02", "03"];
const transitions = computeTransitions(transValues);

assert(transitions.length > 0, "transitions computed");
const t0102 = transitions.find((t) => t.from === "01" && t.to === "02");
assert(t0102 !== undefined, "01->02 transition exists");
assert(t0102!.count === 2, "01->02 count is 2");

// ═══════════════════════════════════════════════
// Trend Score Calculator
// ═══════════════════════════════════════════════

console.log("\n📌 Trend Score Calculator");

// Create minimal mock records
function makeRecord(date: string, last2: string, weekday: number): DrawResultRecord {
  return {
    id: `test-${date}-${last2}`,
    drawDate: new Date(date).toISOString(),
    drawType: "NORMAL",
    drawTime: "18:00",
    resultRaw: `00${last2}`,
    resultDigits: `00${last2}`,
    last1: last2.slice(-1),
    last2,
    last3: `0${last2}`,
    weekday,
    monthKey: date.slice(0, 7),
    source: "test",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const testRecords: DrawResultRecord[] = [
  makeRecord("2025-03-01", "12", 6),
  makeRecord("2025-03-02", "34", 0),
  makeRecord("2025-03-03", "12", 1),
  makeRecord("2025-03-04", "56", 2),
  makeRecord("2025-03-05", "12", 3),
  makeRecord("2025-03-06", "78", 4),
  makeRecord("2025-03-07", "12", 5),
  makeRecord("2025-03-08", "90", 6),
  makeRecord("2025-03-09", "12", 0),
  makeRecord("2025-03-10", "34", 1),
];

const scores = calculateTrendScores(testRecords);

assert(scores.length === 100, "100 scores calculated (00-99)");

const score12 = scores.find((s) => s.number === "12");
assert(score12 !== undefined, "score for 12 exists");
assertGt(score12!.normalizedScore, 0, "score for frequent number > 0");

// Score for number 12 should be relatively high since it appeared 5 times
const top10 = scores.slice(0, 10);
const top10Numbers = top10.map((s) => s.number);
assert(top10Numbers.includes("12"), "12 is in top 10 scores");

// ═══════════════════════════════════════════════
// Trend Score Explanation
// ═══════════════════════════════════════════════

console.log("\n📌 Trend Score Explanation");

if (score12) {
  const explanation = explainTrendScore(score12);
  assert(explanation.number === "12", "explanation number matches");
  assert(explanation.factors.length === 7, "7 factors in explanation");
  assert(explanation.factors.every((f) => f.name), "all factors have names");
  assert(explanation.factors.every((f) => f.description), "all factors have descriptions");
}

// ═══════════════════════════════════════════════
// Empty records case
// ═══════════════════════════════════════════════

console.log("\n📌 Edge Cases");

const emptyScores = calculateTrendScores([]);
assert(emptyScores.length === 100, "100 scores even with empty data");
assert(emptyScores.every((s) => s.normalizedScore === 0), "all scores are 0 for empty data");

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (failed > 0) process.exit(1);
