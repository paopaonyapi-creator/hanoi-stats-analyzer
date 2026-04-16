import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';
import { findChampionWeights } from '@/lib/truth/optimizer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeStr = (searchParams.get('type') || 'NORMAL') as DrawType;
    const period = parseInt(searchParams.get('period') || '60'); // default to 60 for better signal resolution
    const iterations = parseInt(searchParams.get('iterations') || '20');
    const population = parseInt(searchParams.get('population') || '10');

    // Fetch data for optimization
    const allDraws = await prisma.drawResult.findMany({
      where: { drawType: typeStr },
      orderBy: { drawDate: 'desc' },
      take: period + 100, // period for testing + 100 for historical context
      select: { last2: true, drawDate: true, drawType: true }
    });

    if (allDraws.length < 50) {
      return NextResponse.json({ error: 'Insufficient data for god-tier optimization' }, { status: 400 });
    }

    // Run Genetic Optimizer
    const championGenome = findChampionWeights(allDraws as any, {
      iterations,
      populationSize: population,
    });

    return NextResponse.json({
      type: typeStr,
      period,
      status: 'OPTIMIZED',
      champion: {
        weights: championGenome.weights,
        edgeDelta: parseFloat((championGenome.edgeDelta * 100).toFixed(2)) + '%',
      },
      message: 'Genetic optimization completed. System is now calibrated for APEX performance.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
