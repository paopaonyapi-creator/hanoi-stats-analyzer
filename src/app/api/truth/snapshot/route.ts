// ═══════════════════════════════════════════════
// API: /api/truth/snapshot
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTruthPipeline } from "@/lib/truth/pipeline";
import {
  saveAnalysisSnapshot,
  saveTrendScoreSnapshot,
  saveBacktestRun,
  logEngineEvent,
  getLatestSnapshot,
} from "@/lib/truth/snapshots";
import type { DrawResultRecord } from "@/types";

export async function GET() {
  try {
    const snapshot = await getLatestSnapshot(prisma as any);
    if (!snapshot) {
      return NextResponse.json({ snapshot: null, message: "ยังไม่มี snapshot" });
    }
    return NextResponse.json({ snapshot });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get snapshot" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const records = await prisma.drawResult.findMany({
      orderBy: { drawDate: "asc" },
    });

    const result = runTruthPipeline(records as unknown as DrawResultRecord[]);

    // Save analysis snapshot
    await saveAnalysisSnapshot(prisma as any, {
      datasetSize: result.datasetFeatures.totalRecords,
      integrityScore: result.integrityReport.score,
      integrityLevel: result.integrityReport.level,
      summaryJson: {
        scores: result.truthScores.slice(0, 20).map((s) => ({
          number: s.number,
          trend: s.trendScore,
          confidence: s.confidenceScore,
          label: s.label,
        })),
        baseline: result.baselineComparison,
        verdict: result.realityVerdict.verdict,
      },
    });

    // Save trend score snapshot
    await saveTrendScoreSnapshot(prisma as any, {
      windowType: "all",
      trendScoreJson: result.truthScores.map((s) => ({
        number: s.number,
        trend: s.trendScore,
      })),
      confidenceJson: result.truthScores.map((s) => ({
        number: s.number,
        confidence: s.confidenceScore,
      })),
      evidenceJson: result.truthScores.map((s) => ({
        number: s.number,
        evidence: s.evidenceStrength,
        label: s.label,
      })),
      verdictJson: { verdict: result.realityVerdict },
    });

    // Save backtest run
    if (result.backtestSummary.totalFolds > 0) {
      await saveBacktestRun(prisma as any, {
        windowType: "all",
        configJson: { topK: 10, trainMinSize: 60, testSize: 1 },
        resultJson: result.backtestSummary,
        baselineDelta: result.baselineComparison.delta,
        calibrationJson: result.backtestSummary.calibrationBuckets,
        driftJson: result.driftReport,
        verdict: result.backtestSummary.verdict,
      });
    }

    // Log event
    await logEngineEvent(prisma as any, "snapshot_created", "info", {
      datasetSize: result.datasetFeatures.totalRecords,
      verdict: result.realityVerdict.verdict,
    });

    return NextResponse.json({
      success: true,
      verdict: result.realityVerdict.verdict,
      datasetSize: result.datasetFeatures.totalRecords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
