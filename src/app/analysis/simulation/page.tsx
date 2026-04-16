"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { ChartCard } from "@/components/common/chart-card";
import { 
    Play, 
    Settings2, 
    TrendingUp, 
    History, 
    Zap, 
    Target, 
    AlertCircle,
    Info,
    Trophy,
    Save,
    Sparkles,
    Activity,
    ShieldCheck,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "@/lib/truth/constants";

type Pillar = "statistical" | "pattern" | "market" | "stability";

export default function SimulationLabPage() {
    const [type, setType] = useState("NORMAL");
    const [period, setPeriod] = useState(30);
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);

    // Pillar-based weights (each controls a group of underlying Truth weights)
    const [pillars, setPillars] = useState<Record<Pillar, number>>({
        statistical: 1.0,
        pattern: 1.0,
        market: 1.0,
        stability: 1.0
    });

    const computeFinalWeights = useCallback(() => {
        const base = DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
        return {
            frequencyAllTime: base.frequencyAllTime * pillars.statistical,
            frequencyRecent: base.frequencyRecent * pillars.statistical,
            recencyDecay: base.recencyDecay * pillars.statistical,
            varianceStability: base.varianceStability * pillars.statistical,
            transition: base.transition * pillars.pattern,
            patternStrength: base.patternStrength * pillars.pattern,
            windowConsistency: base.windowConsistency * pillars.pattern,
            marketCorrelation: base.marketCorrelation * pillars.market,
            bayesianBias: base.bayesianBias * pillars.market,
            weekdayAlignment: base.weekdayAlignment * pillars.market,
            gapReturn: base.gapReturn * pillars.stability,
            digitBalance: base.digitBalance * pillars.stability,
        };
    }, [pillars]);

    const runSimulation = async () => {
        setLoading(true);
        setError(null);
        try {
            const weights = computeFinalWeights();
            const res = await fetch(`/api/predict/backtest?type=${type}&period=${period}&weights=${JSON.stringify(weights)}`);
            const d = await res.json();
            if (d.error) setError(d.error);
            else setData(d);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApplySetttings = async () => {
        setApplying(true);
        try {
            const weights = computeFinalWeights();
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: "scoreWeights",
                    valueJson: weights,
                }),
            });
            const d = await res.json();
            if (d.error) throw new Error(d.error);
            alert("บันทึกน้ำหนักชุดนี้เข้าสู่ระบบหลัก (Apex Engine) เรียบร้อยแล้ว!");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setApplying(false);
        }
    };

    useEffect(() => {
        runSimulation();
    }, [type, period]);

    const results = data?.results || [];

    return (
        <div className="animate-slide-up">
            <div className="flex justify-between items-start mb-6">
                <div>
                   <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-neon mb-2">
                     AI Simulation Lab
                   </h1>
                   <p className="text-[var(--text-secondary)] text-sm">
                     ห้องทดลองอัลกอริทึม Apex v2.1 — จำลองเหตุการณ์ย้อนหลังเพื่อหาจุดสร้างกำไรสูงสุด
                   </p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-[rgba(236,72,153,0.1)] px-3 py-1.5 rounded-lg border border-[rgba(236,72,153,0.2)]">
                    <Sparkles className="w-4 h-4 text-[var(--accent-magenta)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Truthparagon v2.1</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-[var(--accent-blue)]">
                            <Settings2 className="w-5 h-5" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Engine Parameters</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Target Market</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {["NORMAL", "SPECIAL", "VIP"].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                                type === t 
                                                ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' 
                                                : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">History Depth: {period} Days</label>
                                <input 
                                    type="range" min="10" max="100" step="10"
                                    value={period}
                                    onChange={(e) => setPeriod(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]"
                                />
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)] space-y-5">
                                <label className="block text-[10px] font-black text-white uppercase tracking-wider mb-2">Intelligence Pillars</label>
                                
                                {(Object.entries(pillars) as [Pillar, number][]).map(([key, val]) => (
                                    <div key={key}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-bold text-[var(--text-muted)] capitalize">{key}</span>
                                            <span className="text-[10px] font-black text-white">{Math.round(val * 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="2.5" step="0.1"
                                            value={val}
                                            onChange={(e) => setPillars(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-violet)]"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <button 
                                    onClick={runSimulation}
                                    disabled={loading}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                >
                                    {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Simulate Truth Engine
                                </button>
                                
                                <button 
                                    onClick={handleApplySetttings}
                                    disabled={applying || !data}
                                    className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Apply Champion Weights
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-5 bg-[rgba(59,130,246,0.05)] border-l-4 border-l-[var(--accent-blue)]">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-white uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-[var(--accent-blue)]" />
                            Simulation Integrity
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                            ระบบรัน Backtest แบบ <b>Walk-Forward</b> เพื่อจำลองการทำนายในสภาวะจริง โดยไม่ใช้ข้อมูลในอนาคต ทำให้ผลลัพธ์ที่ได้ใกล้เคียงกับการใช้งานจริงที่สุด
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-3 space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-[rgba(244,63,94,0.1)] border border-[var(--accent-rose)] text-[var(--accent-rose)] text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {data && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Trophy className="w-12 h-12" />
                                    </div>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Total Hit Rate</span>
                                    <div className="text-5xl font-black text-white mb-1">{data.hitRate}%</div>
                                    <div className="text-[10px] font-bold text-[var(--accent-emerald)] uppercase tracking-widest">
                                        Verdict: {data.verdict}
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex flex-col items-center text-center">
                                    <BarChart3 className="w-6 h-6 text-[var(--accent-blue)] mb-2" />
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Avg Edge Delta</span>
                                    <div className="text-4xl font-black text-white">+{((data.averageDelta || 0) * 100).toFixed(1)}%</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase">Over Baseline Top 10</div>
                                </div>
                                <div className="glass-card p-6 flex flex-col items-center text-center">
                                    <Activity className="w-6 h-6 text-[var(--accent-violet)] mb-2" />
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Total Hits</span>
                                    <div className="text-4xl font-black text-white">{data.totalHits}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase">Draw events processed</div>
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Performance Pulse Timeline</h3>
                                    <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                                    {results.filter((_: any, i: number) => i % Math.ceil(results.length / 5) === 0 || i === results.length - 1).map((item: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)] text-center relative hover:border-[var(--accent-blue)] transition-all">
                                            <div className="text-[9px] text-[var(--text-muted)] font-black mb-2 uppercase tracking-tighter">{new Date(item.date).toLocaleDateString()}</div>
                                            <div className={`text-xl font-black  ${item.isHit ? 'text-[var(--accent-emerald)]' : 'text-white'}`}>
                                                {item.isHit ? 'HIT!' : 'MISS'}
                                            </div>
                                            <div className="text-[8px] text-[var(--text-muted)] font-black uppercase mt-1">Delta: {(item.edgeDelta * 100).toFixed(1)}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Detailed Event Log</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--accent-emerald)]"></div> Hit</span>
                                        <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]"></div> Miss</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                                            <tr className="border-b border-[var(--border-color)]">
                                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Draw Date</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Actual</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Apex Candidate Pool</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Edge Delta</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.slice().reverse().map((r: any, i: number) => (
                                                <tr key={i} className={`border-b border-[rgba(255,255,255,0.03)] transition-colors ${r.isHit ? 'bg-[rgba(16,185,129,0.08)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
                                                    <td className="py-4 px-6 text-[10px] font-mono font-bold text-[var(--text-muted)]">{new Date(r.date).toLocaleDateString()}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-xl font-black text-white">{r.actual}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {r.predicted.map((num: string) => (
                                                                <span key={num} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                                                    num === r.actual 
                                                                    ? 'bg-[var(--accent-emerald)] border-[var(--accent-emerald)] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]Scale-110' 
                                                                    : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[var(--text-muted)]'
                                                                }`}>
                                                                    {num}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className={`py-4 px-6 text-right font-mono font-black text-xs ${
                                                        r.edgeDelta > 0 ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-rose)]'
                                                    }`}>
                                                        {r.edgeDelta > 0 ? '+' : ''}{(r.edgeDelta * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
