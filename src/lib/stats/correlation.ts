import { DrawResultRecord } from "@/types";

export interface CorrelationPulse {
    syncScore: number; // 0..1
    verdict: 'LOW' | 'MEDIUM' | 'HIGH';
    leadingMarket: string | null;
    commonDigits: string[];
    isLeadLagDetected: boolean;
}

/**
 * Orchestrates cross-market correlation intelligence.
 */
export function analyzeCrossMarketCorrelation(records: DrawResultRecord[]): CorrelationPulse {
    // 1. Group records by date
    const byDate: Record<string, any> = {};
    records.forEach(r => {
        const dateString = typeof r.drawDate === 'string' ? r.drawDate : new Date(r.drawDate).toISOString();
        const date = dateString.slice(0, 10);
        if (!byDate[date]) byDate[date] = { SPECIAL: null, NORMAL: null, VIP: null };
        byDate[date][r.drawType] = r;
    });

    const dates = Object.keys(byDate).sort().reverse().slice(1, 31); // Last 30 complete days
    if (dates.length < 5) {
        return { syncScore: 0, verdict: 'LOW', leadingMarket: null, commonDigits: [], isLeadLagDetected: false };
    }

    let totalSync = 0;
    let leadHits = 0;
    const digitCounts: Record<string, number> = {};

    dates.forEach(date => {
        const day = byDate[date];
        if (day.SPECIAL && day.NORMAL && day.VIP) {
            // Check for common digits in Last 2
            const d1 = day.SPECIAL.last2.split('');
            const d2 = day.NORMAL.last2.split('');
            const d3 = day.VIP.last2.split('');
            
            const common = d1.filter((x: string) => d2.includes(x) || d3.includes(x));
            if (common.length > 0) totalSync += 0.5;
            if (d1.some((x: string) => d2.includes(x) && d3.includes(x))) totalSync += 0.5;

            // Lead-Lag Analysis (Does Special influence Normal on the same day?)
            // We check if any digit from Special appears in Normal or VIP
            if (d1.some((x: string) => d2.includes(x))) leadHits++;

            // Global digit frequency for this window
            [...d1, ...d2, ...d3].forEach(d => {
                digitCounts[d] = (digitCounts[d] || 0) + 1;
            });
        }
    });

    const syncScore = Math.min(totalSync / dates.length, 1);
    const leadLagRate = leadHits / dates.length;
    
    const topDigits = Object.entries(digitCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d]) => d);

    let verdict: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (syncScore > 0.6) verdict = 'HIGH';
    else if (syncScore > 0.3) verdict = 'MEDIUM';

    return {
        syncScore,
        verdict,
        leadingMarket: leadLagRate > 0.4 ? 'SPECIAL' : null,
        commonDigits: topDigits,
        isLeadLagDetected: leadLagRate > 0.5
    };
}
