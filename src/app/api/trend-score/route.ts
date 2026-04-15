import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTrendScores } from "@/lib/scoring/score";
import { explainTrendScore } from "@/lib/scoring/explain";
import { getDefaultWeights } from "@/lib/scoring/defaults";
import type { DrawResultRecord, ScoreWeights } from "@/types";
import { safeParseJson } from "@/lib/utils";

// GET /api/trend-score
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = url.searchParams.get("drawType");
    const windowSize = parseInt(url.searchParams.get("window") || "0", 10);
    const explainNum = url.searchParams.get("explain");
    const topN = parseInt(url.searchParams.get("topN") || "0", 10);

    // Get current weights from settings
    let weights: ScoreWeights = getDefaultWeights();
    try {
      const setting = await prisma.appSetting.findUnique({
        where: { key: "scoreWeights" },
      });
      if (setting) {
        weights = safeParseJson(setting.valueJson, weights);
      }
    } catch {
      // Use defaults
    }

    // Fetch records
    const where: any = {};
    if (drawType && drawType !== "ALL") {
      where.drawType = drawType;
    }

    const records = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "asc" },
    });

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

    const currentWeekday = new Date().getDay();
    const scores = calculateTrendScores(
      plainRecords,
      weights,
      windowSize > 0 ? windowSize : undefined,
      currentWeekday
    );

    // If explaining a specific number
    if (explainNum) {
      const scoreEntry = scores.find((s) => s.number === explainNum);
      if (!scoreEntry) {
        return NextResponse.json(
          { error: `Number ${explainNum} not found` },
          { status: 404 }
        );
      }
      const explanation = explainTrendScore(scoreEntry, weights);
      return NextResponse.json({ explanation, weights });
    }

    // Return all or top N
    const resultScores = topN > 0 ? scores.slice(0, topN) : scores;

    return NextResponse.json({
      scores: resultScores,
      totalRecords: plainRecords.length,
      weights,
      windowSize: windowSize || plainRecords.length,
    });
  } catch (error: any) {
    console.error("Trend score error:", error);
    return NextResponse.json(
      { error: error?.message || "Trend score calculation failed" },
      { status: 500 }
    );
  }
}
