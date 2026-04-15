import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ value: string }> }
) {
  try {
    const { value } = await params;
    const is3D = value.length === 3;
    const is2D = value.length === 2;

    if (!is2D && !is3D) {
      return NextResponse.json({ error: 'Invalid number format. Use 2 or 3 digits.' }, { status: 400 });
    }

    // 1. Fetch all matching records
    const matches = await prisma.drawResult.findMany({
      where: is2D ? { last2: value } : { last3: value },
      orderBy: { drawDate: 'desc' },
      take: 50
    });

    // 2. Fetch all-time stats for context
    const allRecordsCount = await prisma.drawResult.count();
    
    // 3. Calculate Gap
    const latestMatch = matches[0];
    let currentGap = -1;
    if (latestMatch) {
        const newerRecordsCount = await prisma.drawResult.count({
            where: {
                drawDate: { gt: latestMatch.drawDate },
                // If it's the same day, we need to consider the draw order (Special -> Normal -> VIP)
                // Simplified for now: just days
            }
        });
        currentGap = newerRecordsCount;
    }

    // 4. AI Analysis/Recommendation
    let confidence = 0;
    let recommendation = "ข้อมูลไม่เพียงพอ";
    let color = "gray";

    if (matches.length > 0) {
        // High frequency + High gap = "Heating up"
        const freqRatio = (matches.length / allRecordsCount) * 100;
        const avgExpectedFrequency = is2D ? 1 : 0.1; // 1% for 2D, 0.1% for 3D
        
        if (currentGap > 200) {
            confidence = 85;
            recommendation = "โอกาสสูงมาก (เลขกำลังขยับ)";
            color = "rose";
        } else if (currentGap > 50) {
            confidence = 65;
            recommendation = "น่าดีดตาม (เลขน่าจับตา)";
            color = "amber";
        } else {
            confidence = 30;
            recommendation = "เพิ่งออกไป (รอสัญญาณถัดไป)";
            color = "emerald";
        }
    }

    // 5. Correlation (Pairs)
    // Find what numbers usually appear in the SAME draw result when this number hits
    // (e.g. if 42 is the last2, what was the last3 or other digits?)
    // This is more of a "Companion" analysis
    const companions = new Map<string, number>();
    matches.forEach(m => {
        // Just as an example: companion is the first digit
        const comp = m.resultDigits.substring(0, 1);
        companions.set(comp, (companions.get(comp) || 0) + 1);
    });

    const topCompanions = Array.from(companions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([val, count]) => ({ val, count }));

    return NextResponse.json({
      value,
      type: is2D ? '2D' : '3D',
      totalHits: matches.length,
      currentGap,
      latestHit: latestMatch ? {
          date: latestMatch.drawDate,
          type: latestMatch.drawType,
          result: latestMatch.resultDigits
      } : null,
      aiAnalysis: {
          confidence,
          recommendation,
          color
      },
      topCompanions,
      recentHits: matches.slice(0, 10).map(m => ({
          date: m.drawDate,
          type: m.drawType,
          last2: m.last2,
          last3: m.last3
      }))
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
