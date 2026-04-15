import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // 1. Get the last (days + 100) records to have enough padding for analysis
    const allRecentDraws = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
      take: days + 100,
    });

    if (allRecentDraws.length < days + 1) {
      return NextResponse.json({ error: 'Not enough data for backtesting' }, { status: 400 });
    }

    let hits = 0;
    let nearMisses = 0; // Difference of +- 1
    let processed = 0;

    // We start from the day before the latest (so we can check against the actual result)
    // We go back 'days' times
    for (let i = 0; i < days; i++) {
        const actualResult = allRecentDraws[i]; // Day X
        const historicalData = allRecentDraws.slice(i + 1, i + 101); // 100 days BEFORE Day X
        
        if (historicalData.length < 10) continue;

        // --- Run Prediction Engine Logic (Simplified for speed) ---
        const latestNum = historicalData[0].last2;
        const freq2 = new Map<string, number>();
        const sequenceMap = new Map<string, number>();

        historicalData.forEach(d => {
            freq2.set(d.last2, (freq2.get(d.last2) || 0) + 1);
        });

        for (let j = 0; j < historicalData.length - 1; j++) {
            if (historicalData[j + 1].last2 === latestNum) {
                sequenceMap.set(historicalData[j].last2, (sequenceMap.get(historicalData[j].last2) || 0) + 1);
            }
        }

        // Score them
        let topPick = '';
        let topScore = -1;

        freq2.forEach((count, num) => {
            const seqCount = sequenceMap.get(num) || 0;
            const score = (count / 5) * 60 + (seqCount / 2) * 40;
            if (score > topScore) {
                topScore = score;
                topPick = num;
            }
        });

        // Check if correct
        if (topPick === actualResult.last2) {
            hits++;
        } else {
            const diff = Math.abs(parseInt(topPick) - parseInt(actualResult.last2));
            if (diff === 1 || diff === 99 || diff === 11) { // Basic near miss logic
                nearMisses++;
            }
        }
        processed++;
    }

    const hitRate = processed > 0 ? (hits / processed) * 100 : 0;
    const nearMissRate = processed > 0 ? (nearMisses / processed) * 100 : 0;

    return NextResponse.json({
        period: `${days} days`,
        processed,
        hits,
        nearMisses,
        hitRate: Math.round(hitRate),
        nearMissRate: Math.round(nearMissRate),
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
