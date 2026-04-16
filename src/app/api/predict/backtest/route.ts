import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';
import { runWalkForwardBacktest } from '@/lib/truth/backtest';
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from '@/lib/truth/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = (searchParams.get('type') || 'NORMAL') as DrawType;
    const period = parseInt(searchParams.get('period') || '30');
    
    // Pillar-based weights (sent from UI) or full weights
    const weightsParam = searchParams.get('weights');
    let weights = DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
    
    if (weightsParam) {
        try {
            const customWeights = JSON.parse(weightsParam);
            weights = { ...weights, ...customWeights };
        } catch (e) {}
    }

    // Fetch pool for target market
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: period + 250, 
    });

    const targetPool = allRecords.filter(r => r.drawType === typeStr);

    if (targetPool.length < period + 10) {
      return NextResponse.json({ error: 'Insufficient data for simulation in this market' }, { status: 400 });
    }

    // Run the professional Truth Walk-Forward Backtest engine
    const backtestSummary = runWalkForwardBacktest(targetPool as any, {
      settings: { 
          ...DEFAULT_TRUTH_ENGINE_SETTINGS, 
          weights
      },
      testSize: 1, // Traditional one-by-one testing
      stepSize: 1,
      trainMinSize: targetPool.length - period
    });

    return NextResponse.json({
      type: typeStr,
      totalFolds: backtestSummary.totalFolds,
      averageHitRate: parseFloat((backtestSummary.averageHitRate * 100).toFixed(2)),
      averageBaseline: parseFloat((backtestSummary.averageBaseline * 100).toFixed(2)),
      averageDelta: backtestSummary.averageDelta,
      verdict: backtestSummary.verdict,
      message: backtestSummary.message,
      folds: backtestSummary.folds.map(f => ({
          fold: f.foldIndex,
          hitRate: f.hitRate,
          delta: f.delta
      }))
    });

  } catch (err: any) {
    console.error("Advanced Backtest API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
