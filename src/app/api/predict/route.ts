import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';
import { runTruthPipeline } from '@/lib/truth/pipeline';
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from '@/lib/truth/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = searchParams.get('type') || 'NORMAL';
    const limit = parseInt(searchParams.get('limit') || '150');
    
    // 1. Fetch data for analysis
    // We fetch ALL records to allow for multi-market correlation calculation
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: 500, // Large enough sample for cross-market intelligence
    });

    if (allRecords.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // Filter target records for the specific type
    const targetRecords = typeStr === 'ALL' 
      ? allRecords 
      : allRecords.filter(r => r.drawType === typeStr);

    // 2. Load Champion Weights from Settings
    const weightSetting = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    const weights = (weightSetting?.valueJson as any) || DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
    
    const settings = {
        ...DEFAULT_TRUTH_ENGINE_SETTINGS,
        weights
    };

    // 3. Execution: Run the Full Truth Pipeline
    const report = runTruthPipeline(targetRecords as any, { 
      settings,
      drawType: typeStr
    });

    // 4. Extract Top Predictions (Numerical High-Density)
    const topPredictions = report.truthScores.slice(0, 10).map(s => ({
        number: s.number,
        trendScore: s.trendScore,
        confidence: s.confidenceScore,
        evidence: s.evidenceStrength,
        label: s.label,
        signals: s.topSignals,
        penalties: s.penalties
    }));

    return NextResponse.json({
      type: typeStr,
      generatedAt: report.generatedAt,
      latestResult: targetRecords[0]?.last2,
      predictions: topPredictions,
      engineSummary: {
          integrity: report.integrityReport.score,
          verdict: report.realityVerdict.verdict,
          baselineDelta: report.baselineComparison.delta,
          backtestHitRate: report.backtestSummary.averageHitRate,
          driftSeverity: report.driftReport.severity
      },
      driftReport: report.driftReport
    });

  } catch (err: any) {
    console.error("Prediction Engine Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
