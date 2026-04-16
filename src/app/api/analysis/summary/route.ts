import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAnalysisSummary } from "@/lib/stats/analysis";
import type { DrawResultRecord } from "@/types";
import { runWalkForwardBacktest } from "@/lib/truth/backtest";
import { 
    calculateExpectedValue, 
    calculateKellyCriterion, 
    runMonteCarloSimulation 
} from "@/lib/truth/risk";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "@/lib/truth/constants";

// GET /api/analysis/summary
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = url.searchParams.get("drawType");
    const windowSize = parseInt(url.searchParams.get("window") || "0", 10);

    const where: any = {};
    if (drawType && drawType !== "ALL") {
      where.drawType = drawType;
    }

    let records = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "asc" },
    });

    // Apply window
    if (windowSize > 0 && windowSize < records.length) {
      records = records.slice(-windowSize);
    }

    // Convert to plain objects
    const plainRecords: DrawResultRecord[] = records.map((r) => ({
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

    const summary = buildAnalysisSummary(plainRecords) as any;

    // ── INTEGRATE RISK INTELLIGENCE ──
    if (plainRecords.length >= 40) {
        const backtest = runWalkForwardBacktest(plainRecords, {
            settings: DEFAULT_TRUTH_ENGINE_SETTINGS,
            drawType: drawType || 'ALL'
        });
        
        const winProb = backtest.averageHitRate;
        const ev = calculateExpectedValue(winProb);
        const kelly = calculateKellyCriterion(winProb);
        const monteCarlo = runMonteCarloSimulation(winProb);

        summary.riskIntelligence = {
            ev,
            kellyStake: kelly,
            backtestDelta: backtest.averageDelta,
            backtestVerdict: backtest.verdict,
            monteCarlo: {
                maxDrawdown: monteCarlo.maxDrawdown,
                probOfLoss: monteCarlo.probabilityOfLoss,
                medianReturn: monteCarlo.medianReturn
            }
        };
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error?.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
