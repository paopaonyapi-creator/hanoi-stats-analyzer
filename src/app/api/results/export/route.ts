import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const draws = await prisma.drawResult.findMany({
      orderBy: { drawDate: 'desc' },
    });

    // Define CSV headers
    const headers = [
      'Date', 
      'Type', 
      'Full Result', 
      'Last 2', 
      'Last 3', 
      'Weekday', 
      'Source'
    ];

    // Format rows
    const rows = draws.map(d => [
      d.drawDate.toISOString().split('T')[0],
      d.drawType,
      d.resultDigits,
      d.last2,
      d.last3,
      d.weekday,
      d.source || 'N/A'
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return as a downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=hanoi_stats_export.csv'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
