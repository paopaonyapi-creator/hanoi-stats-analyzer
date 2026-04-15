import { PrismaClient, DrawType } from "@prisma/client";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════
// Seed Data Generator
// ═══════════════════════════════════════════════

function randomDigits(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function getTimeForType(type: DrawType): string {
  const ranges: Record<DrawType, [number, number]> = {
    SPECIAL: [17, 17],
    NORMAL: [18, 18],
    VIP: [19, 19],
  };
  const [hourStart] = ranges[type];
  const minute = Math.floor(Math.random() * 30);
  return `${String(hourStart).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.drawResult.deleteMany();
  await prisma.importLog.deleteMany();
  await prisma.appSetting.deleteMany();

  const types: DrawType[] = ["SPECIAL", "NORMAL", "VIP"];
  const records: Array<{
    drawDate: Date;
    drawType: DrawType;
    drawTime: string;
    resultRaw: string;
    resultDigits: string;
    last1: string;
    last2: string;
    last3: string;
    weekday: number;
    monthKey: string;
    source: string;
  }> = [];

  // Generate 120+ records spread across 40 days
  const startDate = new Date("2025-03-01");

  for (let dayOffset = 0; dayOffset < 42; dayOffset++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);

    // Skip some days randomly for realism
    if (Math.random() < 0.05) continue;

    for (const type of types) {
      const digits = randomDigits(5);
      const last1 = digits.slice(-1);
      const last2 = digits.slice(-2);
      const last3 = digits.slice(-3);

      records.push({
        drawDate: date,
        drawType: type,
        drawTime: getTimeForType(type),
        resultRaw: digits,
        resultDigits: digits,
        last1,
        last2,
        last3,
        weekday: date.getDay(),
        monthKey: getMonthKey(date),
        source: "seed",
      });
    }
  }

  // Insert records
  const result = await prisma.drawResult.createMany({
    data: records,
  });

  console.log(`✅ Seeded ${result.count} draw results`);

  // Insert default settings
  await prisma.appSetting.create({
    data: {
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
  });

  console.log("✅ Seeded default settings");

  // Create import log for seed
  await prisma.importLog.create({
    data: {
      fileName: "seed-data",
      totalRows: records.length,
      importedRows: result.count,
      skippedRows: 0,
      errorRows: 0,
      detailJson: { source: "database seed" },
    },
  });

  console.log("✅ Seeded import log");

  // Seed Truth Engine settings
  const truthSettings = {
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
  };

  await prisma.engineSetting.create({
    data: {
      key: "truthEngineSettings",
      valueJson: truthSettings,
    },
  });
  console.log("✅ Seeded Truth Engine settings");

  console.log(`\n🎉 Database seeded with ${result.count} records!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
