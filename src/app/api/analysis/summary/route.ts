import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildAnalysisSummary } from "@/lib/stats/analysis";
import type { AnalysisSummary, DrawResultRecord, DrawType } from "@/types";
import { runWalkForwardBacktest } from "@/lib/truth/backtest";
import { 
    calculateExpectedValue, 
    calculateKellyCriterion, 
    runMonteCarloSimulation 
} from "@/lib/truth/risk";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "@/lib/truth/constants";

interface RiskIntelligence {
  ev: number;
  kellyStake: number;
  backtestDelta: number;
  backtestVerdict: string;
  monteCarlo: {
    maxDrawdown: number;
    probOfLoss: number;
    medianReturn: number;
  };
}

type AnalysisSummaryResponse = AnalysisSummary & {
  riskIntelligence?: RiskIntelligence;
};

function parseDrawType(value: string | null): DrawType | "ALL" {
  if (value === "SPECIAL" || value === "NORMAL" || value === "VIP") {
    return value;
  }
  return "ALL";
}

// GET /api/analysis/summary
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = parseDrawType(url.searchParams.get("drawType"));
    const windowSize = parseInt(url.searchParams.get("window") || "0", 10);

    const where: Prisma.DrawResultWhereInput = {};
    if (drawType !== "ALL") {
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

    const summary: AnalysisSummaryResponse = buildAnalysisSummary(plainRecords);

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
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
