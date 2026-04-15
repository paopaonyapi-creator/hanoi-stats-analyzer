import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DrawType } from '@prisma/client';

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Fetch historical weekday stats to find "Power Days"
    // We'll calculate which weekdays have the highest frequency of hits for each type
    const draws = await prisma.drawResult.findMany({
      where: {
        drawDate: {
          gte: new Date(new Date().setFullYear(now.getFullYear() - 1)) // 1 year of data
        }
      },
      select: {
        drawType: true,
        weekday: true,
      }
    });

    const weekdayStats: Record<string, Record<number, number>> = {
      SPECIAL: {},
      NORMAL: {},
      VIP: {}
    };

    draws.forEach(d => {
      if (!weekdayStats[d.drawType]) weekdayStats[d.drawType] = {};
      weekdayStats[d.drawType][d.weekday] = (weekdayStats[d.drawType][d.weekday] || 0) + 1;
    });

    // 2. Identify the "Strongest" weekday for each type
    const powerWeekdays: Record<string, number> = {};
    Object.entries(weekdayStats).forEach(([type, stats]) => {
      const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
      powerWeekdays[type] = parseInt(sorted[0][0]);
    });

    // 3. Generate Calendar Data for the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const weekday = date.getUTCDay();

      // Find types that have this day as their "Power Day"
      const highlightedTypes = Object.entries(powerWeekdays)
        .filter(([type, powerDay]) => powerDay === weekday)
        .map(([type]) => type);

      // Simple "AI Score" for the day based on the number of power types
      const score = highlightedTypes.length * 30 + (Math.random() * 10);

      calendarDays.push({
        date: date.toISOString(),
        day,
        weekday,
        score: Math.min(score, 100),
        powerTypes: highlightedTypes,
        isToday: day === now.getDate()
      });
    }

    return NextResponse.json({
      month: currentMonth + 1,
      year: currentYear,
      powerWeekdays,
      days: calendarDays
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
