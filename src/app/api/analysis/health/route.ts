import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));

    // 1. Fetch records from the last 30 days
    const draws = await prisma.drawResult.findMany({
      where: {
        drawDate: { gte: thirtyDaysAgo }
      },
      select: {
        drawDate: true,
        drawType: true,
      }
    });

    const types: DrawType[] = ['SPECIAL', 'NORMAL', 'VIP'];
    const issues: string[] = [];
    const missingDays: Record<string, string[]> = { SPECIAL: [], NORMAL: [], VIP: [] };

    // 2. Map existing dates per type
    const existenceMap: Record<string, Set<string>> = {
      SPECIAL: new Set(),
      NORMAL: new Set(),
      VIP: new Set(),
    };

    draws.forEach(d => {
      const dateStr = d.drawDate.toISOString().split('T')[0];
      existenceMap[d.drawType].add(dateStr);
    });

    // 3. Scan for gaps
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(now.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      // Skip today if it's before draw time (simple check)
      if (i === 0 && checkDate.getUTCHours() < 12) continue;

      types.forEach(type => {
        if (!existenceMap[type].has(checkDateStr)) {
          missingDays[type].push(checkDateStr);
        }
      });
    }

    const totalPossible = 30 * types.length;
    const totalMissing = Object.values(missingDays).flat().length;
    const integrityScore = Math.round(((totalPossible - totalMissing) / totalPossible) * 100);

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (integrityScore < 95) status = 'WARNING';
    if (integrityScore < 80) status = 'CRITICAL';

    return NextResponse.json({
      status,
      integrityScore,
      scannedPeriod: '30 days',
      totalRecords: draws.length,
      missingDays,
      recommendation: totalMissing > 0 ? 'ควรทำการ Re-sync ข้อมูลเพื่ออุดช่องว่างของสถิติ' : 'ข้อมูลสมบูรณ์ 100%'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
