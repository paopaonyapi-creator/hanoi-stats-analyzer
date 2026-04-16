import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';
import { calculateNumericalMomentum, aggregateCrossMarketMomentum } from '@/lib/truth/momentum';

export async function GET() {
  try {
    // 1. Fetch all recent records for all markets (300 items total is enough for 100-day momentum)
    const allRecords = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: 600, // 200 per market approximately
    });

    const markets: DrawType[] = ['NORMAL', 'SPECIAL', 'VIP'];
    const marketMomentum: Record<string, any> = {};

    // 2. Calculate momentum for each market
    markets.forEach(type => {
        const marketRecords = allRecords.filter(r => r.drawType === type);
        marketMomentum[type] = calculateNumericalMomentum(marketRecords as any);
    });

    // 3. Aggregate cross-market heat
    const aggregated = aggregateCrossMarketMomentum(marketMomentum);

    // 4. Identify Top Streaks (Hyper-Active)
    const flatMomentum = Object.values(marketMomentum['NORMAL']).map((m: any) => m);
    const hyperActive = flatMomentum
        .filter(m => m.compositeScore > 1.5)
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 10);

    return NextResponse.json({
      marketMomentum,
      aggregated,
      hyperActive,
      generatedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("Momentum API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
