import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = searchParams.get('type') || 'ALL';
    
    // Determine filter
    const where = typeStr !== 'ALL' ? { drawType: typeStr as DrawType } : {};
    
    // 1. Fetch the last 100 draws for analysis
    const draws = await prisma.drawResult.findMany({
      where,
      orderBy: { drawDate: 'desc' },
      take: 100,
      select: {
        last2: true,
        last3: true,
        drawDate: true,
        drawType: true,
      }
    });

    if (draws.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // 2. Compute Frequencies (Hot/Cold)
    const freq2 = new Map<string, number>();
    const freq3 = new Map<string, number>();
    
    draws.forEach(d => {
      freq2.set(d.last2, (freq2.get(d.last2) || 0) + 1);
      freq3.set(d.last3, (freq3.get(d.last3) || 0) + 1);
    });

    // 3. Find Transition (What usually comes after the last drawn number?)
    const latestDraw = draws[0];
    const sequenceMap = new Map<string, number>();
    
    for (let i = 0; i < draws.length - 1; i++) {
        const current = draws[i];
        const previousDrawBeforeIt = draws[i + 1]; // Because it's desc order
        
        // If the 'previous' draw matches our 'latest' draw, what came after it? That's 'current'.
        if (previousDrawBeforeIt.last2 === latestDraw.last2) {
             sequenceMap.set(current.last2, (sequenceMap.get(current.last2) || 0) + 1);
        }
    }

    // 4. Scoring Algorithm (0-100 Confidence)
    // Weight: 60% overall frequency, 40% sequence correlation
    const scoredLast2 = Array.from(freq2.entries()).map(([num, count]) => {
        const sequenceCount = sequenceMap.get(num) || 0;
        
        // Max theoretical frequency in 100 draws for a single pair might be around 4-6
        const freqScore = Math.min((count / 5) * 60, 60); 
        // Max sequence match might be 1-3
        const seqScore = Math.min((sequenceCount / 2) * 40, 40);
        
        const confidence = Math.round(Number(freqScore + seqScore));
        
        return {
            number: num,
            confidence: Math.min(confidence, 99), // Cap at 99%
            reasons: [
                count > 1 ? `Appearances in last 100: ${count} times` : null,
                sequenceCount > 0 ? `Followed ${latestDraw.last2} previously` : null,
            ].filter(Boolean)
        };
    });

    // Sort by descending confidence
    const topPredictions = scoredLast2.sort((a, b) => b.confidence - a.confidence).slice(0, 10);

    return NextResponse.json({
      type: typeStr,
      latestDrawDate: latestDraw.drawDate,
      latestResult: latestDraw.last2,
      predictions: topPredictions
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
