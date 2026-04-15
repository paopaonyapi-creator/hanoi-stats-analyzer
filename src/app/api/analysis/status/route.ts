import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET() {
    try {
        // 1. Get Integrity Score (last 30 days)
        const recentDays = await prisma.drawResult.findMany({
            orderBy: { drawDate: 'desc' },
            take: 90, // 30 days * 3 types
            select: { drawDate: true, drawType: true }
        });
        
        const uniqueDates = Array.from(new Set(recentDays.map(d => d.drawDate.toISOString().slice(0, 10)))).slice(0, 30);
        const expectedCount = uniqueDates.length * 3;
        const actualCount = recentDays.filter(d => uniqueDates.includes(d.drawDate.toISOString().slice(0, 10))).length;
        const integrityScore = expectedCount > 0 ? (actualCount / expectedCount) * 100 : 0;

        // 2. Get Settings (Strategy & Calibration)
        const settings = await prisma.appSetting.findMany({
            where: { key: { in: ['scoreWeights', 'lineNotify'] } }
        });
        
        const weights = settings.find(s => s.key === 'scoreWeights')?.valueJson as any;

        return NextResponse.json({
            integrity: {
                score: Math.round(integrityScore),
                level: integrityScore > 90 ? 'HIGH' : integrityScore > 70 ? 'MEDIUM' : 'LOW',
                lastChecked: new Date().toISOString()
            },
            strategy: {
                active: weights ? 'Custom / Optimized' : 'Default',
                weights: weights || { freqWeight: 0.6, seqWeight: 0.4 }
            },
            freshness: {
                lastDraw: recentDays[0]?.drawDate || null,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
