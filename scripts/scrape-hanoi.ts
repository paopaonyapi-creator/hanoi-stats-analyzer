/**
 * scrape-hanoi.ts
 * ดึงข้อมูลผลฮานอยย้อนหลังจาก exphuay.com ทั้ง 3 ประเภท
 * SPECIAL (ฮานอยพิเศษ), NORMAL (ฮานอยปกติ), VIP (ฮานอยวีไอพี)
 *
 * Usage: npx tsx scripts/scrape-hanoi.ts
 */

import { PrismaClient, DrawType } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SOURCES = [
  { type: "SPECIAL" as DrawType, slug: "xsthm",    time: "17:05", label: "ฮานอยพิเศษ" },
  { type: "NORMAL"  as DrawType, slug: "minhngoc", time: "18:10", label: "ฮานอยปกติ"  },
  { type: "VIP"     as DrawType, slug: "mlnhngo",  time: "19:15", label: "ฮานอยVIP"   },
];

const MAX_PAGES   = 1000;     // safety cap
const DELAY_MS    = 800;     // polite delay between requests
const BATCH_SIZE  = 100;     // records per DB upsert batch

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

interface RawEntry {
  dateStr: string; // "2026-04-14"
  last3:   string; // "128"
  last2:   string; // "35"
}

/**
 * Parse one page of exphuay backward results.
 * 
 * HTML structure (SvelteKit SSR):
 *   <a href="/result/xsthm?date=2026-04-14" ...>...</a></span>
 *   <span...><!--[-->128<!--]--></span>
 *   <span...><!--[-->35<!--]--></span>
 */
function parseExphuayHtml(html: string): RawEntry[] {
  const results: Map<string, RawEntry> = new Map();

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

/**
 * Detect whether this page has any result entries (used to bail early).
 */
function hasEntries(html: string): boolean {
  return /href="[^"]*?date=\d{4}-\d{2}-\d{2}/.test(html);
}

/**
 * Convert a CE date string (yyyy-mm-dd) to DB-ready fields.
 */
function buildRecord(
  entry: RawEntry,
  drawType: DrawType,
  drawTime: string
) {
  const drawDate = new Date(entry.dateStr + "T00:00:00.000Z");
  // synthetic 5-digit: [3-top][2-bottom]
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
    resultRaw:    resultDigits,
    resultDigits,
    last1,
    last2: entry.last2,
    last3: entry.last3,
    weekday,
    monthKey,
    source: "exphuay.com",
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function scrapeType(src: (typeof SOURCES)[number]) {
  console.log(`\n📥  Scraping ${src.label} (${src.type}) ...`);
  const allEntries: RawEntry[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      page === 1
        ? `https://exphuay.com/backward/${src.slug}`
        : `https://exphuay.com/backward/${src.slug}?page=${page}`;

    process.stdout.write(`   page ${page}/${MAX_PAGES} ... `);

    let html = "";
    try {
      html = await fetchHtml(url);
    } catch (err) {
      console.log(`⚠️  fetch error: ${err}`);
      break;
    }

    if (!hasEntries(html)) {
      console.log("(empty — done)");
      break;
    }

    const entries = parseExphuayHtml(html);
    console.log(`got ${entries.length} entries`);
    allEntries.push(...entries);

    await sleep(DELAY_MS);
  }

  console.log(`   ✅  Total raw entries: ${allEntries.length}`);
  return allEntries;
}

async function main() {
  console.log("🚀  Hanoi Scraper — starting\n");
  console.log("   Clearing seeded/test data...");

  // Remove previously seeded test data only (keep existing real data)
  await prisma.drawResult.deleteMany({ where: { source: "seed" } });
  await prisma.importLog.deleteMany({
    where: { fileName: "seed-data" },
  });

  let totalInserted = 0;

  for (const src of SOURCES) {
    const entries = await scrapeType(src);
    if (entries.length === 0) continue;

    // Build DB records
    const records = entries.map((e) => buildRecord(e, src.type, src.time));

    // Upsert in batches (skip duplicates via @@unique constraint)
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await prisma.drawResult.createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += result.count;
    }

    console.log(
      `   💾  ${src.label}: ${inserted} new records saved (${entries.length - inserted} skipped as duplicates)`
    );

    // Log the import
    await prisma.importLog.create({
      data: {
        fileName: `scrape-exphuay-${src.slug}`,
        totalRows:    entries.length,
        importedRows: inserted,
        skippedRows:  entries.length - inserted,
        errorRows:    0,
        detailJson:   { source: "exphuay.com", type: src.type },
      },
    });

    totalInserted += inserted;
  }

  // Count final DB totals per type
  console.log("\n📊  Final DB counts:");
  for (const src of SOURCES) {
    const count = await prisma.drawResult.count({
      where: { drawType: src.type },
    });
    console.log(`   ${src.label}: ${count} records`);
  }

  const grandTotal = await prisma.drawResult.count();
  console.log(`\n🎉  Done! ${totalInserted} new records added. Grand total: ${grandTotal} records.\n`);
}

main()
  .catch((e) => {
    console.error("❌  Scraper failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
