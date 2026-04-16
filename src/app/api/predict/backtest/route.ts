import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';
import { runBacktest } from '@/lib/truth/backtest';
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

    // Fetch pool for target market AND full records for correlation analysis
    // We need period + deep lookback (e.g. 200) for stable backtesting
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: period + 250, // Enough for 100-day backtest + 100 historical lookback + buffers
    });

    const targetPool = allRecords.filter(r => r.drawType === typeStr);

    if (targetPool.length < period + 10) {
      return NextResponse.json({ error: 'Insufficient data for simulation in this market' }, { status: 400 });
    }

    // Run the professional Truth Backtest engine
    const backtestResult = runBacktest(targetPool as any, {
      settings: { 
          ...DEFAULT_TRUTH_ENGINE_SETTINGS, 
          weights,
          backtestLookback: period 
      },
      allRecords: allRecords as any
    });

    return NextResponse.json({
      type: typeStr,
      period: backtestResult.totalDraws,
      hitRate: parseFloat((backtestResult.hitRate * 100).toFixed(2)),
      totalHits: backtestResult.hits,
      averageDelta: backtestResult.averageDelta,
      verdict: backtestResult.verdict,
      results: backtestResult.results.map(r => ({
          date: r.date,
          actual: r.actual,
          predicted: r.predicted.map(p => p.number),
          isHit: r.isHit,
          edgeDelta: r.edgeDelta
      }))
    });

  } catch (err: any) {
    console.error("Advanced Backtest API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
