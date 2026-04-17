// ═══════════════════════════════════════════════
// Truth Engine — Bayesian Ensemble Scorer
// ═══════════════════════════════════════════════
// Combines multiple evidence streams into a single
// ensemble score that is more robust than any single signal.
//
// Design:
//   1. Bayesian Prior  — smoothed frequency estimate
//   2. Momentum Score  — velocity + acceleration of recent draws
//   3. Gap Return      — overdue probability boost
//   4. Window Ensemble — agreement across rolling windows
//   5. Drift Damper    — penalise when drift is active
//
// All sub-scores are normalised 0-100 before ensemble weighting.
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { DriftReport } from "./types";

export interface EnsembleScore {
    number: string;
    ensembleScore: number;  // 0-100, weighted composite
    bayesianPrior: number;  // 0-100
    momentumScore: number;  // 0-100
    gapReturnScore: number; // 0-100
    windowAgreement: number;// 0-100
    driftAdjusted: boolean;
}

export interface EnsembleWeights {
    bayesian: number;    // default 0.30
    momentum: number;   // default 0.25
    gapReturn: number;  // default 0.25
    window: number;     // default 0.20
}

export const DEFAULT_ENSEMBLE_WEIGHTS: EnsembleWeights = {
    bayesian: 0.30,
    momentum: 0.25,
    gapReturn: 0.25,
    window: 0.20,
};

// ─── Helpers ───────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, v));
}

function normalize(values: number[]): number[] {
    const max = Math.max(...values, 1e-9);
    return values.map((v) => clamp((v / max) * 100));
}

// ─── 1. Bayesian Prior (Laplace-smoothed frequency) ──

function computeBayesianPrior(
    records: DrawResultRecord[],
    windowSize?: number
): Record<string, number> {
    const pool = windowSize ? records.slice(-windowSize) : records;
    const counts: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        counts[i.toString().padStart(2, "0")] = 1; // Laplace smoothing (alpha=1)
    }

    for (const r of pool) {
        const key = r.last2.padStart(2, "0");
        counts[key] = (counts[key] ?? 1) + 1;
    }

    const total = pool.length + 100; // total + alpha*K
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(counts)) {
        scores[k] = (v / total) * 100 * 100; // scale up before normalisation
    }
    return scores;
}

// ─── 2. Momentum Score (velocity + acceleration) ──

function computeMomentumScores(records: DrawResultRecord[]): Record<string, number> {
    const recent10 = records.slice(-10);
    const recent30 = records.slice(-30);
    const momentum: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        const key = i.toString().padStart(2, "0");
        const c10 = recent10.filter((r) => r.last2 === key).length;
        const c30 = recent30.filter((r) => r.last2 === key).length;

        // Velocity: rate in recent10 vs longer window
        const velocity = c10 / 10;
        const baseRate = c30 / Math.max(30, records.length);

        // Acceleration: is it speeding up?
        const veryRecent5 = records.slice(-5).filter((r) => r.last2 === key).length;
        const acceleration = (veryRecent5 / 5) - velocity;

        // Combined momentum (velocity weighted more than acceleration)
        momentum[key] = Math.max(0, velocity * 70 + acceleration * 30 + baseRate * 10);
    }
    return momentum;
}

// ─── 3. Gap Return Score (overdue probability) ──

