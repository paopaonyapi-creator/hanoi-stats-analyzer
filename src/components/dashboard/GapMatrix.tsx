"use client";

/* eslint-disable react/no-unescaped-entities */

import { useMemo } from "react";
import { Info } from "lucide-react";

interface GapEntry {
    value: string;
    currentGap: number;
    maxGap: number;
    avgGap: number;
}

interface GapMatrixProps {
    gaps: GapEntry[];
}

export function GapMatrix({ gaps }: GapMatrixProps) {
    // Ensure we have exactly 100 entries (00-99)
    const gridData = useMemo(() => {
        const full = Array.from({ length: 100 }, (_, i) => {
            const val = i.toString().padStart(2, '0');
            const found = gaps.find(g => g.value === val);
            return found || { value: val, currentGap: 0, maxGap: 0, avgGap: 0 };
        });
        return full;
    }, [gaps]);

    // Calculate heat color based on currentGap
    const getHeatColor = (gap: number) => {
        if (gap === 0) return 'bg-[rgba(255,255,255,0.03)]'; // Just appeared
        if (gap < 10) return 'bg-[rgba(16,185,129,0.1)] border-[#10b98122]'; // Greenish
        if (gap < 25) return 'bg-[rgba(59,130,246,0.2)] border-[#3b82f644]'; // Bluish
        if (gap < 50) return 'bg-[rgba(239,68,68,0.3)] border-[#ef444455]'; // Reddish
        return 'bg-[rgba(239,68,68,0.6)] border-[#ef4444aa] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]'; // VERY HOT
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Gap Matrix (00-99)</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[rgba(239,68,68,0.6)]"></div>
                        <span>Overdue (50+)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[rgba(59,130,246,0.2)]"></div>
                        <span>Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-10 gap-1 sm:gap-2">
                {gridData.map((item) => (
                    <div 
                        key={item.value}
                        title={`Number ${item.value}\nGap: ${item.currentGap} draws\nMax Gap: ${item.maxGap}\nAvg Gap: ${item.avgGap}`}
                        className={`
                            aspect-square rounded-md border flex flex-col items-center justify-center transition-all cursor-help
                            ${getHeatColor(item.currentGap)}
                        `}
                    >
                        <span className="text-[10px] sm:text-xs font-mono">{item.value}</span>
                        {item.currentGap > 20 && (
                            <span className="text-[8px] opacity-70 leading-none">{item.currentGap}</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)]">
                <Info className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    ตาราง Gap Matrix แสดงระยะเวลาที่ตัวเลขแต่ละตัวยังไม่ปรากฏออกมา (Current Gap) 
                    ตัวเลขที่เป็นสีแดงเข้ม (Hot) คือตัวเลขที่ "ค้าง" อยู่นานกว่าปกติเมื่อเทียบกับค่าเฉลี่ย
                </p>
            </div>
        </div>
    );
}
