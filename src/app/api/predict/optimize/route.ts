import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = (searchParams.get('type') || 'NORMAL') as DrawType;
    const period = parseInt(searchParams.get('period') || '30');

    // Fetch pool
    const allDraws = await prisma.drawResult.findMany({
      where: { drawType: typeStr },
      orderBy: { drawDate: 'desc' },
      take: period + 101, // 30 targeted days + 100 deep history for each
      select: { last2: true, drawDate: true }
    });

    if (allDraws.length < period + 10) {
      return NextResponse.json({ error: 'Insufficient data for optimization' }, { status: 400 });
    }

    const testWeights = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const results = [];

    // Brute force search (cheap for 11 combinations)
    for (const fw of testWeights) {
      const sw = parseFloat((1 - fw).toFixed(1));
      let hits = 0;

      // Inner loop: run backtest for this weight pair
      for (let i = 0; i < period; i++) {
        const targetDraw = allDraws[i];
        const historicalPool = allDraws.slice(i + 1, i + 101);

        // Simple calc (replicated from backtest route for speed)
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
            const fScore = (count / 5) * 100 * fw;
            const sScore = (seqCount / 2) * 100 * sw;
            return { number: num, score: fScore + sScore };
        }).sort((a, b) => b.score - a.score).slice(0, 10);

        if (scored.map(s => s.number).includes(targetDraw.last2)) hits++;
      }

      results.push({
        freqWeight: fw,
        seqWeight: sw,
        hitRate: parseFloat(((hits / period) * 100).toFixed(2)),
        hits
      });
    }

    // Sort by hitRate desc
    results.sort((a, b) => b.hitRate - a.hitRate);

    return NextResponse.json({
      type: typeStr,
      period,
      combinations: results,
      champion: results[0]
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
