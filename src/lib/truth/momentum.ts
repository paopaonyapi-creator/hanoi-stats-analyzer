import { ALL_NUMBERS_00_99 } from "./constants";
import { DrawResult } from "@prisma/client";

export interface NumericalMomentum {
  number: string;
  velocity: number;      // Recent Freq / All-Time Freq
  acceleration: number;  // 3-day Freq change relative to 30-day
  compositeScore: number;
  streak: number;        // Consecutive days appeared
  isHeatingUp: boolean;
  marketShare: number;   // Percentage of total draws this number occupies
}

/**
 * Calculates momentum for all 100 digits.
 */
export function calculateNumericalMomentum(
  records: DrawResult[], 
  options: { 
      recentWindow: number; 
      momentumWindow: number; 
  } = { recentWindow: 10, momentumWindow: 3 }
): Record<string, NumericalMomentum> {
  const momentumMap: Record<string, NumericalMomentum> = {};
  const totalCount = records.length;
  
  // 1. Calculate Baselines
  const freqMap = new Map<string, number>();
  records.forEach(r => freqMap.set(r.last2, (freqMap.get(r.last2) || 0) + 1));

  // 2. Calculate Recent Window (Velocity)
  const recentRecords = records.slice(0, options.recentWindow);
  const recentFreqMap = new Map<string, number>();
  recentRecords.forEach(r => recentFreqMap.set(r.last2, (recentFreqMap.get(r.last2) || 0) + 1));

  // 3. Calculate Micro Window (Acceleration)
  const microRecords = records.slice(0, options.momentumWindow);
  const microFreqMap = new Map<string, number>();
  microRecords.forEach(r => microFreqMap.set(r.last2, (microFreqMap.get(r.last2) || 0) + 1));

  // 4. Compute Metrics for all 100 digits
  ALL_NUMBERS_00_99.forEach((num) => {
    const totalFreq = freqMap.get(num) || 0;
    const recentFreq = recentFreqMap.get(num) || 0;
    const microFreq = microFreqMap.get(num) || 0;

    const baselineProb = totalFreq / totalCount || 0.01; // Avoid divide by zero
    const recentProb = recentFreq / options.recentWindow;
    const microProb = microProb / options.momentumWindow;

    // Velocity: How much more frequent is it now than historical?
    const velocity = (recentProb / baselineProb);

    // Acceleration: Is it appearing even faster in the last 3 days?
    const acceleration = (microProb / (recentProb || 0.01));

    // Composite: Combine for a single "Heat" score
    const compositeScore = (velocity * 0.7) + (acceleration * 0.3);

    // Calculate Streak (how many consecutive draws ago was it seen?)
    let streak = 0;
    for (let i = 0; i < records.length; i++) {
        if (records[i].last2 === num) streak++;
        else if (i > 0) break; // Break only if it didn't appear today or immediately before
    }

    momentumMap[num] = {
      number: num,
      velocity: parseFloat(velocity.toFixed(2)),
      acceleration: parseFloat(acceleration.toFixed(2)),
      compositeScore: parseFloat(compositeScore.toFixed(2)),
      streak,
      isHeatingUp: acceleration > 1.2 && velocity > 1.0,
      marketShare: parseFloat(((totalFreq / totalCount) * 100).toFixed(1))
    };
  });

  return momentumMap;
}

/**
 * Aggregates momentum across multiple markets to find correlations.
 */
export function aggregateCrossMarketMomentum(
    marketData: Record<string, Record<string, NumericalMomentum>>
): Record<string, { totalHeat: number; marketsHot: string[] }> {
    const aggregate: Record<string, { totalHeat: number; marketsHot: string[] }> = {};
    
    ALL_NUMBERS_00_99.forEach(num => {
        let totalHeat = 0;
        const marketsHot: string[] = [];
        
        Object.entries(marketData).forEach(([market, momentumMap]) => {
            const m = momentumMap[num];
            if (m && m.compositeScore > 1.2) {
                totalHeat += m.compositeScore;
                marketsHot.push(market);
            }
        });
        
        aggregate[num] = { totalHeat, marketsHot };
    });
    
    return aggregate;
}
