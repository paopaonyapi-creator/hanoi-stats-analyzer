// ═══════════════════════════════════════════════
// API: /api/truth/reality
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTruthPipeline } from "@/lib/truth/pipeline";
import type { DrawResultRecord } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const drawType = searchParams.get("drawType");

    const where: any = {};
    if (drawType && drawType !== "ALL") {
      where.drawType = drawType;
    }

    const records = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "asc" },
    });

    const result = runTruthPipeline(records as unknown as DrawResultRecord[], {
      drawType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to run truth pipeline" },
      { status: 500 }
    );
  }
}
