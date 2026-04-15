import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeParseJson } from "@/lib/utils";

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    const result: Record<string, any> = {};
    settings.forEach((s) => {
      result[s.key] = safeParseJson(s.valueJson, null);
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, valueJson } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { valueJson },
      create: { key, valueJson },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings (reset database)
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "reset-db") {
      await prisma.drawResult.deleteMany();
      await prisma.importLog.deleteMany();
      return NextResponse.json({
        success: true,
        message: "Database reset successfully",
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Operation failed" },
      { status: 500 }
    );
  }
}
