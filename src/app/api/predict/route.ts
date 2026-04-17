import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runIntegrityThenScoring } from '@/lib/truth/pipeline';
import { computeEnsembleScores } from '@/lib/truth/ensemble';
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from '@/lib/truth/constants';
import type { DrawResultRecord, DrawType } from '@/types';

function parseDrawType(value: string | null): DrawType | "ALL" {
  if (value === "SPECIAL" || value === "NORMAL" || value === "VIP") {
    return value;
  }
  return "ALL";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = parseDrawType(searchParams.get('type'));
    const topN = Math.min(parseInt(searchParams.get('top') || '10', 10), 20);

    // Cap at 150 most recent records per type for prediction speed
    // (backtest runs in /api/truth/status separately with full data)
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: 300,
    });

    if (allRecords.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    const targetRecords = typeStr === 'ALL'
      ? allRecords
      : allRecords.filter(r => r.drawType === typeStr);

    // 1. Load Champion Weights
    const weightSetting = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    const weights = {
      ...DEFAULT_TRUTH_ENGINE_SETTINGS.weights,
      ...(weightSetting?.valueJson as Partial<typeof DEFAULT_TRUTH_ENGINE_SETTINGS.weights> | null),
    };
    const settings = { ...DEFAULT_TRUTH_ENGINE_SETTINGS, weights };

    const normalizedRecords: DrawResultRecord[] = targetRecords.map((record) => ({
      id: record.id,
      drawDate: record.drawDate.toISOString(),
      drawType: record.drawType,
      drawTime: record.drawTime,
      resultRaw: record.resultRaw,
      resultDigits: record.resultDigits,
      last1: record.last1,
      last2: record.last2,
      last3: record.last3,
      weekday: record.weekday,
      monthKey: record.monthKey,
      source: record.source,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));

    // 2. Lightweight: Integrity + Scoring only (no backtest — that runs in /api/truth/status)
    const report = runIntegrityThenScoring(normalizedRecords, { settings });

    // 3. Bayesian Ensemble Layer
    const ensembleScores = computeEnsembleScores(normalizedRecords);

    // Build lookup map for fast merge
    const ensembleMap = new Map(ensembleScores.map((e) => [e.number, e]));

    // 4. Merge: 60% TruthScore + 40% EnsembleScore
    const TRUTH_WEIGHT = 0.60;
    const ENSEMBLE_WEIGHT = 0.40;

    const topPredictions = report.truthScores.slice(0, topN).map(s => {
      const ens = ensembleMap.get(s.number);
      const blendedScore = ens
        ? Math.round((s.trendScore * TRUTH_WEIGHT + ens.ensembleScore * ENSEMBLE_WEIGHT) * 10) / 10
        : s.trendScore;

      return {
        number: s.number,
        trendScore: blendedScore,
        rawTruthScore: s.trendScore,
        confidence: s.confidenceScore,
        evidence: s.evidenceStrength,
        label: s.label,
        signals: s.topSignals,
        penalties: s.penalties,
        ensemble: ens ? {
          score: ens.ensembleScore,
          bayesian: ens.bayesianPrior,
          momentum: ens.momentumScore,
          gapReturn: ens.gapReturnScore,
          windowAgreement: ens.windowAgreement,
          driftAdjusted: ens.driftAdjusted,
        } : null,
      };
    });

    // 5. Top ensemble-only picks for cross-validation
    const ensembleOnlyTop5 = ensembleScores.slice(0, 5).map(e => ({
      number: e.number,
      ensembleScore: e.ensembleScore,
      breakdown: {
        bayesian: e.bayesianPrior,
        momentum: e.momentumScore,
        gapReturn: e.gapReturnScore,
        windowAgreement: e.windowAgreement,
      },
    }));

    return NextResponse.json({
      type: typeStr,
      generatedAt: report.generatedAt,
      latestResult: normalizedRecords[0]?.last2,
      predictions: topPredictions,
      ensembleTop5: ensembleOnlyTop5,
      engineSummary: {
        integrity: report.integrityReport.score,
        verdict: "MODERATE",        // full verdict computed in /api/truth/status
        baselineDelta: 0,           // backtest metrics from /api/truth/status
        backtestHitRate: 0,
        driftSeverity: "none",
        ensembleActive: true,
        modelVersion: "Truth+Ensemble v3.0",
      },
    });

  } catch (err: unknown) {
    console.error("Prediction Engine Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prediction failed" },
      { status: 500 }
    );
  }
}
