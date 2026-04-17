import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const DRAW_TYPE_LABELS: Record<string, string> = {
  SPECIAL: "ฮานอยพิเศษ",
  NORMAL: "ฮานอยปกติ",
  VIP: "ฮานอยวีไอพี",
};

const WEEKDAY_LABELS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = url.searchParams.get("drawType");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const where: Prisma.DrawResultWhereInput = {};
    if (drawType && drawType !== "ALL") where.drawType = drawType as any;
    if (dateFrom) {
      where.drawDate = {
        ...((where.drawDate as Prisma.DateTimeFilter) || {}),
        gte: new Date(dateFrom),
      };
    }
    if (dateTo) {
      where.drawDate = {
        ...((where.drawDate as Prisma.DateTimeFilter) || {}),
        lte: new Date(dateTo + "T23:59:59.999Z"),
      };
    }

    const draws = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: "desc" },
      take: 10_000, // Safety cap to prevent OOM
    });

    // CSV headers
    const headers = [
      "Date",
      "Type",
      "TypeTH",
      "Time",
      "Full Result",
      "Last 1",
      "Last 2",
      "Last 3",
      "Weekday",
      "WeekdayTH",
      "MonthKey",
      "Source",
    ];

    // Format rows — escape fields that may contain commas
    const escapeField = (v: string | number) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = draws.map((d) => [
      d.drawDate.toISOString().split("T")[0],
      d.drawType,
      DRAW_TYPE_LABELS[d.drawType] ?? d.drawType,
      d.drawTime ?? "",
      d.resultDigits,
      d.last1,
      d.last2,
      d.last3,
      d.weekday,
      WEEKDAY_LABELS[d.weekday] ?? "",
      d.monthKey,
      d.source ?? "N/A",
    ].map(escapeField));

    // BOM + CSV for Thai Excel compatibility
    const BOM = "\uFEFF";
    const csvContent = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const today = new Date().toISOString().split("T")[0];
    const filename = `hanoi_stats_${today}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Total-Records": String(draws.length),
      },
    });
  } catch (err: unknown) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
