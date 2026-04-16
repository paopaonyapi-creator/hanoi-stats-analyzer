import { NextResponse } from "next/server";
import { PrismaClient, DrawType } from "@prisma/client";
import { 
  sendTelegramMessage, 
  formatResultForTelegram, 
  formatGodTierPrediction,
  formatRecalibrationAlert,
  formatSentinelAlert 
} from "@/lib/services/telegram";
import { runWalkForwardBacktest } from "@/lib/truth/backtest";
import { findChampionWeights } from "@/lib/truth/optimizer";
import { detectGlobalDrift } from "@/lib/truth/drift";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "@/lib/truth/constants";

const prisma = new PrismaClient();

const SOURCES = [
  { type: "SPECIAL" as DrawType, slug: "xsthm", time: "17:05", label: "ฮานอยพิเศษ" },
  { type: "NORMAL" as DrawType, slug: "minhngoc", time: "18:10", label: "ฮานอยปกติ" },
  { type: "VIP" as DrawType, slug: "mlnhngo", time: "19:15", label: "ฮานอยVIP" },
];

const DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url: string, retries: number = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      console.warn(`Retry ${i + 1}/${retries} for ${url} in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error("Failed after retries");
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

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.setup_webhook) {
    const tgSetting = await prisma.appSetting.findUnique({ where: { key: 'telegram_bot_settings' } });
    const { botToken } = (tgSetting?.valueJson as any) || {};
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || body.url;
    
    if (botToken && appUrl) {
      const webhookUrl = `${appUrl}/api/webhooks/telegram`;
      const secretToken = process.env.TELEGRAM_SECRET || "hanoi_default_secret";
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}&secret_token=${secretToken}`);
      const data = await response.json();
      return NextResponse.json({ success: data.ok, data, webhookUrl });
    }
    return NextResponse.json({ error: "Missing botToken or appUrl" }, { status: 400 });
  }

  if (body.test) {
    const tgSetting = await prisma.appSetting.findUnique({ where: { key: 'telegram_bot_settings' } });
    const { botToken, chatId } = (tgSetting?.valueJson as any) || {};
    if (botToken && chatId) {
      await sendTelegramMessage("✅ <b>Test Connection Success!</b>\nYour Telegram Bot is now linked with Hanoi Intelligence Platform.", botToken, chatId);
      return NextResponse.json({ success: true });
    }
  }
  return NextResponse.json({ error: "Invalid test request" }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get("authorization")?.split(" ")[1] || searchParams.get("key");

    if (process.env.CRON_SECRET && apiKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tgSetting = await prisma.appSetting.findUnique({ where: { key: 'telegram_bot_settings' } });
    const { botToken, chatId } = (tgSetting?.valueJson as any) || {};

    const weightSetting = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    const currentWeights = (weightSetting?.valueJson as any) || DEFAULT_TRUTH_ENGINE_SETTINGS.weights;

    // Fetch the larger cross-market pool once
    const allRecords = await prisma.drawResult.findMany({
        orderBy: { drawDate: 'desc' },
        take: 500
    });

    let totalInserted = 0;
    const logs = [];
    const marketReports: Record<string, any> = {};

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

        if (botToken && chatId) {
           const latest = records[0]; 
           await sendTelegramMessage(formatResultForTelegram(src.label, latest.drawDate.toLocaleDateString('th-TH'), latest.resultDigits, latest.last2, latest.last3), botToken, chatId);

           // ── APEX AUTO-RECALIBRATION ──
           const typeRecords = allRecords.filter(r => r.drawType === src.type).slice(0, 150);
           const currentPerf = runWalkForwardBacktest(typeRecords as any, { 
               settings: { weights: currentWeights },
               drawType: src.type
           });
           
           if (currentPerf.averageDelta <= 0 || currentPerf.verdict === 'NO_RELIABLE_EDGE') {
              const champion = findChampionWeights(typeRecords as any, { 
                  iterations: 15, 
                  populationSize: 8,
              });
              
              if (champion.edgeDelta > currentPerf.averageDelta) {
                 await prisma.appSetting.upsert({
                   where: { key: 'scoreWeights' },
                   update: { valueJson: champion.weights },
                   create: { key: 'scoreWeights', valueJson: champion.weights }
                 });
                 await sendTelegramMessage(formatRecalibrationAlert(src.label, currentPerf.averageDelta, champion.edgeDelta), botToken, chatId);
              }
           }

           // ── GOD-TIER PREDICTION ALERT ──
           const predUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/predict?type=${src.type}`;
           const predResponse = await fetch(predUrl).then(r => r.json());
           
           if (predResponse.predictions && predResponse.predictions[0].trendScore >= 80) {
             const alertMessage = formatGodTierPrediction(src.label, "Next Draw", predResponse.predictions, currentPerf.verdict);
             await sendTelegramMessage(alertMessage, botToken, chatId);
           }

           // Collect drift for Global Sentinel
           if (predResponse.driftReport) {
             marketReports[src.label] = predResponse.driftReport;
           }
        }
      }

      logs.push(`${src.label}: Processed ${entries.length}, Inserted ${result.count} new records.`);
      totalInserted += result.count;
      await sleep(DELAY_MS);
    }

    // ── SENTINEL GLOBAL DRIFT CHECK ──
    if (botToken && chatId && Object.keys(marketReports).length >= 2) {
        const globalReport = detectGlobalDrift(marketReports);
        if (globalReport.isDetected) {
            await sendTelegramMessage(formatSentinelAlert(globalReport), botToken, chatId);
        }
    }

    // ── DEAD-MAN'S SWITCH CHECK ──
    if (totalInserted === 0 && botToken && chatId) {
        await sendTelegramMessage(
            "⚠️ <b>CRITICAL SYSTEM MONITOR: NO NEW DATA</b>\n──────────────────\n" +
            "ระบบพยายาม Sync ข้อมูลประจำวันแล้ว แต่ตรวจไม่พบข้อมูลใหม่จากแหล่งข่าว (Exphuay) แม้แต่รายการเดียว\n\n" +
            "📢 <b>กรุณาตรวจสอบ:</b>\n1. เว็บไซต์ต้นทางมีการเปลี่ยนโครงสร้างหรือไม่\n2. วันนี้มีการเลื่อนออกผลหรือไม่\n3. ระบบ Scraper ทำงานปกติหรือไม่",
            botToken,
            chatId
        );
    }

    return NextResponse.json({ success: true, message: `Apex Sync complete. ${totalInserted} records.`, logs });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
