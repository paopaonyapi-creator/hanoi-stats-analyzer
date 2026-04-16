"use client";

import { useState, useEffect } from "react";
import { 
    Radar, 
    TrendingUp, 
    Flame, 
    Zap, 
    Target, 
    AlertCircle,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Crosshair
} from "lucide-react";

export default function TrendRadarPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMarket, setSelectedMarket] = useState("NORMAL");

    const fetchMomentum = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/truth/momentum");
            const d = await res.json();
            if (d.error) setError(d.error);
            else setData(d);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMomentum();
    }, []);

    const momentumMap = data?.marketMomentum?.[selectedMarket] || {};
    const numbers = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));

    const getMomentumColor = (score: number) => {
        if (score > 1.8) return "bg-[rgb(219,39,119)] text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]"; // Hot Pink
        if (score > 1.4) return "bg-[rgb(124,58,237)] text-white"; // Violet
        if (score > 1.1) return "bg-[rgb(59,130,246)] text-white"; // Blue
        if (score < 0.6) return "bg-[rgba(255,255,255,0.02)] text-[var(--text-muted)]"; // Dim
        return "bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]";
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-start mb-8">
                <div>
                   <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-violet)] to-[var(--accent-magenta)] mb-2 uppercase tracking-tighter">
                     Numerical Trend Radar
                   </h1>
                   <p className="text-[var(--text-secondary)] text-sm">
                     ตรวจจับแรงเหวี่ยงของตัวเลข (Velocity) และจุดรวมความร้อน (Heat Zones) ข้ามตลาด
                   </p>
                </div>
                <button 
                    onClick={fetchMomentum}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-all"
                >
                    <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tactical Pane */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-[var(--accent-magenta)]">
                            <Flame className="w-5 h-5" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Hyper-Active Streaks</h3>
                        </div>
                        <div className="space-y-4">
                            {data?.hyperActive?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-magenta)] transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl font-black text-white group-hover:text-[var(--accent-magenta)] transition-colors">
                                            {item.number}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase italic">Velocity</div>
                                            <div className="text-xs font-bold text-[var(--accent-emerald)]">{item.velocity}x</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase italic">Acc.</div>
                                        <div className="text-xs font-bold text-white">{(item.acceleration * 100).toFixed(0)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-[var(--accent-blue)]">
                        <div className="flex items-center gap-2 mb-4 text-[var(--accent-blue)]">
                            <Crosshair className="w-5 h-5" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Market Intersection</h3>
                        </div>
                        <div className="space-y-2">
                             {Object.entries(data?.aggregated || {})
                                .filter(([_, val]: any) => val.marketsHot.length > 1)
                                .map(([num, val]: any) => (
                                    <div key={num} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(59,130,246,0.05)] text-[10px]">
                                        <span className="font-black text-white text-sm">{num}</span>
                                        <div className="flex gap-1">
                                            {val.marketsHot.map((m: string) => (
                                                <span key={m} className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-[8px] font-black">{m}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                             }
                        </div>
                    </div>
                </div>

                {/* Main Radar Grid */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        {["NORMAL", "SPECIAL", "VIP"].map(m => (
                            <button 
                                key={m}
                                onClick={() => setSelectedMarket(m)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    selectedMarket === m 
                                    ? 'bg-white text-black' 
                                    : 'text-[var(--text-muted)] hover:text-white'
                                }`}
                            >
                                {m} MARKET
                            </button>
                        ))}
                    </div>

                    <div className="glass-card p-8">
                        <div className="grid grid-cols-10 gap-3">
                            {numbers.map((num) => {
                                const m = momentumMap[num];
                                const score = m?.compositeScore || 0;
                                return (
                                    <div 
                                        key={num}
                                        className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-500 hover:scale-110 cursor-help group relative ${getMomentumColor(score)}`}
                                    >
                                        <div className="text-lg font-black leading-none">{num}</div>
                                        {m?.isHeatingUp && (
                                            <Zap className="w-2 h-2 absolute top-1 right-1 text-yellow-400" />
                                        )}
                                        
                                        {/* Hover Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-3 bg-black border border-[var(--border-color)] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 shadow-2xl">
                                            <div className="text-[10px] font-black text-[var(--accent-blue)] mb-1 uppercase">Momentum Report</div>
                                            <div className="text-xs text-white flex justify-between">V: <span>{m?.velocity}x</span></div>
                                            <div className="text-xs text-white flex justify-between">A: <span>{(m?.acceleration * 100).toFixed(0)}%</span></div>
                                            <div className="text-xs text-white border-t border-[rgba(255,255,255,0.1)] mt-2 pt-1 flex justify-between">Heat: <span className="font-bold">{score.toFixed(1)}</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 bg-gradient-to-br from-[rgba(219,39,119,0.1)] to-transparent">
                            <div className="flex items-center gap-2 mb-2 text-[var(--accent-magenta)]">
                                <ArrowUpRight className="w-5 h-5" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Velocity Concept</h3>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                ค่า Velocity {">"} 1.2 หมายถึงเลขนี้กำลังออกบ่อยกว่าค่าเฉลี่ยทางสถิติปกติอย่างมีนัยสำคัญ สีชมพูเข้มแสดงถึงเลขที่กำลังอยู่ในช่วง <b>Hyper-Active</b>
                            </p>
                        </div>
                        <div className="glass-card p-6 bg-gradient-to-br from-[rgba(59,130,246,0.1)] to-transparent">
                            <div className="flex items-center gap-2 mb-2 text-[var(--accent-blue)]">
                                <Zap className="w-5 h-5" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Acceleration Factor</h3>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                วัดการเปลี่ยนแปลงของความถี่ในช่วง 3 งวดล่าสุดเทียบกับ 30 งวด ถ้า Acc สูงกว่า 100% แสดงว่าเลขนั้นกำลังเร่งตัวขึ้นอย่างรุนแรง
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
