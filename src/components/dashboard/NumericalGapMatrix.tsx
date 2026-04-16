"use client";

import React, { useMemo } from 'react';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

interface GapMatrixProps {
  records: any[];
  title?: string;
}

export const NumericalGapMatrix: React.FC<GapMatrixProps> = ({ records, title = "Numerical Gap Matrix (00-99)" }) => {
  const gapData = useMemo(() => {
    const gaps = new Array(100).fill(-1);
    const lastSeen = new Array(100).fill(null);
    
    // Sort records descending (latest first)
    const sorted = [...records].sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
    
    // Find first occurrence of each number
    const seenCount = new Set();
    sorted.forEach((record, index) => {
      const num = parseInt(record.last2);
      if (!seenCount.has(num)) {
        gaps[num] = index;
        seenCount.add(num);
      }
    });

    // Handle never seen numbers (set to total records or very high)
    for (let i = 0; i < 100; i++) {
        if (gaps[i] === -1) gaps[i] = sorted.length;
    }

    return gaps;
  }, [records]);

  const maxGap = Math.max(...gapData);
  const avgGap = gapData.reduce((a, b) => a + b, 0) / 100;

  // Helper for heatmap color (numerical context)
  const getBgColor = (gap: number) => {
    const ratio = Math.min(1, gap / (avgGap * 2.5));
    if (gap > avgGap * 1.5) {
        return `rgba(236, 72, 153, ${0.1 + ratio * 0.4})`; // Pink/Magenta for "Overdue"
    }
    if (gap < avgGap * 0.5) {
        return `rgba(59, 130, 246, ${0.05 + ratio * 0.2})`; // Blue for "Frequent"
    }
    return 'rgba(255, 255, 255, 0.02)';
  };

  const getTextColor = (gap: number) => {
      if (gap > avgGap * 2) return 'var(--accent-magenta)';
      if (gap < 3) return 'var(--accent-emerald)';
      return 'white';
  };

  return (
    <div className="glass-card p-6 border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
            <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Avg Gap: {avgGap.toFixed(1)}</span>
            <span className="flex items-center gap-1 text-[var(--accent-magenta)]"><ShieldAlert className="w-3 h-3" /> Max: {maxGap}</span>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1.5 lg:gap-2">
        {gapData.map((gap, i) => {
          const numStr = i.toString().padStart(2, '0');
          return (
            <div 
              key={i}
              className="group relative flex flex-col items-center justify-center aspect-square rounded-md border border-[rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-110 hover:z-20 hover:border-[var(--accent-blue)] cursor-default"
              style={{ backgroundColor: getBgColor(gap) }}
            >
              <span className="text-xs lg:text-sm font-black transition-colors" style={{ color: getTextColor(gap) }}>
                {numStr}
              </span>
              <span className="text-[7px] lg:text-[8px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                {gap}
              </span>
              
              {/* Dense Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-24 p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[8px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl z-30">
                  <div className="font-bold text-white border-b border-[var(--border-color)] pb-1 mb-1">Digit: {numStr}</div>
                  <div className="flex justify-between"><span>Current Gap:</span> <span className="text-[var(--accent-blue)]">{gap}</span></div>
                  <div className="flex justify-between"><span>Frequency:</span> <span>{records.filter(r => parseInt(r.last2) === i).length}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
