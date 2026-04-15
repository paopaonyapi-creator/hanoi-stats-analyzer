import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/results
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drawType = url.searchParams.get("drawType");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const last2 = url.searchParams.get("last2");
    const last3 = url.searchParams.get("last3");
    const weekday = url.searchParams.get("weekday");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
      parseInt(url.searchParams.get("pageSize") || "20", 10),
      200
    );
    const sortBy = url.searchParams.get("sortBy") || "drawDate";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Prisma.DrawResultWhereInput = {};

    if (drawType && drawType !== "ALL") {
      where.drawType = drawType as any;
    }

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

    if (last2) where.last2 = last2;
    if (last3) where.last3 = last3;
    if (weekday) where.weekday = parseInt(weekday, 10);

    if (search) {
      where.OR = [
        { resultDigits: { contains: search } },
        { resultRaw: { contains: search } },
        { last2: { contains: search } },
        { last3: { contains: search } },
      ];
    }

    // Build orderBy
    const validSortFields = [
      "drawDate",
      "drawType",
      "resultDigits",
      "last2",
      "last3",
      "createdAt",
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "drawDate";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    const [data, total] = await Promise.all([
      prisma.drawResult.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.drawResult.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Results error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch results" },
      { status: 500 }
    );
  }
}
