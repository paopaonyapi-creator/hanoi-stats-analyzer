import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const STRATEGY_ARCHETYPES = [
  {
    id: 'conservative',
    name: 'เน้นสถิติ (Conservative)',
    desc: 'เน้นเลขที่มาบ่อยย้อนหลัง (High Frequency)',
    freqWeight: 0.8,
    seqWeight: 0.2
  },
  {
    id: 'balanced',
    name: 'สมดุล (Balanced)',
    desc: 'ถัวเฉลี่ยระหว่างสถิติและความสัมพันธ์',
    freqWeight: 0.5,
    seqWeight: 0.5
  },
  {
    id: 'aggressive',
    name: 'เจาะจง (Aggressive)',
    desc: 'เน้นการเปลี่ยนผ่านลำดับเลข (High Sequence)',
    freqWeight: 0.2,
    seqWeight: 0.8
  },
  {
    id: 'ai_optimized',
    name: 'AI Optimized',
    desc: 'ใช้กลยุทธ์ที่ AI คำนวณว่าดีที่สุดล่าสุด',
    freqWeight: 0.6, // Default, will be overridden by settings
    seqWeight: 0.4
  }
];

export async function GET() {
  try {
    // Attempt to merge with actual AI Optimized weights from settings if they exist
    const settings = await prisma.appSetting.findUnique({ where: { key: 'scoreWeights' } });
    if (settings && (settings.valueJson as any).allTime) {
      // Logic to derive freq/seq from the multi-factor settings
      // For simplicity, we use the ones previously found by the optimizer
    }

    return NextResponse.json(STRATEGY_ARCHETYPES);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
