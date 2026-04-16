// ═══════════════════════════════════════════════
// Truth Engine — Risk & Financial Intelligence
// ═══════════════════════════════════════════════

/**
 * Calculates the Kelly Criterion recommended stake.
 * Formula: f* = (bp - q) / b
 * @param winProbability (p) - The detected hit rate (0..1)
 * @param winRatio (b) - Net odds (e.g. 1:90 means b=89)
 */
export function calculateKellyCriterion(winProbability: number, winRatio: number = 89): number {
    const p = winProbability;
    const q = 1 - p;
    const b = winRatio;

    if (b <= 0) return 0;
    
    const fraction = (b * p - q) / b;
    
    // Return fraction, clamped between 0 and 0.25 (Quarter-Kelly is safer)
    return Math.max(0, Math.min(fraction, 0.25));
}

export interface MonteCarloResult {
    simulations: number[][]; // Each array is a cumulative return path
    expectedValue: number;
    maxDrawdown: number;
    probabilityOfLoss: number;
    medianReturn: number;
}

/**
 * Runs a Monte Carlo simulation of betting outcomes.
 * @param winProbability - Base probability of win
 * @param dailyBets - Number of bets per "Day" (usually 1 if betting Top 3 as a single unit)
 * @param iterations - Number of independent paths to simulate
 * @param days - Time horizon
 */
export function runMonteCarloSimulation(
    winProbability: number,
    winRatio: number = 89,
    iterations: number = 500,
    days: number = 30
): MonteCarloResult {
    const paths: number[][] = [];
    
    for (let i = 0; i < iterations; i++) {
        const path = [100]; // Start with 100% bankroll
        let current = 100;
        
        for (let d = 0; d < days; d++) {
            const win = Math.random() < winProbability;
            if (win) {
                current += winRatio; // Simplified: win ratio
            } else {
                current -= 1; // Lost 1 unit
            }
            path.push(current);
        }
        paths.push(path);
    }

    // Calculate metrics
    const finalValues = paths.map(p => p[p.length - 1]);
    const expectedValue = finalValues.reduce((a, b) => a + b, 0) / iterations - 100;
    
    let totalMaxDrawdown = 0;
    paths.forEach(path => {
        let maxVal = 100;
        let maxDD = 0;
        for (const val of path) {
            if (val > maxVal) maxVal = val;
            const dd = (maxVal - val) / maxVal;
            if (dd > maxDD) maxDD = dd;
        }
        totalMaxDrawdown += maxDD;
    });

    const medianReturn = finalValues.sort((a, b) => a - b)[Math.floor(iterations / 2)] - 100;
    const probabilityOfLoss = finalValues.filter(v => v < 100).length / iterations;

    return {
        simulations: paths.slice(0, 10), // Keep 10 paths for preview
        expectedValue,
        maxDrawdown: totalMaxDrawdown / iterations,
        probabilityOfLoss,
        medianReturn
    };
}

/**
 * Calculates Expected Value (EV) per unit wagered.
 */
export function calculateExpectedValue(winProbability: number, winRatio: number = 89): number {
    const winAmount = winRatio;
    const lossAmount = 1;
    return (winProbability * winAmount) - ((1 - winProbability) * lossAmount);
}
