import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/export/json
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = url.searchParams.get("drawType");

    const where: any = {};
    if (drawType && drawType !== "ALL") {
      where.drawType = drawType;
    }

    const records = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "asc" },
    });

    return new NextResponse(JSON.stringify(records, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="hanoi-export-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Export failed" },
      { status: 500 }
    );
  }
}
