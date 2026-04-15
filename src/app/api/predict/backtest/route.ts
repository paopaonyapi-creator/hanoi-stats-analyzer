import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = (searchParams.get('type') || 'NORMAL') as DrawType;
    const period = parseInt(searchParams.get('period') || '30');
    const freqWeight = parseFloat(searchParams.get('freqWeight') || '0.6');
    const seqWeight = parseFloat(searchParams.get('seqWeight') || '0.4');

    // Fetch enough data for backtesting (latest N items + 100 historical items for each prediction point)
    const allDraws = await prisma.drawResult.findMany({
      where: { drawType: typeStr },
      orderBy: { drawDate: 'desc' },
      take: period + 100,
      select: {
        last2: true,
        drawDate: true,
      }
    });

    if (allDraws.length < period + 5) {
      return NextResponse.json({ error: 'Insufficient data for simulation' }, { status: 400 });
    }

    const results = [];
    let totalHits = 0;

    // Simulate for the last 'period' draws (excluding index 0 if it's today and not closed yet, but we use index as is)
    for (let i = 0; i < period; i++) {
        const targetDraw = allDraws[i];
        const historicalPool = allDraws.slice(i + 1, i + 101); // 100 draws prior to target
        
        if (historicalPool.length < 50) break; // Need at least some data

        // -- Algorithmic Prediction logic (Parameteized) --
        const freqMap = new Map<string, number>();
        historicalPool.forEach(d => freqMap.set(d.last2, (freqMap.get(d.last2) || 0) + 1));

        const latestInHistory = historicalPool[0];
        const sequenceMap = new Map<string, number>();
        for (let j = 0; j < historicalPool.length - 1; j++) {
            if (historicalPool[j + 1].last2 === latestInHistory.last2) {
                sequenceMap.set(historicalPool[j].last2, (sequenceMap.get(historicalPool[j].last2) || 0) + 1);
            }
        }

        const scored = Array.from(freqMap.entries()).map(([num, count]) => {
            const seqCount = sequenceMap.get(num) || 0;
            const fScore = (count / 5) * 100 * freqWeight;
            const sScore = (seqCount / 2) * 100 * seqWeight;
            return { number: num, score: fScore + sScore };
        }).sort((a, b) => b.score - a.score).slice(0, 10);

        const predictionNumbers = scored.map(s => s.number);
        const isHit = predictionNumbers.includes(targetDraw.last2);
        
        if (isHit) totalHits++;

        results.push({
            date: targetDraw.drawDate,
            actual: targetDraw.last2,
            predicted: predictionNumbers,
            isHit
        });
    }

    return NextResponse.json({
      type: typeStr,
      period: results.length,
      hitRate: parseFloat(((totalHits / results.length) * 100).toFixed(2)),
      totalHits,
      results: results.reverse() // Chronological order
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
