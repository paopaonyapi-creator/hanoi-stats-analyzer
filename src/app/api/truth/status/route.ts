import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runTruthPipeline } from '@/lib/truth/pipeline';
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from '@/lib/truth/constants';
import { analyzeCrossMarketCorrelation } from '@/lib/stats/correlation';

export async function GET() {
  try {
    // 1. Fetch recent data for global status check
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: 200,
    });

    if (allRecords.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // 2. Load Champion Weights
    const weightSetting = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    const weights = (weightSetting?.valueJson as any) || DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
    
    // 3. Run Truth Engine for "NORMAL" market to get representative stats
    const report = runTruthPipeline(allRecords.filter(r => r.drawType === 'NORMAL') as any, { 
      settings: { ...DEFAULT_TRUTH_ENGINE_SETTINGS, weights }
    });

    // 4. Calculate Market Heat (Cross-market frequency)
    const counts = new Map<string, number>();
    allRecords.forEach(r => counts.set(r.last2, (counts.get(r.last2) || 0) + 1));
    const sortedCounts = Array.from(counts.entries()).sort((a,b) => b[1] - a[1]);

    // 5. Run Correlation Intelligence (The Conductor)
    const correlation = analyzeCrossMarketCorrelation(allRecords as any);

    return NextResponse.json({
      systemHealth: {
        integrity: report.integrityReport.score,
        integrityLevel: report.integrityReport.level,
        driftScore: report.driftReport.driftScore,
        driftSeverity: report.driftReport.severity,
        verdict: report.realityVerdict.verdict
      },
      intelligence: {
        championWeights: weights,
        averageDelta: report.backtestSummary.averageDelta,
        backtestVerdict: report.backtestSummary.verdict,
        generatedAt: report.generatedAt
      },
      marketPulse: {
        topGlobalNumbers: sortedCounts.slice(0, 5).map(([num, count]) => ({ num, count })),
        lastSync: allRecords[0]?.drawDate,
        correlation
      }
    });

  } catch (err: any) {
    console.error("Truth Status API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
