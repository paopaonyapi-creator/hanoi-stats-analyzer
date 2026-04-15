import { NextResponse } from "next/server";
import { PrismaClient, DrawType } from "@prisma/client";
import { sendLineNotify, formatResultForLine } from "@/lib/services/line";

const prisma = new PrismaClient();

const SOURCES = [
  { type: "SPECIAL" as DrawType, slug: "xsthm", time: "17:05", label: "ฮานอยพิเศษ" },
  { type: "NORMAL" as DrawType, slug: "minhngoc", time: "18:10", label: "ฮานอยปกติ" },
  { type: "VIP" as DrawType, slug: "mlnhngo", time: "19:15", label: "ฮานอยVIP" },
];

const DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseExphuayHtml(html: string) {
  const results: Map<string, any> = new Map();
  const dateRe = /href="\/result\/[^?]+\?date=(\d{4}-\d{2}-\d{2})[^"]*"/g;
  const spanRe = /<!--\[-->(\d{2,3})<!--\]-->/g;

  let dm: RegExpExecArray | null;
  while ((dm = dateRe.exec(html)) !== null) {
    const dateStr = dm[1];
    if (results.has(dateStr)) continue;

    spanRe.lastIndex = dm.index;
    const s1 = spanRe.exec(html);
    const s2 = spanRe.exec(html);
    if (!s1 || !s2) continue;

    const n1 = s1[1];
    const n2 = s2[1];

    if (n1.length === 3 && n2.length === 2) {
      results.set(dateStr, { dateStr, last3: n1, last2: n2 });
    } else if (n1.length === 2 && n2.length === 3) {
      results.set(dateStr, { dateStr, last3: n2, last2: n1 });
    }
  }

  return [...results.values()];
}

function buildRecord(entry: any, drawType: DrawType, drawTime: string) {
  const drawDate = new Date(entry.dateStr + "T00:00:00.000Z");
  const resultDigits = entry.last3 + entry.last2;
  const last1 = resultDigits.slice(-1);
  const weekday = drawDate.getUTCDay();
  const y = drawDate.getUTCFullYear();
  const mo = String(drawDate.getUTCMonth() + 1).padStart(2, "0");
  const monthKey = `${y}-${mo}`;

  return {
    drawDate,
    drawType,
    drawTime,
    resultRaw: resultDigits,
    resultDigits,
    last1,
    last2: entry.last2,
    last3: entry.last3,
    weekday,
    monthKey,
    source: "exphuay.com",
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get("authorization")?.split(" ")[1] || searchParams.get("key");

    if (process.env.CRON_SECRET && apiKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Line Token from settings
    const lineSetting = await prisma.appSetting.findUnique({ where: { key: 'line_notify_token' } });
    const lineToken = (lineSetting?.valueJson as any)?.token;

    let totalInserted = 0;
    const logs = [];

    for (const src of SOURCES) {
      const url = `https://exphuay.com/backward/${src.slug}`;
      let html = "";
      try {
        html = await fetchHtml(url);
      } catch (err: any) {
        logs.push(`Failed to fetch ${src.label}: ${err.message}`);
        continue;
      }

      const entries = parseExphuayHtml(html);
      if (entries.length === 0) {
        logs.push(`${src.label}: 0 entries found.`);
        continue;
      }

      const records = entries.map((e) => buildRecord(e, src.type, src.time));
      
      const result = await prisma.drawResult.createMany({
        data: records,
        skipDuplicates: true,
      });

      if (result.count > 0) {
        // Log import
        await prisma.importLog.create({
          data: {
            fileName: `daily-cron-${src.slug}`,
            totalRows: entries.length,
            importedRows: result.count,
            skippedRows: entries.length - result.count,
            errorRows: 0,
            detailJson: { source: "cron", type: src.type },
          },
        });

        // 2. TRIGGER NOTIFICATION if token exists
        if (lineToken) {
           const latest = records[0]; 
           const message = formatResultForLine(
             src.label, 
             latest.drawDate.toLocaleDateString('th-TH'),
             latest.resultDigits,
             latest.last2
           );
           await sendLineNotify(message, lineToken);
        }
      }

      logs.push(`${src.label}: Processed ${entries.length}, Inserted ${result.count} new records.`);
      totalInserted += result.count;
      await sleep(DELAY_MS);
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Inserted ${totalInserted} new records.`,
      logs,
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
