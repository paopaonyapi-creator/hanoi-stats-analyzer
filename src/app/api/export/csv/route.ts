import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/export/csv
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

    // Build CSV
    const headers = [
      "date",
      "type",
      "time",
      "result",
      "last2",
      "last3",
      "weekday",
    ];
    const rows = records.map((r) =>
      [
        r.drawDate.toISOString().split("T")[0],
        r.drawType,
        r.drawTime || "",
        r.resultDigits,
        r.last2,
        r.last3,
        r.weekday,
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hanoi-export-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Export failed" },
      { status: 500 }
    );
  }
}
