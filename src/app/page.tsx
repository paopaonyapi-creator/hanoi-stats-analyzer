"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Database,
  Hash,
  TrendingUp,
  Upload,
  Award,
  Clock,
  ShieldCheck,
  Zap,
  Bot,
  Signal,
  LayoutDashboard,
  Tv,
  Microscope,
  FileDown,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ChartCard } from "@/components/common/chart-card";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { LiveMonitor } from "@/components/dashboard/LiveMonitor";
import { FortuneSpawner } from "@/components/dashboard/FortuneSpawner";
import { GapMatrix } from "@/components/dashboard/GapMatrix";
import { MarketRadar } from "@/components/dashboard/MarketRadar";
import { DRAW_TYPE_LABELS, DRAW_TYPE_COLORS, WEEKDAY_LABELS_EN } from "@/lib/constants";
import type { AnalysisSummary } from "@/types";

const TYPE_COLORS = [
  DRAW_TYPE_COLORS.SPECIAL,
  DRAW_TYPE_COLORS.NORMAL,
  DRAW_TYPE_COLORS.VIP,
];

export default function DashboardPage() {
  const [data, setData] = useState<AnalysisSummary | null>(null);
  const [accuracy, setAccuracy] = useState<{ hitRate: number; nearMissRate: number } | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      Promise.all([
        fetch("/api/analysis/summary").then((r) => r.json()),
        fetch("/api/predict/accuracy?days=30").then((r) => r.json()),
        fetch("/api/predict?type=NORMAL").then((r) => r.json()),
        fetch("/api/analysis/status").then((r) => r.json()),
        fetch("/api/analysis/briefing").then((r) => r.json())
      ])
        .then(([summary, acc, pred, statusData, briefData]) => {
          if (summary.error) {
            setError(summary.error);
          } else if (summary.totalRecords !== undefined) {
            setData(summary);
            if (!acc.error) setAccuracy(acc);
            if (pred.predictions) setPredictions(pred.predictions);
            if (!statusData.error) setStatus(statusData);
            if (!briefData.error) setBriefing(briefData);
          }
          setLoading(false);
        })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState />;
  if (error)
    return (
      <div className="text-center py-16 text-[var(--accent-rose)]">
        Error: {error}
      </div>
    );
  if (!data || data.totalRecords === 0) {
    return (
      <EmptyState
        title="ยินดีต้อนรับ"
        message="เริ่มต้นด้วยการนำเข้าข้อมูลเพื่อดูสถิติบน Dashboard"
        action={
          <Link href="/import" className="btn-primary">
            <Upload className="w-4 h-4 inline mr-2" />
            นำเข้าข้อมูล
          </Link>
        }
      />
    );
  }

  // Prepare chart data
  const typeChartData = (["SPECIAL", "NORMAL", "VIP"] as const).map((t) => ({
    name: DRAW_TYPE_LABELS[t],
    value: data.byType[t],
  }));

  const weekdayData = data.weekdayStats.map((w) => ({
    name: WEEKDAY_LABELS_EN[w.weekday],
    count: w.count,
  }));

  const top10Last2 = data.topLast2.slice(0, 10);

  const latestRecord = data.recentRecords[0];
  const hotLast2 = data.topLast2[0];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Intelligence Hub"
        description="Operational Command Center for Hanoi Intelligence Platform"
      >
        <div className="flex gap-2">
            <Link href="/analysis/broadcast" className="btn-secondary text-xs flex items-center gap-2 bg-[rgba(239,68,68,0.1)] border-[#ef444433] text-[var(--accent-rose)] hover:bg-[rgba(239,68,68,0.2)]">
                <Tv className="w-3.5 h-3.5" />
                Live TV
            </Link>
            <Link href="/analysis/simulation" className="btn-secondary text-xs flex items-center gap-2">
                <Microscope className="w-3.5 h-3.5" />
                Simulation
            </Link>
            <button onClick={() => window.open('/api/results/export')} className="btn-secondary text-xs flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5" />
                Export
            </button>
        </div>
      </PageHeader>

      {/* AI Daily Briefing Banner */}
      {briefing && (
          <div className="mb-6 glass-card p-4 border-l-4 border-l-[var(--accent-violet)] bg-[rgba(139,92,246,0.05)] flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-violet)] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                      <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <h4 className="text-[10px] font-black text-[var(--accent-violet)] uppercase tracking-[0.2em] mb-1">AI Daily Briefing</h4>
                      <p className="text-xs text-white leading-relaxed font-medium">"{briefing.generalBrief}"</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-[10px] text-[var(--text-muted)] text-right">
                      Assessment Score
                      <div className="text-sm font-black text-white">{Math.round(briefing.champion.energy)}%</div>
                  </div>
                  <Link href="/prediction" className="w-8 h-8 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--accent-violet)] transition-all group">
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white" />
                  </Link>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Tactical Status Zone */}
          <div className="lg:col-span-1 space-y-4">
              <div className="glass-card p-5 border-l-4 border-l-[var(--accent-emerald)]">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Integrity Status</span>
                      </div>
                      <span className="text-xs font-black text-white">{status?.integrity.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent-emerald)] rounded-full" style={{ width: `${status?.integrity.score}%` }}></div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">Data reliability is currently <span className="font-bold">{status?.integrity.level}</span></p>
              </div>

              {briefing && <MarketRadar data={briefing.assessments} />}

              <div className="glass-card p-5 border-l-4 border-l-[var(--accent-blue)]">
                  <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-4 h-4 text-[var(--accent-blue)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">Active Strategy</span>
                  </div>
                  <div className="text-sm font-black text-white mb-1 line-clamp-1">{status?.strategy.active}</div>
                  <div className="flex items-center gap-3">
                      <div className="text-[10px] text-[var(--text-muted)]">F: {Math.round(status?.strategy.weights.freqWeight * 100)}%</div>
                      <div className="text-[10px] text-[var(--text-muted)]">S: {Math.round(status?.strategy.weights.seqWeight * 100)}%</div>
                  </div>
              </div>
          </div>

          {/* Operation Monitor Zone */}
          <div className="lg:col-span-3">
              <LiveMonitor />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GapMatrix gaps={data.gapAnalysis} />
          <FortuneSpawner predictions={predictions} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="ข้อมูลทั้งหมด"
          value={data.totalRecords}
          icon={Database}
          color="blue"
          subtitle={`${data.totalDays} วัน`}
        />
        <StatCard
          label="งวดล่าสุด"
          value={latestRecord?.resultDigits || "-"}
          icon={Calendar}
          color="violet"
          subtitle={
            latestRecord
              ? `${new Date(latestRecord.drawDate).toLocaleDateString("th-TH")} (${DRAW_TYPE_LABELS[latestRecord.drawType]})`
              : undefined
          }
        />
        <StatCard
          label="AI Accuracy"
          value={accuracy ? `${accuracy.hitRate}%` : "-"}
          icon={Award}
          color="emerald"
          subtitle={`ในรอบ 30 วันที่ผ่านมา`}
        />
        <StatCard
          label="เลขที่มาบ่อย"
          value={hotLast2?.value || "-"}
          icon={TrendingUp}
          color="amber"
          subtitle={`${hotLast2?.count || 0} ครั้ง (${hotLast2?.percentage || 0}%)`}
        />
        <StatCard
          label="ประเภท"
          value={`${data.byType.SPECIAL}/${data.byType.NORMAL}/${data.byType.VIP}`}
          icon={Hash}
          color="blue"
          subtitle="Special / Normal / VIP"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hot Last2 */}
        <ChartCard title="เลข 2 ตัวท้ายที่พบบ่อย (Top 10)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10Last2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis
                dataKey="value"
                stroke="#6b7294"
                fontSize={12}
              />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f35",
                  border: "1px solid #2a3154",
                  borderRadius: "8px",
                  color: "#e8eaf6",
                }}
              />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Type Distribution */}
        <ChartCard title="สัดส่วนตามประเภท">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={typeChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={true}
              >
                {typeChartData.map((_, index) => (
                  <Cell key={index} fill={TYPE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1f35",
                  border: "1px solid #2a3154",
                  borderRadius: "8px",
                  color: "#e8eaf6",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Digit Frequency */}
        <ChartCard title="ความถี่ตัวเลข 0-9">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.digitFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f35",
                  border: "1px solid #2a3154",
                  borderRadius: "8px",
                  color: "#e8eaf6",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Weekday Distribution */}
        <ChartCard title="การกระจายตามวันในสัปดาห์">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="name" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f35",
                  border: "1px solid #2a3154",
                  borderRadius: "8px",
                  color: "#e8eaf6",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Month Trend */}
      {data.monthStats.length > 1 && (
        <div className="mb-4">
          <ChartCard title="แนวโน้มรายเดือน">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
                <XAxis dataKey="monthKey" stroke="#6b7294" fontSize={11} />
                <YAxis stroke="#6b7294" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1f35",
                    border: "1px solid #2a3154",
                    borderRadius: "8px",
                    color: "#e8eaf6",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Recent Records */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            ผลล่าสุด
          </h3>
          <Link
            href="/results"
            className="text-xs text-[var(--accent-blue)] hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ประเภท</th>
                <th>ผล</th>
                <th>2 ตัวท้าย</th>
                <th>3 ตัวท้าย</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(r.drawDate).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <span
                      className={`badge badge-${r.drawType.toLowerCase()}`}
                    >
                      {DRAW_TYPE_LABELS[r.drawType]}
                    </span>
                  </td>
                  <td className="font-mono font-bold">{r.resultDigits}</td>
                  <td className="font-mono text-[var(--accent-amber)]">
                    {r.last2}
                  </td>
                  <td className="font-mono text-[var(--accent-violet)]">
                    {r.last3}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
