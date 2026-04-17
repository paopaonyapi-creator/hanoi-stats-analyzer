import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Simple DB connectivity check
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json(
            {
                status: "ok",
                timestamp: new Date().toISOString(),
                database: "connected",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[health] DB check failed:", error);
        return NextResponse.json(
            {
                status: "degraded",
                timestamp: new Date().toISOString(),
                database: "unreachable",
            },
            { status: 503 }
        );
    }
}
