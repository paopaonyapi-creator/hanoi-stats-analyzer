import { describe, expect, it } from "vitest";
import { explainTrendScore } from "../src/lib/scoring/explain";
import { calculateTrendScores } from "../src/lib/scoring/score";
import { computeGapAnalysis, getGapFactor } from "../src/lib/stats/gap";
import { computeTransitions } from "../src/lib/stats/transitions";
import type { DrawResultRecord } from "../src/types";

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
    createdAt: new Date(date).toISOString(),
    updatedAt: new Date(date).toISOString(),
  };
}

describe("gap analysis", () => {
  const values = ["01", "02", "03", "01", "04", "01"];
  const allPossible = ["01", "02", "03", "04", "05"];

  it("returns entries for all possible values", () => {
    const gaps = computeGapAnalysis(values, allPossible);
    expect(gaps).toHaveLength(5);
  });

  it("tracks missing and recent numbers correctly", () => {
    const gaps = computeGapAnalysis(values, allPossible);
    const gap05 = gaps.find((g) => g.value === "05");
    const gap01 = gaps.find((g) => g.value === "01");

    expect(gap05?.currentGap).toBe(6);
    expect(gap01?.currentGap).toBe(0);
  });

  it("gives a higher gap factor to missing numbers", () => {
    const gapFactor01 = getGapFactor("01", values, allPossible);
    const gapFactor05 = getGapFactor("05", values, allPossible);

    expect(gapFactor05).toBeGreaterThan(gapFactor01);
  });
});

describe("transitions", () => {
  it("counts transitions correctly", () => {
    const transitions = computeTransitions(["01", "02", "01", "02", "03"]);
    const t0102 = transitions.find((t) => t.from === "01" && t.to === "02");

    expect(transitions.length).toBeGreaterThan(0);
    expect(t0102?.count).toBe(2);
  });
});

describe("trend score calculator", () => {
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

  it("calculates 100 scores", () => {
    const scores = calculateTrendScores(testRecords);
    expect(scores).toHaveLength(100);
  });

  it("scores frequent numbers above zero and into the top 10", () => {
    const scores = calculateTrendScores(testRecords);
    const score12 = scores.find((s) => s.number === "12");
    const top10Numbers = scores.slice(0, 10).map((s) => s.number);

    expect(score12).toBeDefined();
    expect(score12?.normalizedScore).toBeGreaterThan(0);
    expect(top10Numbers).toContain("12");
  });

  it("explains the score with seven factors", () => {
    const scores = calculateTrendScores(testRecords);
    const score12 = scores.find((s) => s.number === "12");

    expect(score12).toBeDefined();

    const explanation = explainTrendScore(score12!);
    expect(explanation.number).toBe("12");
    expect(explanation.factors).toHaveLength(7);
    expect(explanation.factors.every((factor) => factor.name && factor.description)).toBe(true);
  });

  it("returns zeroed scores for empty input", () => {
    const emptyScores = calculateTrendScores([]);

    expect(emptyScores).toHaveLength(100);
    expect(emptyScores.every((score) => score.normalizedScore === 0)).toBe(true);
  });
});
