import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDrawType, extractDigits, parseDrawDate, lastN, getMonthKey } from "@/lib/csv/normalize";

// POST /api/import
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rows, fileName } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided" },
        { status: 400 }
      );
    }

    let importedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const drawType = normalizeDrawType(row.type);
        if (!drawType) {
          errors.push({ row: i + 1, reason: `Invalid type: ${row.type}` });
          errorRows++;
          continue;
        }

        const date = parseDrawDate(row.date);
        if (!date) {
          errors.push({ row: i + 1, reason: `Invalid date: ${row.date}` });
          errorRows++;
          continue;
        }

        const digits = extractDigits(row.result);
        if (!digits || digits.length < 2) {
          errors.push({ row: i + 1, reason: `Invalid result: ${row.result}` });
          errorRows++;
          continue;
        }

        const l1 = lastN(digits, 1);
        const l2 = lastN(digits, 2);
        const l3 = lastN(digits, 3);

        // Check for duplicate
        const existing = await prisma.drawResult.findFirst({
          where: {
            drawDate: date,
            drawType: drawType,
            resultDigits: digits,
          },
        });

        if (existing) {
          skippedRows++;
          continue;
        }

        await prisma.drawResult.create({
          data: {
            drawDate: date,
            drawType: drawType,
            drawTime: row.time || null,
            resultRaw: row.result,
            resultDigits: digits,
            last1: l1,
            last2: l2,
            last3: l3,
            weekday: date.getDay(),
            monthKey: getMonthKey(date),
            source: "csv-import",
          },
        });
        importedRows++;
      } catch (err: any) {
        if (err?.code === "P2002") {
          skippedRows++;
        } else {
          errors.push({ row: i + 1, reason: err?.message || "Unknown error" });
          errorRows++;
        }
      }
    }

    // Log the import
    await prisma.importLog.create({
      data: {
        fileName: fileName || "unknown",
        totalRows: rows.length,
        importedRows,
        skippedRows,
        errorRows,
        detailJson: {
          errors: errors.slice(0, 50),
        },
      },
    });

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      importedRows,
      skippedRows,
      errorRows,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error?.message || "Import failed" },
      { status: 500 }
    );
  }
}
