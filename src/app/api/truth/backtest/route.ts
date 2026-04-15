// ═══════════════════════════════════════════════
// API: /api/truth/backtest
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWalkForwardBacktest } from "@/lib/truth/backtest";
import type { DrawResultRecord } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const drawType = searchParams.get("drawType");
    const topKStr = searchParams.get("topK");
    const topK = topKStr ? parseInt(topKStr) : 10;

    const where: any = {};
    if (drawType && drawType !== "ALL") {
      where.drawType = drawType;
    }

    const records = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "asc" },
    });

    const result = runWalkForwardBacktest(records as unknown as DrawResultRecord[], {
      topK,
      drawType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to run backtest" },
      { status: 500 }
    );
  }
}
