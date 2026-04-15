"use client";

import { useState, useEffect } from "react";
import { Search, Database, TrendingUp, History, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DRAW_TYPE_LABELS } from "@/lib/constants";
import { ChartCard } from "@/components/common/chart-card";

interface SearchResult {
    value: string;
    type: string;
    totalHits: number;
    currentGap: number;
    latestHit: {
        date: string;
        type: string;
        result: string;
    } | null;
    aiAnalysis: {
        confidence: number;
        recommendation: string;
        color: string;
    };
    topCompanions: { val: string; count: number }[];
    recentHits: {
        date: string;
        type: string;
        last2: string;
        last3: string;
    }[];
}

export default function NumberSearchPage() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = (val: string) => {
        if (val.length < 2 || val.length > 3) return;
        
        setLoading(true);
        setError(null);
        fetch(`/api/analysis/number/${val}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setResult(data);
                setLoading(false);
            })
            .catch(err => {
                setError("เกิดข้อผิดพลาดในการค้นหา");
                setLoading(false);
            });
    };

    // Auto search when query length is 2 or 3
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length === 2 || query.length === 3) {
                handleSearch(query);
            } else {
                setResult(null);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="animate-slide-up">
            <PageHeader 
                title="Number Intelligence" 
                description="เจาะลึกข้อมูลเลขรายตัวด้วย AI และสถิติย้อนหลัง"
            />

            {/* Search Bar Container */}
            <div className="max-w-xl mx-auto mb-10">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 flex items-center gap-3">
                        <div className="pl-4">
                            <Search className="w-5 h-5 text-[var(--accent-blue)]" />
                        </div>
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, "").substring(0, 3))}
                            placeholder="พิมพ์เลข 2 หรือ 3 หลักที่ต้องการค้นหา..."
                            className="bg-transparent border-none focus:ring-0 text-lg py-3 flex-1 text-white placeholder-[var(--text-muted)]"
                        />
                        {loading && (
                            <div className="pr-4">
                                <span className="flex h-3 w-3 rounded-full bg-[var(--accent-blue)] animate-ping"></span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center uppercase tracking-widest">
                    ค้นหาได้ทั้งเลข 2 ตัว (00-99) และ 3 ตัว (000-999)
                </p>
            </div>

            {error && (
                <div className="max-w-xl mx-auto p-4 rounded-xl bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] text-[var(--accent-rose)] text-sm flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Hero Result Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-card overflow-hidden h-full relative">
                            <div className={`absolute top-0 right-0 p-3 px-4 rounded-bl-2xl font-bold text-[10px] uppercase tracking-tighter text-white bg-[var(--accent-${result.aiAnalysis.color})]`}>
                                {result.type} Record
                            </div>
                            
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <h2 className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-4">
                                    {result.value}
                                </h2>
                                
                                <div className="flex flex-col gap-1 mb-8">
                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">AI Recommendation</span>
                                    <span className={`text-lg font-bold text-[var(--accent-${result.aiAnalysis.color})]`}>
                                        {result.aiAnalysis.recommendation}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full border-t border-[var(--border-color)] pt-6">
                                    <div className="text-center">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Total Hits</p>
                                        <p className="text-xl font-bold">{result.totalHits} ครั้ง</p>
                                    </div>
                                    <div className="text-center border-l border-[var(--border-color)]">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Current Gap</p>
                                        <p className="text-xl font-bold">{result.currentGap} งวด</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence & History */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Latest Appearance */}
                        {result.latestHit && (
                            <div className="glass-card p-5 border-l-4 border-l-[var(--accent-blue)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="w-5 h-5 text-[var(--accent-blue)]" />
                                    <h3 className="text-sm font-semibold">สัญญาณล่าสุด</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">ออกล่าสุดเมื่อ</p>
                                        <p className="text-lg font-bold">{new Date(result.latestHit.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--text-muted)]">ในประเภท</p>
                                        <span className={`badge badge-${result.latestHit.type.toLowerCase()}`}>
                                            {DRAW_TYPE_LABELS[result.latestHit.type as any]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent History Table */}
                        <ChartCard title="ประวัติการย้อนหลัง 10 งวดที่ออก">
                            <div className="overflow-x-auto mt-2">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>วันที่ออก</th>
                                            <th>ประเภท</th>
                                            <th>ผลรางวัลเต็ม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.recentHits.map((h, i) => (
                                            <tr key={i} className="hover:bg-[var(--bg-input)]">
                                                <td className="text-xs">
                                                    {new Date(h.date).toLocaleDateString("th-TH")}
                                                </td>
                                                <td>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]`}>
                                                        {DRAW_TYPE_LABELS[h.type as any]}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-[var(--accent-amber)] font-bold">
                                                    {result.type === '2D' ? h.last2 : h.last3}
                                                </td>
                                            </tr>
                                        ))}
                                        {result.recentHits.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-[var(--text-muted)]">ไม่พบประวัติการออกรางวัล</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                </div>
            )}
            
            {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Database className="w-16 h-16 mb-4" />
                    <p className="text-sm">รอใส่เลขเด็ดเพื่อเริ่มต้นการวิเคราะห์...</p>
                </div>
            )}
        </div>
    );
}
