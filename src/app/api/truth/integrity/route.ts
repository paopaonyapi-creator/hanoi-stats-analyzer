// ═══════════════════════════════════════════════
// API: /api/truth/integrity
// ═══════════════════════════════════════════════

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeIntegrityReport } from "@/lib/truth/integrity";
import type { DrawResultRecord } from "@/types";

export async function GET() {
  try {
    const records = await prisma.drawResult.findMany({
      orderBy: { drawDate: "asc" },
    });

    const report = computeIntegrityReport(records as unknown as DrawResultRecord[]);

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compute integrity" },
      { status: 500 }
    );
  }
}