function computeGapReturnScores(records: DrawResultRecord[]): Record<string, number> {
    const sorted = [...records].sort(
        (a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
    );
    const scores: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        const key = i.toString().padStart(2, "0");

        // Find current gap (draws since last appearance)
        const lastSeenIdx = sorted.findIndex((r) => r.last2 === key);
        const currentGap = lastSeenIdx === -1 ? records.length : lastSeenIdx;

        // Calculate historical average gap
        const allIdxs: number[] = [];
        sorted.forEach((r, idx) => { if (r.last2 === key) allIdxs.push(idx); });

        if (allIdxs.length < 2) {
            scores[key] = Math.min(100, currentGap * 3); // Unknown — assume overdue
            continue;
        }

        const gaps: number[] = [];
        for (let j = 0; j < allIdxs.length - 1; j++) {
            gaps.push(allIdxs[j + 1] - allIdxs[j]);
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

        // How overdue is it relative to average?
        const overdueRatio = currentGap / Math.max(avgGap, 1);

        // Score peaks when current gap ≈ avgGap (due to return) and stays high if very overdue
        if (overdueRatio >= 0.8 && overdueRatio <= 1.5) {
            scores[key] = 100; // Prime return window
        } else if (overdueRatio > 1.5) {
            scores[key] = Math.max(60, 100 - (overdueRatio - 1.5) * 10); // Still high but decaying
        } else {
            scores[key] = Math.max(0, overdueRatio * 80); // Not due yet
        }
    }
    return scores;
}

// ─── 4. Window Agreement (cross-window consensus) ──

function computeWindowAgreement(records: DrawResultRecord[]): Record<string, number> {
    const windows = [10, 20, 50].map((w) => records.slice(-w));
    const agreement: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        const key = i.toString().padStart(2, "0");

        // Get rank in each window (higher count = lower rank number = better)
        const counts = windows.map((w) => w.filter((r) => r.last2 === key).length);
        const windowSizes = [10, 20, 50];
        const normalizedCounts = counts.map((c, idx) => c / windowSizes[idx]);

        // Agreement = how consistent the relative frequency is across windows
        const avg = normalizedCounts.reduce((a, b) => a + b, 0) / normalizedCounts.length;
        const variance = normalizedCounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / normalizedCounts.length;

        // High avg + low variance = strong agreement across windows
        const consistencyBonus = Math.max(0, 1 - variance * 1000);
        agreement[key] = clamp((avg * 500 + consistencyBonus * 50));
    }
    return agreement;
}

// ─── Main Ensemble Compositor ──────────────────

export function computeEnsembleScores(
    records: DrawResultRecord[],
    options?: {
        weights?: Partial<EnsembleWeights>;
        driftReport?: DriftReport;
        windowSize?: number;
    }
): EnsembleScore[] {
    if (records.length < 10) {
        // Insufficient data — return uniform
        return Array.from({ length: 100 }, (_, i) => ({
            number: i.toString().padStart(2, "0"),
            ensembleScore: 50,
            bayesianPrior: 50,
            momentumScore: 50,
            gapReturnScore: 50,
            windowAgreement: 50,
            driftAdjusted: false,
        }));
    }

    const w = { ...DEFAULT_ENSEMBLE_WEIGHTS, ...(options?.weights ?? {}) };
    const driftSeverity = options?.driftReport?.severity ?? "none";
    const isDrifting = driftSeverity === "high" || driftSeverity === "medium";

    // Compute raw sub-scores
    const bayesian = computeBayesianPrior(records, options?.windowSize);
    const momentum = computeMomentumScores(records);
    const gapReturn = computeGapReturnScores(records);
    const windowAgreement = computeWindowAgreement(records);

    // Normalise each dimension to 0-100
    const keys = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, "0"));

    const bayNorm = normalize(keys.map((k) => bayesian[k] ?? 0));
    const momNorm = normalize(keys.map((k) => momentum[k] ?? 0));
    const gapNorm = keys.map((k) => gapReturn[k] ?? 0); // already 0-100
    const winNorm = normalize(keys.map((k) => windowAgreement[k] ?? 0));

    // Drift damper: reduces momentum and window signals when drifting
    const driftMultiplier = isDrifting ? 0.6 : 1.0;

    const results: EnsembleScore[] = keys.map((key, i) => {
        const bay = bayNorm[i];
        const mom = momNorm[i] * driftMultiplier;
        const gap = gapNorm[i];
        const win = winNorm[i] * driftMultiplier;

        // Weighted ensemble
        const ensemble = clamp(
            bay * w.bayesian +
            mom * w.momentum +
            gap * w.gapReturn +
            win * w.window
        );

        return {
            number: key,
            ensembleScore: Math.round(ensemble * 10) / 10,
            bayesianPrior: Math.round(bay * 10) / 10,
            momentumScore: Math.round(mom * 10) / 10,
            gapReturnScore: Math.round(gap * 10) / 10,
            windowAgreement: Math.round(win * 10) / 10,
            driftAdjusted: isDrifting,
        };
    });

    return results.sort((a, b) => b.ensembleScore - a.ensembleScore);
}
