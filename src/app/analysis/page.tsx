"use client";

import { useEffect, useState } from "react";
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

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawType, setDrawType] = useState("ALL");
  const [window, setWindow] = useState(0);

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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top Last2 */}
        <ChartCard title="เลข 2 ตัวท้ายที่พบบ่อย (Top 15)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topLast2.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={11} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Last3 */}
        <ChartCard title="เลข 3 ตัวท้ายที่พบบ่อย (Top 15)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topLast3.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={11} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Digit Frequency */}
        <ChartCard title="ความถี่ตัวเลข 0-9">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.digitFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tens Frequency */}
        <ChartCard title="ความถี่หลักสิบ">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.tensFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Units Frequency */}
        <ChartCard title="ความถี่หลักหน่วย">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.unitsFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="value" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Weekday Distribution */}
        <ChartCard title="การกระจายตามวัน">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.weekdayStats.map((w) => ({
                name: WEEKDAY_LABELS_EN[w.weekday],
                count: w.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="name" stroke="#6b7294" fontSize={12} />
              <YAxis stroke="#6b7294" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Type Distribution Donut */}
        <ChartCard title="สัดส่วนประเภท">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeDistData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {typeDistData.map((_, i) => (
                  <Cell key={i} fill={typeColors[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
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
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
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
