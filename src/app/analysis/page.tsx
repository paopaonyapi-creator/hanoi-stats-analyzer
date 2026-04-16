"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/common/chart-card";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import {
  DRAW_TYPE_LABELS,
  DRAW_TYPE_COLORS,
  WEEKDAY_LABELS_EN,
  ROLLING_WINDOW_OPTIONS,
} from "@/lib/constants";
import type { AnalysisSummary, DrawType } from "@/types";

const TOOLTIP_STYLE = {
  background: "#1a1f35",
  border: "1px solid #2a3154",
  borderRadius: "8px",
  color: "#e8eaf6",
};

function AnalysisPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive state from URL or defaults
  const drawType = useMemo(() => searchParams.get("drawType") || "ALL", [searchParams]);
  const window = useMemo(() => parseInt(searchParams.get("window") || "0", 10), [searchParams]);

  const setDrawType = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "ALL") params.delete("drawType");
    else params.set("drawType", t);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setWindow = (w: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (w === 0) params.delete("window");
    else params.set("window", String(w));
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (drawType !== "ALL") params.set("drawType", drawType);
    if (window > 0) params.set("window", String(window));

    fetch(`/api/analysis/summary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [drawType, window]);

  if (loading) return <LoadingState />;
  if (!data || data.totalRecords === 0) {
    return <EmptyState message="ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์" />;
  }

  const typeDistData = (["SPECIAL", "NORMAL", "VIP"] as const).map((t) => ({
    name: DRAW_TYPE_LABELS[t],
    value: data.byType[t],
  }));
  const typeColors = [
    DRAW_TYPE_COLORS.SPECIAL,
    DRAW_TYPE_COLORS.NORMAL,
    DRAW_TYPE_COLORS.VIP,
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="วิเคราะห์สถิติ"
        description={`ข้อมูล ${data.totalRecords} รายการ · ${data.totalDays} วัน`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="tab-group">
          {["ALL", "SPECIAL", "NORMAL", "VIP"].map((t) => (
            <button
              key={t}
              className={`tab-item ${drawType === t ? "active" : ""}`}
              onClick={() => setDrawType(t)}
            >
              {t === "ALL" ? "ทั้งหมด" : DRAW_TYPE_LABELS[t as DrawType]}
            </button>
          ))}
        </div>
        <div className="tab-group">
          {ROLLING_WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`tab-item ${window === opt.value ? "active" : ""}`}
              onClick={() => setWindow(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Stewardship / Risk Intelligence */}
      {(data as any).riskIntelligence && (
        <div className="glass-card p-6 mb-6 border-l-4 border-[var(--accent-amber)] animate-pulse-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-amber)]">Financial Edge Insight</h3>
              <p className="text-sm font-medium text-white italic opacity-80">"Risk management is the only holy grail in probability."</p>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-black px-2 py-1 rounded border overflow-hidden ${
                (data as any).riskIntelligence.ev > 0 ? "border-[var(--accent-emerald)] text-[var(--accent-emerald)] bg-[rgba(16,185,129,0.1)]" : "border-[var(--accent-rose)] text-[var(--accent-rose)] bg-[rgba(244,63,94,0.1)]"
              }`}>
                {(data as any).riskIntelligence.backtestVerdict}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Expected Value (EV)</p>
              <p className={`text-2xl font-black ${(data as any).riskIntelligence.ev > 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-rose)]"}`}>
                {(data as any).riskIntelligence.ev > 0 ? "+" : ""}{((data as any).riskIntelligence.ev * 100).toFixed(1)}%
              </p>
              <p className="text-[8px] text-[var(--text-muted)] mt-1">กำไรคาดหวังต่อ 1 หน่วยเดิมพัน</p>
            </div>
            
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Kelly Stake (Optimum)</p>
              <p className="text-2xl font-black text-white">{((data as any).riskIntelligence.kellyStake * 100).toFixed(1)}%</p>
              <p className="text-[8px] text-[var(--text-muted)] mt-1">สัดส่วนเงินทุนที่แนะนำให้ลงต่อรอบ</p>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Max Drawdown Est.</p>
              <p className="text-2xl font-black text-[var(--accent-rose)]">{((data as any).riskIntelligence.monteCarlo.maxDrawdown * 100).toFixed(1)}%</p>
              <p className="text-[8px] text-[var(--text-muted)] mt-1">โอกาสการที่ทุนจะลดลงสูงสุด (จำลอง)</p>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Prob. of Bankroll Loss</p>
              <p className="text-2xl font-black text-white">{((data as any).riskIntelligence.monteCarlo.probOfLoss * 100).toFixed(1)}%</p>
              <p className="text-[8px] text-[var(--text-muted)] mt-1">ความเสี่ยงที่จะขาดทุนใน 30 วัน</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <p className="text-[9px] text-[var(--text-muted)] text-center font-medium">
              Simulation basis: 1,000 Monte Carlo paths over 30 days horizon using current Backtest Edge: <b>+{((data as any).riskIntelligence.backtestDelta * 100).toFixed(2)}%</b>
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-[var(--text-muted)]">รายการทั้งหมด</p>
          <p className="text-2xl font-bold">{data.totalRecords}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--text-muted)]">คี่:คู่</p>
          <p className="text-2xl font-bold">
            {data.oddEvenRatio.odd}:{data.oddEvenRatio.even}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--text-muted)]">ต่ำ:สูง</p>
          <p className="text-2xl font-bold">
            {data.lowHighRatio.low}:{data.lowHighRatio.high}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--text-muted)]">
            {data.dateRange
              ? `${new Date(data.dateRange.from).toLocaleDateString("th-TH")} - ${new Date(data.dateRange.to).toLocaleDateString("th-TH")}`
              : "-"}
          </p>
          <p className="text-lg font-bold">{data.totalDays} วัน</p>
        </div>
      </div>

      {/* Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Last2 Ranking */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.05)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Top 15: Two-Digit Frequency</h3>
            <span className="text-[10px] text-[var(--accent-violet)] font-black uppercase">Direct Value Rank</span>
          </div>
          <div className="space-y-2">
            {data.topLast2.slice(0, 15).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-[var(--text-muted)] w-4">#{idx + 1}</span>
                  <Link
                    href={`/analysis/number/${item.value}`}
                    className="text-lg font-black text-white transition-colors hover:text-[var(--accent-violet)]"
                  >
                    {item.value}
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Total Hits</div>
                    <div className="text-sm font-black text-white">{item.count}</div>
                  </div>
                  <div className="w-1.5 h-8 bg-[var(--accent-violet)] rounded-full opacity-50" 
                       style={{ height: `${(item.count / data.topLast2[0].count) * 2}rem` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Last3 Ranking */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.05)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Top 15: Three-Digit Frequency</h3>
            <span className="text-[10px] text-[var(--accent-blue)] font-black uppercase">Structural Rank</span>
          </div>
          <div className="space-y-2">
            {data.topLast3.slice(0, 15).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-[var(--text-muted)] w-4">#{idx + 1}</span>
                  <span className="text-lg font-black text-white">{item.value}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                    <div className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Total Hits</div>
                    <div className="text-sm font-black text-white">{item.count}</div>
                  </div>
                  <div className="w-1.5 h-8 bg-[var(--accent-blue)] rounded-full opacity-50" 
                       style={{ height: `${(item.count / data.topLast3[0].count) * 2}rem` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Frequency Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Digit Heatmap */}
        <div className="glass-card p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Digit Matrix</h3>
            <div className="grid grid-cols-5 gap-2">
                {data.digitFrequency.map((d, i) => {
                    const max = Math.max(...data.digitFrequency.map(x => x.count));
                    const op = (d.count / max) * 0.7 + 0.1;
                    return (
                        <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)]" style={{ backgroundColor: `rgba(6, 182, 212, ${op})` }}>
                            <div className="text-sm font-black text-white">{d.value}</div>
                            <div className="text-[8px] font-bold text-white opacity-60">{d.count}</div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Tens Heatmap */}
        <div className="glass-card p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Tens Position</h3>
            <div className="grid grid-cols-5 gap-2">
                {data.tensFrequency.map((d, i) => {
                    const max = Math.max(...data.tensFrequency.map(x => x.count));
                    const op = (d.count / max) * 0.7 + 0.1;
                    return (
                        <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)]" style={{ backgroundColor: `rgba(245, 158, 11, ${op})` }}>
                            <div className="text-sm font-black text-white">{d.value}</div>
                            <div className="text-[8px] font-bold text-white opacity-60">{d.count}</div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Units Heatmap */}
        <div className="glass-card p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Units Position</h3>
            <div className="grid grid-cols-5 gap-2">
                {data.unitsFrequency.map((d, i) => {
                    const max = Math.max(...data.unitsFrequency.map(x => x.count));
                    const op = (d.count / max) * 0.7 + 0.1;
                    return (
                        <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)]" style={{ backgroundColor: `rgba(16, 185, 129, ${op})` }}>
                            <div className="text-sm font-black text-white">{d.value}</div>
                            <div className="text-[8px] font-bold text-white opacity-60">{d.count}</div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Temporal and Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekday List */}
          <div className="glass-card p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Temporal Concentration</h3>
            <div className="space-y-3">
                {data.weekdayStats.sort((a,b) => b.count - a.count).map((w, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)] font-medium">{WEEKDAY_LABELS_EN[w.weekday]}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{w.count} hits</span>
                            <div className="w-24 h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--accent-rose)]" style={{ width: `${(w.count / (data.totalRecords/7)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Type Distribution Banners */}
          <div className="glass-card p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Market Volume Distribution</h3>
            <div className="grid grid-cols-1 gap-3">
                {typeDistData.map((type, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[i] }}></div>
                            <span className="text-xs font-bold text-white">{type.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-white">{type.value}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Volume</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* Monthly Summary (Numerical) */}
      {data.monthStats.length > 1 && (
          <div className="glass-card p-6 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-6">Monthly Historical Ingestion</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {[...data.monthStats].reverse().slice(0, 16).map((m, i) => (
                      <div key={i} className="text-center p-2 rounded bg-[var(--bg-input)]">
                          <div className="text-[8px] text-[var(--text-muted)] font-bold mb-1">{m.monthKey}</div>
                          <div className="text-sm font-black text-white">{m.count}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Gap Analysis Table */}
      <div className="glass-card p-4 mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Gap Analysis (เลขที่ไม่ออกนานที่สุด)
        </h3>
        <div className="overflow-x-auto" style={{ maxHeight: "300px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>เลข</th>
                <th>Gap ปัจจุบัน</th>
                <th>Gap สูงสุด</th>
                <th>Gap เฉลี่ย</th>
                <th>ออกล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {data.gapAnalysis.slice(0, 20).map((g) => (
                <tr key={g.value}>
                  <td className="font-mono font-bold text-[var(--accent-amber)]">
                    {g.value}
                  </td>
                  <td>{g.currentGap}</td>
                  <td>{g.maxGap}</td>
                  <td>{g.avgGap}</td>
                  <td className="text-[var(--text-muted)]">
                    {g.lastSeen || "ไม่เคยออก"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transition Analysis */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Transition Analysis (คู่ที่ตามกันบ่อย)
        </h3>
        <div className="overflow-x-auto" style={{ maxHeight: "300px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>จาก</th>
                <th>→</th>
                <th>ไป</th>
                <th>จำนวนครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {data.transitions.slice(0, 20).map((t, i) => (
                <tr key={i}>
                  <td className="font-mono font-bold">{t.from}</td>
                  <td className="text-[var(--text-muted)]">→</td>
                  <td className="font-mono font-bold text-[var(--accent-violet)]">
                    {t.to}
                  </td>
                  <td>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-[var(--text-muted)]">กำลังโหลด...</div>}>
      <AnalysisPageInner />
    </Suspense>
  );
}
