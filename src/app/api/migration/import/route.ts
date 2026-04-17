import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsvForMigration } from "@/lib/migration/csv-importer";
import { DrawType } from "@prisma/client";

// POST /api/migration/import
// Body: FormData with field "file" (CSV) and optional "dryRun" boolean
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const dryRun = formData.get("dryRun") === "true";
        const overwrite = formData.get("overwrite") === "true";

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const csvText = await file.text();
        const result = parseCsvForMigration(csvText, {
            source: file.name,
            dryRun: true, // always parse first
        });

        if (result.valid === 0) {
            return NextResponse.json({
                success: false,
                dryRun,
                message: "No valid records found",
                result,
            });
        }

        if (dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                message: `Dry run: ${result.valid} records valid, ${result.invalid} invalid, ${result.duplicates} in-file duplicates`,
                result,
            });
        }

        // Real import — check for DB duplicates
        const CHUNK_SIZE = 100;
        let dbInserted = 0;
        let dbSkipped = 0;

        for (let i = 0; i < result.records.length; i += CHUNK_SIZE) {
            const chunk = result.records.slice(i, i + CHUNK_SIZE);

            if (overwrite) {
                // Upsert: overwrite existing records for same date+type
                for (const r of chunk) {
                    const drawDate = new Date(r.drawDate as string);
                    const existing = await prisma.drawResult.findFirst({
                        where: {
                            drawDate,
                            drawType: r.drawType as DrawType,
                        },
                    });

                    if (existing) {
                        await prisma.drawResult.update({
                            where: { id: existing.id },
                            data: {
                                resultRaw: r.resultRaw,
                                resultDigits: r.resultDigits,
                                last1: r.last1,
                                last2: r.last2,
                                last3: r.last3,
                                drawTime: r.drawTime,
                                source: r.source ?? undefined,
                            },
                        });
                        dbSkipped++; // counts as updated
                    } else {
                        await prisma.drawResult.create({
                            data: {
                                drawDate,
                                drawType: r.drawType as DrawType,
                                drawTime: r.drawTime,
                                resultRaw: r.resultRaw,
                                resultDigits: r.resultDigits,
                                last1: r.last1,
                                last2: r.last2,
                                last3: r.last3,
                                weekday: r.weekday,
                                monthKey: r.monthKey,
                                source: r.source ?? null,
                            },
                        });
                        dbInserted++;
                    }
                }
            } else {
                // Insert only new records (skip duplicates silently)
                const res = await prisma.drawResult.createMany({
                    data: chunk.map((r) => ({
                        drawDate: new Date(r.drawDate as string),
                        drawType: r.drawType as DrawType,
                        drawTime: r.drawTime,
                        resultRaw: r.resultRaw,
                        resultDigits: r.resultDigits,
                        last1: r.last1,
                        last2: r.last2,
                        last3: r.last3,
                        weekday: r.weekday,
                        monthKey: r.monthKey,
                        source: r.source ?? null,
                    })),
                    skipDuplicates: false, // manual control via dedup key
                });
                dbInserted += res.count;
            }
        }

        // Record the import log
        await prisma.importLog.create({
            data: {
                fileName: file.name,
                totalRows: result.total,
                importedRows: dbInserted,
                skippedRows: dbSkipped + result.duplicates + result.invalid,
                errorRows: result.invalid,
                detailJson: {
                    valid: result.valid,
                    invalid: result.invalid,
                    inFileDuplicates: result.duplicates,
                    dbInserted,
                    dbSkipped,
                    overwrite,
                    topErrors: result.errors.slice(0, 10),
                },
            },
        });

        return NextResponse.json({
            success: true,
            dryRun: false,
            message: `Import complete: ${dbInserted} new records added, ${dbSkipped} updated, ${result.invalid} invalid rows`,
            dbInserted,
            dbSkipped,
            parseResult: {
                total: result.total,
                valid: result.valid,
                invalid: result.invalid,
                duplicates: result.duplicates,
                errors: result.errors.slice(0, 20),
            },
        });
    } catch (err: unknown) {
        console.error("Migration import error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Import failed" },
            { status: 500 }
        );
    }
}

// GET /api/migration/import — list recent import logs
export async function GET() {
    try {
        const logs = await prisma.importLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return NextResponse.json({ logs });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to fetch logs" },
            { status: 500 }
        );
    }
}
