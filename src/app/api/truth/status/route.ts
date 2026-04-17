import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runIntegrityThenScoring, runBacktestRefresh } from '@/lib/truth/pipeline';
import { detectDrift } from '@/lib/truth/drift';
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from '@/lib/truth/constants';
import { analyzeCrossMarketCorrelation } from '@/lib/stats/correlation';
import type { DrawResultRecord } from '@/types';
import type { DriftReport } from '@/lib/truth/types';

export async function GET() {
  try {
    // 1. Fetch recent data — cap at 150 for speed
    const rawRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: 150,
    });

    if (rawRecords.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // 2. Load Champion Weights
    const weightSetting = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    const weights = (weightSetting?.valueJson as any) || DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
    const settings = { ...DEFAULT_TRUTH_ENGINE_SETTINGS, weights };

    // Normalize
    const allRecords: DrawResultRecord[] = rawRecords.map(r => ({
      id: r.id,
      drawDate: r.drawDate.toISOString(),
      drawType: r.drawType,
      drawTime: r.drawTime,
      resultRaw: r.resultRaw,
      resultDigits: r.resultDigits,
      last1: r.last1,
      last2: r.last2,
      last3: r.last3,
      weekday: r.weekday,
      monthKey: r.monthKey,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const normalRecords = allRecords.filter(r => r.drawType === 'NORMAL');

    // 3. Lightweight scoring (integrity + scoring only — no backtest inside)
    const report = runIntegrityThenScoring(normalRecords, { settings });

    // 4. Backtest on limited window (last 80 records only)
    const backtestRecords = normalRecords.slice(0, 80);
    const backtestSummary = backtestRecords.length >= 30
      ? runBacktestRefresh(backtestRecords, { settings, topK: 10 })
      : {
        averageDelta: 0,
        averageHitRate: 0,
        verdict: 'NO_RELIABLE_EDGE' as const,
        averageBaseline: 0.1,
        folds: [],
        totalFolds: 0,
        calibrationBuckets: [],
        insufficientData: true,
        message: 'Insufficient data',
      };

    // 5. Drift detection
    const sorted = [...normalRecords].sort(
      (a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
    );
    let driftReport: DriftReport = {
      driftScore: 0,
      volatilityIndex: 0,
      affectedAreas: [],
      severity: 'none',
      message: 'Insufficient data',
    };
    if (sorted.length >= 40) {
      const split = Math.floor(sorted.length * 0.6);
      driftReport = detectDrift(sorted.slice(0, split), sorted.slice(split));
    }

    // 6. Market Heat
    const counts = new Map<string, number>();
    allRecords.forEach(r => counts.set(r.last2, (counts.get(r.last2) || 0) + 1));
    const sortedCounts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    // 7. Correlation (The Conductor)
    const correlation = analyzeCrossMarketCorrelation(allRecords as any);

    return NextResponse.json({
      systemHealth: {
        integrity: report.integrityReport.score,
        integrityLevel: report.integrityReport.level,
        driftScore: driftReport.driftScore,
        driftSeverity: driftReport.severity,
        verdict: backtestSummary.verdict,
      },
      intelligence: {
        championWeights: weights,
        averageDelta: backtestSummary.averageDelta,
        backtestVerdict: backtestSummary.verdict,
        generatedAt: report.generatedAt,
      },
      marketPulse: {
        topGlobalNumbers: sortedCounts.slice(0, 5).map(([num, count]) => ({ num, count })),
        lastSync: rawRecords[0]?.drawDate,
        correlation,
      },
    });

  } catch (err: any) {
    console.error("Truth Status API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
