// __tests__/ensemble.test.ts
import { describe, it, expect } from "vitest";
import { computeEnsembleScores } from "@/lib/truth/ensemble";
import type { DrawResultRecord } from "@/types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeRecord(overrides: Partial<DrawResultRecord> = {}): DrawResultRecord {
    return {
        id: Math.random().toString(36).slice(2),
        drawDate: new Date().toISOString(),
        drawType: "NORMAL",
        drawTime: "18:00",
        resultRaw: "12345",
        resultDigits: "12345",
        last1: "5",
        last2: "45",
        last3: "345",
        weekday: 1,
        monthKey: "2025-10",
        source: "test",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function makeDateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
}

function makeRecordsWithHotNumber(
    hotNumber: string,
    total: number,
    hotFrequency: number
): DrawResultRecord[] {
    return Array.from({ length: total }, (_, i) => {
        const isHot = i % Math.round(1 / hotFrequency) === 0;
        const last2 = isHot ? hotNumber : ((i * 7 + 13) % 100).toString().padStart(2, "0");
        return makeRecord({
            last2,
            last1: last2.slice(-1),
            last3: ("0" + last2).slice(-3),
            drawDate: makeDateStr(total - i),
        });
    });
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe("computeEnsembleScores", () => {
    it("returns 100 results (one per 00-99)", () => {
        const records = Array.from({ length: 50 }, (_, i) =>
            makeRecord({ last2: (i % 100).toString().padStart(2, "0"), drawDate: makeDateStr(50 - i) })
        );
        const scores = computeEnsembleScores(records);
        expect(scores).toHaveLength(100);
    });

    it("results are sorted descending by ensembleScore", () => {
        const records = makeRecordsWithHotNumber("23", 60, 0.3);
        const scores = computeEnsembleScores(records);
        for (let i = 0; i < scores.length - 1; i++) {
            expect(scores[i].ensembleScore).toBeGreaterThanOrEqual(scores[i + 1].ensembleScore);
        }
    });

    it("hot number ranks higher than cold number", () => {
        const hotNumber = "42";
        const coldNumber = "07";

        // hotNumber appears 30% of the time; coldNumber never appears
        const records = Array.from({ length: 60 }, (_, i) => {
            const last2 = i % 3 === 0 ? hotNumber : ((i + 11) % 100).toString().padStart(2, "0");
            return makeRecord({ last2, drawDate: makeDateStr(60 - i) });
        });

        const scores = computeEnsembleScores(records);
        const hotScore = scores.find((s) => s.number === hotNumber)!;
        const coldScore = scores.find((s) => s.number === coldNumber)!;

        expect(hotScore.ensembleScore).toBeGreaterThan(coldScore.ensembleScore);
    });

    it("drift damper reduces momentum and window scores when drift is high", () => {
        const records = makeRecordsWithHotNumber("55", 80, 0.25);

        const noDrift = computeEnsembleScores(records, {
            driftReport: { driftScore: 0, volatilityIndex: 0, affectedAreas: [], severity: "none", message: "" },
        });

        const highDrift = computeEnsembleScores(records, {
            driftReport: { driftScore: 0.9, volatilityIndex: 0.8, affectedAreas: [], severity: "high", message: "High drift" },
        });

        const noDriftTop = noDrift.find((s) => s.number === "55")!;
        const highDriftTop = highDrift.find((s) => s.number === "55")!;

        // Momentum and window scores should be lower when drift is active
        expect(highDriftTop.momentumScore).toBeLessThanOrEqual(noDriftTop.momentumScore);
        expect(highDriftTop.windowAgreement).toBeLessThanOrEqual(noDriftTop.windowAgreement);
        expect(highDriftTop.driftAdjusted).toBe(true);
        expect(noDriftTop.driftAdjusted).toBe(false);
    });

    it("returns uniform scores for insufficient data (< 10 records)", () => {
        const records = Array.from({ length: 5 }, (_, i) =>
            makeRecord({ last2: i.toString().padStart(2, "0") })
        );
        const scores = computeEnsembleScores(records);
        expect(scores.every((s) => s.ensembleScore === 50)).toBe(true);
    });

    it("sub-scores are in range [0, 100]", () => {
        const records = makeRecordsWithHotNumber("77", 50, 0.2);
        const scores = computeEnsembleScores(records);
        for (const s of scores) {
            expect(s.ensembleScore).toBeGreaterThanOrEqual(0);
            expect(s.ensembleScore).toBeLessThanOrEqual(100);
            expect(s.bayesianPrior).toBeGreaterThanOrEqual(0);
            expect(s.bayesianPrior).toBeLessThanOrEqual(100);
            expect(s.momentumScore).toBeGreaterThanOrEqual(0);
            expect(s.gapReturnScore).toBeGreaterThanOrEqual(0);
            expect(s.windowAgreement).toBeGreaterThanOrEqual(0);
        }
    });

    it("gap return is high for a number that has not appeared recently", () => {
        // Number "99" appears at the start but not in last 30 draws
        const records = [
            makeRecord({ last2: "99", drawDate: makeDateStr(60) }),
            ...Array.from({ length: 59 }, (_, i) =>
                makeRecord({ last2: (i % 90).toString().padStart(2, "0"), drawDate: makeDateStr(59 - i) })
            ),
        ];
        const scores = computeEnsembleScores(records);
        const gapScore99 = scores.find((s) => s.number === "99")!.gapReturnScore;
        expect(gapScore99).toBeGreaterThan(50);
    });

    it("respects custom ensemble weights", () => {
        const records = makeRecordsWithHotNumber("33", 60, 0.3);

        // With bayesian weight = 1.0, others = 0 — score should be purely frequency-based
        const purelyBayesian = computeEnsembleScores(records, {
            weights: { bayesian: 1.0, momentum: 0, gapReturn: 0, window: 0 },
        });

        const hotScore = purelyBayesian.find((s) => s.number === "33")!;
        // bayesianPrior should dominate ensembleScore
        expect(hotScore.ensembleScore).toBeCloseTo(hotScore.bayesianPrior, 0);
    });
});
