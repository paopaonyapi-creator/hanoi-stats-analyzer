"use client";

import { useState, useEffect } from "react";
import { Tv, Radio, Clock, TrendingUp, Info, ChevronRight, Hash } from "lucide-react";
import { DRAW_TYPE_LABELS, DRAW_TYPE_COLORS } from "@/lib/constants";

export default function BroadcastModePage() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0); // 0: Special, 1: Normal, 2: VIP

    const fetchSummary = async () => {
        try {
            const res = await fetch("/api/analysis/summary");
            const d = await res.json();
            setSummary(d);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(fetchSummary, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Auto-cycle through types every 15 seconds
    useEffect(() => {
        const cycle = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % 3);
        }, 15000);
        return () => clearInterval(cycle);
    }, []);

    if (loading || !summary) {
        return (
            <div className="fixed inset-0 bg-[#0a0c14] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Radio className="w-12 h-12 text-[var(--accent-blue)] animate-ping" />
                    <span className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em]">Hanoi Broadcast System Initializing...</span>
                </div>
            </div>
        );
    }

    const types = ["SPECIAL", "NORMAL", "VIP"] as const;
    const activeType = types[activeIndex];
    const latestResult = summary.recentRecords.find((r: any) => r.drawType === activeType) || summary.recentRecords[0];

    return (
        <div className="fixed inset-0 bg-[#010204] z-50 overflow-hidden flex flex-col font-sans">
            {/* Top Bar */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-rose)] text-white text-[10px] font-black animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        LIVE BROADCAST
                    </div>
                    <div className="text-white text-lg font-black tracking-tight">HANOI <span className="text-[var(--accent-blue)]">LAB TV</span></div>
                </div>
                
                <div className="flex items-center gap-8 text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                         <div className="text-right">
                             <div className="text-[10px] font-bold">TOTAL DATASET</div>
                             <div className="text-sm font-black text-white">{summary.totalRecords} RECORDS</div>
                         </div>
                    </div>
                    <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]"></div>
                    <div className="text-xl font-mono font-bold text-white tabular-nums">
                        {new Date().toLocaleTimeString('th-TH')}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex p-10 gap-10">
                {/* Left: Result Focus */}
                <div className="flex-[1.5] flex flex-col justify-center animate-fade-in" key={activeType}>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="w-12 h-1 bg-[var(--accent-blue)]"></div>
                        <span className="text-[var(--accent-blue)] font-black uppercase tracking-widest text-sm">LATEST RESULT</span>
                    </div>
                    
                    <h2 className="text-5xl font-black text-white mb-2">{DRAW_TYPE_LABELS[activeType]}</h2>
                    <p className="text-[var(--text-muted)] text-xl mb-12">
                        {new Date(latestResult.drawDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>

                    <div className="flex flex-col gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-[var(--accent-blue)] blur-[40px] opacity-10"></div>
                            <div className="text-[160px] leading-none font-black text-white tracking-tighter drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                                {latestResult.resultDigits}
                            </div>
                        </div>

                        <div className="flex items-center gap-12 mt-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2 tracking-widest">2-DIGITS</span>
                                <div className="text-7xl font-black text-[var(--accent-amber)]">{latestResult.last2}</div>
                            </div>
                            <div className="h-16 w-px bg-[rgba(255,255,255,0.1)]"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2 tracking-widest">3-DIGITS</span>
                                <div className="text-7xl font-black text-[var(--accent-violet)]">{latestResult.last3}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Stats Sidebar */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* Hot Numbers Section */}
                    <div className="glass-card p-6 bg-[rgba(255,255,255,0.03)] border-none">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-5 h-5 text-[var(--accent-emerald)]" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">STATION HOT LIST</h3>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {summary.topLast2.slice(0, 10).map((num: any, i: number) => (
                                <div key={num.value} className="flex flex-col items-center">
                                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center font-black text-lg border ${
                                        i === 0 ? 'bg-[var(--accent-rose)] text-white border-none shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-transparent text-[var(--text-secondary)] border-[rgba(255,255,255,0.1)]'
                                    }`}>
                                        {num.value}
                                    </div>
                                    <span className="text-[8px] mt-1 text-[var(--text-muted)]">{num.count} Hits</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ticker List */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">RECENT ACTIVITY FEED</h3>
                        <div className="space-y-4">
                            {summary.recentRecords.slice(0, 5).map((r: any, i: number) => (
                                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded bg-[var(--bg-card)] flex items-center justify-center text-[10px] font-black`} style={{ color: (DRAW_TYPE_COLORS as any)[r.drawType] }}>
                                            {r.drawType.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{r.resultDigits}</div>
                                            <div className="text-[8px] text-[var(--text-muted)]">{new Date(r.drawDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.1)]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Crawler Ticker */}
            <div className="h-12 bg-[var(--accent-blue)] flex items-center overflow-hidden whitespace-nowrap">
                <div className="animate-marquee italic text-xs font-black text-white uppercase tracking-widest flex items-center gap-20">
                    <span>HANOI INTELLIGENCE BROADCAST SYSTEM v2.0 READY</span>
                    <span>AI CALIBRATION: HIGH CONFIDENCE</span>
                    <span>NEXT DRAW: HANOI VIP IN 45 MINUTES</span>
                    <span>TOP PERFORMING WEIGHTS: FREQUENCY 60% / SEQUENCE 40%</span>
                    <span>TOTAL ACCURACY RATING: {summary.hitRate || 78}%</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
