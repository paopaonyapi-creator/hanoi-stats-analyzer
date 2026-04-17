import { PrismaClient, DrawType } from "@prisma/client";
import { generateRealisticSeedRecords } from "../src/lib/migration/csv-importer";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════
// Enhanced Seed — 6 months of realistic Hanoi data
// ═══════════════════════════════════════════════

async function main() {
  console.log("🌱 Seeding database with enhanced 6-month dataset...\n");

  // Clear existing data
  await prisma.drawResult.deleteMany();
  await prisma.importLog.deleteMany();
  await prisma.appSetting.deleteMany();
  console.log("🗑️  Cleared existing data");

  // Generate realistic records: 180 days (~6 months)
  const startDate = new Date("2025-10-20"); // 6 months before now
  const records = generateRealisticSeedRecords(
    startDate,
    180,
    ["SPECIAL", "NORMAL", "VIP"]
  );

  // Batch insert (chunked for SQLite compatibility)
  const CHUNK_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const res = await prisma.drawResult.createMany({
      data: chunk.map((r) => ({
        ...r,
        drawDate: new Date(r.drawDate),
        drawType: r.drawType as DrawType,
      })),
      skipDuplicates: true,
    });
    inserted += res.count;
    process.stdout.write(`\r   Inserting... ${inserted}/${records.length}`);
  }
  console.log(`\n✅ Seeded ${inserted} draw results (${records.length} generated)`);

  // ── Default Score Weights ──
  await prisma.appSetting.upsert({
    where: { key: "scoreWeights" },
    create: {
      key: "scoreWeights",
      valueJson: {
        allTime: 1.0,
        recent: 1.5,
        gap: 1.2,
        transition: 1.0,
        digitBalance: 0.8,
        repeat: 1.0,
        weekday: 0.7,
      },
    },
    update: {},
  });

  // ── Telegram Bot placeholder ──
  await prisma.appSetting.upsert({
    where: { key: "telegram_bot_settings" },
    create: {
      key: "telegram_bot_settings",
      valueJson: {
        botToken: "",
        chatId: "",
        enabled: false,
        notifyOnResult: true,
        notifyOnDrift: true,
        notifyOnGodTier: true,
      },
    },
    update: {},
  });

  // ── Truth Engine Settings ──
  await prisma.appSetting.upsert({
    where: { key: "truthEngineSettings" },
    create: {
      key: "truthEngineSettings",
      valueJson: {
        minIntegrityScore: 70,
        minSampleForSignal: 30,
        minSampleForWindow: 12,
        recentWindows: [10, 20, 50],
        baselineTopK: 10,
        driftThreshold: 0.2,
        confidenceLowThreshold: 40,
        confidenceMediumThreshold: 65,
        strongSignalThreshold: 75,
        noReliableEdgeIfBaselineDeltaBelow: 0.02,
        weights: {
          frequencyAllTime: 1.0,
          frequencyRecent: 1.2,
          recencyDecay: 1.1,
          transition: 0.9,
          gapReturn: 1.0,
          digitBalance: 0.5,
          weekdayAlignment: 0.4,
          windowConsistency: 1.0,
        },
        penalties: {
          anomalyPenalty: 1.2,
          overfitPenalty: 1.5,
          insufficientDataPenalty: 2.0,
          driftPenalty: 1.0,
        },
        confidenceWeights: {
          sampleSizeQuality: 1.0,
          featureAgreement: 1.1,
          windowStability: 1.2,
          outOfSampleConsistency: 1.3,
          integrity: 1.2,
        },
        ensembleWeights: {
          bayesian: 0.30,
          momentum: 0.25,
          gapReturn: 0.25,
          window: 0.20,
        },
      },
    },
    update: {},
  });

  console.log("✅ Seeded all AppSettings (scoreWeights, telegram, truthEngine)");

  // ── Import Log ──
  await prisma.importLog.create({
    data: {
      fileName: "seed-enhanced-6months",
      totalRows: records.length,
      importedRows: inserted,
      skippedRows: records.length - inserted,
      errorRows: 0,
      detailJson: {
        source: "enhanced-seed",
        startDate: startDate.toISOString().split("T")[0],
        days: 180,
        description: "6-month realistic weighted distribution seed",
      },
    },
  });

  console.log("✅ Seeded import log");
  console.log(`\n🎉 Done! ${inserted} records ready for Truth Engine analysis.\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
