"use client";

import { useState, useEffect } from "react";
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
    Sparkles
} from "lucide-react";
import { 
    ResponsiveContainer, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    AreaChart,
    Area
} from "recharts";
import { DRAW_TYPE_LABELS } from "@/lib/constants";

export default function SimulationLabPage() {
    const [type, setType] = useState("NORMAL");
    const [period, setPeriod] = useState(30);
    const [freqWeight, setFreqWeight] = useState(0.6);
    const [seqWeight, setSeqWeight] = useState(0.4);
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [optimizationData, setOptimizationData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);

    const runSimulation = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/predict/backtest?type=${type}&period=${period}&freqWeight=${freqWeight}&seqWeight=${seqWeight}`);
            const d = await res.json();
            if (d.error) setError(d.error);
            else setData(d);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        setOptimizing(true);
        setError(null);
        try {
            const res = await fetch(`/api/predict/optimize?type=${type}&period=${period}`);
            const d = await res.json();
            if (d.error) setError(d.error);
            else {
                setOptimizationData(d);
                setFreqWeight(d.champion.freqWeight);
                setSeqWeight(d.champion.seqWeight);
                runSimulation();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setOptimizing(false);
        }
    };

    const handleApplySetttings = async () => {
        if (!optimizationData) return;
        setApplying(true);
        try {
            await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: "scoreWeights",
                    valueJson: {
                        allTime: optimizationData.champion.freqWeight * 5,
                        recent: optimizationData.champion.freqWeight * 3,
                        gap: optimizationData.champion.seqWeight * 4,
                        transition: optimizationData.champion.seqWeight * 4,
                        digitBalance: 1,
                        repeat: 1,
                        weekday: 1
                    },
                }),
            });
            alert("บันทึกการตั้งค่าสำเร็จเป็น Champion Weights แล้ว!");
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setApplying(false);
        }
    };

    useEffect(() => {
        runSimulation();
    }, []);

    let cumulativeHits = 0;
    const chartData = data?.results.map((r: any, idx: number) => {
        if (r.isHit) cumulativeHits++;
        return {
            date: new Date(r.date).toLocaleDateString("th-TH", { day: '2-digit', month: 'short' }),
            accuracy: parseFloat(((cumulativeHits / (idx + 1)) * 100).toFixed(1)),
            hit: r.isHit ? 100 : 0
        };
    }) || [];

    return (
        <div className="animate-fade-in">
            <PageHeader 
                title="AI Simulation Lab" 
                description="ห้องทดลองอัลกอริทึม - ปรับจูนน้ำหนักเพื่อหาแนวทางที่แม่นยำที่สุด"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4 text-[var(--accent-blue)]">
                            <Settings2 className="w-5 h-5" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Parameters</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">ประเภทหวย</label>
                                <select 
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent-blue)]"
                                >
                                    <option value="SPECIAL">ฮานอยพิเศษ</option>
                                    <option value="NORMAL">ฮานอยปกติ</option>
                                    <option value="VIP">ฮานอยวีไอพี</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">ย้อนหลัง (วัน): {period}</label>
                                <input 
                                    type="range" min="10" max="90" step="10"
                                    value={period}
                                    onChange={(e) => setPeriod(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]"
                                />
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)]">
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Frequency Weight: {Math.round(freqWeight * 100)}%</label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={freqWeight}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setFreqWeight(v);
                                        setSeqWeight(parseFloat((1 - v).toFixed(1)));
                                    }}
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-violet)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Sequence Weight: {Math.round(seqWeight * 100)}%</label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={seqWeight}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setSeqWeight(v);
                                        setFreqWeight(parseFloat((1 - v).toFixed(1)));
                                    }}
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-magenta)]"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button 
                                    onClick={runSimulation}
                                    disabled={loading || optimizing}
                                    className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Run Simulation
                                </button>

                                <button 
                                    onClick={handleOptimize}
                                    disabled={loading || optimizing}
                                    className="w-full bg-[var(--accent-emerald)] hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                >
                                    {optimizing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                                    Find Winning Weights
                                </button>
                            </div>
                        </div>
                    </div>

                    {optimizationData && (
                        <div className="glass-card p-4 border border-[var(--accent-emerald)] bg-[rgba(16,185,129,0.05)]">
                            <h4 className="text-[10px] font-black text-[var(--accent-emerald)] uppercase tracking-[0.2em] mb-3">Discovery Found!</h4>
                            <div className="text-xs text-white mb-2">Best Hit Rate: <span className="font-bold">{optimizationData.champion.hitRate}%</span></div>
                            <div className="text-[10px] text-[var(--text-muted)] mb-4">Weights: F{Math.round(optimizationData.champion.freqWeight * 100)} / S{Math.round(optimizationData.champion.seqWeight * 100)}</div>
                            <button 
                                onClick={handleApplySetttings}
                                disabled={applying}
                                className="w-full btn-primary text-[10px] py-2 flex items-center justify-center gap-2"
                            >
                                <Save className="w-3 h-3" />
                                Apply to System Settings
                            </button>
                        </div>
                    )}

                    <div className="glass-card p-5 bg-[rgba(59,130,246,0.05)] border-l-4 border-l-[var(--accent-blue)]">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white uppercase">
                            <Info className="w-4 h-4 text-[var(--accent-blue)]" />
                            Lab Guidance
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                            อัลกอริทึมจะจำลองเหตุการณ์ทีละขั้นตอน โดยใช้ข้อมูลในอดีต ณ เวลานั้นๆ มาคำนวณเลขเด็ด 10 ตัว แล้วเช็คกับผลรางวัลจริงเพื่อสรุปเป็น Hit Rate
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
                                <div className="glass-card p-6 flex flex-col items-center text-center">
                                    <Target className="w-6 h-6 text-[var(--accent-emerald)] mb-2" />
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Cumulative Hit Rate</span>
                                    <div className="text-4xl font-black text-white">{data.hitRate}%</div>
                                    <div className="text-[10px] text-[var(--accent-emerald)] font-bold mt-1">SUCCESSFUL BACKTEST</div>
                                </div>
                                <div className="glass-card p-6 flex flex-col items-center text-center">
                                    <History className="w-6 h-6 text-[var(--accent-blue)] mb-2" />
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Simulated Days</span>
                                    <div className="text-4xl font-black text-white">{data.period}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1">Days Sample Pool</div>
                                </div>
                                <div className="glass-card p-6 flex flex-col items-center text-center">
                                    <TrendingUp className="w-6 h-6 text-[var(--accent-violet)] mb-2" />
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Hits</span>
                                    <div className="text-4xl font-black text-white">{data.totalHits}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1">Top 10 Predictions</div>
                                </div>
                            </div>

                            <ChartCard title="Simulation Analysis: Cumulative Accuracy Over Time">
                                <div className="h-[300px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.3)" />
                                            <XAxis dataKey="date" stroke="#6b7294" fontSize={10} />
                                            <YAxis stroke="#6b7294" fontSize={10} domain={[0, 100]} />
                                            <Tooltip 
                                                contentStyle={{ background: "#1a1f35", border: "1px solid #2a3154", borderRadius: "12px" }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="accuracy" 
                                                stroke="#3b82f6" 
                                                fillOpacity={1} 
                                                fill="url(#accGradient)" 
                                                strokeWidth={3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <div className="glass-card overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                                    <h3 className="text-sm font-bold">Simulation Detailed Logs</h3>
                                    <span className="text-[10px] text-[var(--text-muted)] italic">Chronological Results</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>งวดวันที่</th>
                                                <th>ผลจริง</th>
                                                <th>การทำนาย</th>
                                                <th>สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.results.slice().reverse().map((r: any, i: number) => (
                                                <tr key={i} className={r.isHit ? 'bg-[rgba(16,185,129,0.1)]' : ''}>
                                                    <td className="text-xs">{new Date(r.date).toLocaleDateString("th-TH")}</td>
                                                    <td className="font-mono font-bold">{r.actual}</td>
                                                    <td className="text-[10px] font-mono flex flex-wrap gap-1">
                                                        {r.predicted.map((p: string) => (
                                                            <span key={p} className={p === r.actual ? 'text-emerald-400 font-bold' : ''}>{p}</span>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        {r.isHit ? (
                                                            <span className="text-[var(--accent-emerald)] font-bold text-xs uppercase">Hit!</span>
                                                        ) : (
                                                            <span className="text-[var(--text-muted)] text-xs uppercase">Miss</span>
                                                        )}
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
