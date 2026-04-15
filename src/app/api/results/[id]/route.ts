import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/results/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.drawResult.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    // Get previous and next records
    const [prev, next] = await Promise.all([
      prisma.drawResult.findFirst({
        where: {
          drawType: record.drawType,
          drawDate: { lt: record.drawDate },
        },
        orderBy: { drawDate: "desc" },
        select: { id: true, drawDate: true, resultDigits: true },
      }),
      prisma.drawResult.findFirst({
        where: {
          drawType: record.drawType,
          drawDate: { gt: record.drawDate },
        },
        orderBy: { drawDate: "asc" },
        select: { id: true, drawDate: true, resultDigits: true },
      }),
    ]);

    // Get same-day records
    const sameDayRecords = await prisma.drawResult.findMany({
      where: {
        drawDate: record.drawDate,
        id: { not: record.id },
      },
      orderBy: { drawType: "asc" },
    });

    return NextResponse.json({
      record,
      prev,
      next,
      sameDayRecords,
    });
  } catch (error: any) {
    console.error("Detail error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch record" },
      { status: 500 }
    );
  }
}
