"use client";

import { Activity, Zap } from "lucide-react";

interface MarketRadarEntry {
    label: string;
    density: string;
    energy: number;
    accuracy: number;
    integrity: number;
}

interface MarketRadarProps {
    data: MarketRadarEntry[];
}

const RADAR_VERSION = "2026.04";

export function MarketRadar({ data }: MarketRadarProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="glass-card p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[var(--accent-violet)]" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">Market Signal Breakdown</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {data.map((m, i) => {
                    const colors = [
                        'text-[var(--accent-rose)]',
                        'text-[var(--accent-blue)]',
                        'text-[var(--accent-violet)]'
                    ];
                    return (
                        <div key={i} className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-color)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-[10px] font-black uppercase ${colors[i]}`}>{m.label}</span>
                                <span className="text-[10px] font-bold text-white bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded">
                                    {m.density} Density
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <div className="text-[8px] text-[var(--text-muted)] uppercase mb-1">Energy</div>
                                    <div className="text-xs font-black text-white">{Math.round(m.energy)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[8px] text-[var(--text-muted)] uppercase mb-1">Accuracy</div>
                                    <div className="text-xs font-black text-white">{Math.round(m.accuracy)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[8px] text-[var(--text-muted)] uppercase mb-1">Integrity</div>
                                    <div className="text-xs font-black text-white">{Math.round(m.integrity)}%</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                    <span>Signal Sync: Active</span>
                </div>
                <div>v{RADAR_VERSION}</div>
            </div>
        </div>
    );
}
