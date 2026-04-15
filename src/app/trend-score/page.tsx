"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DisclaimerBanner } from "@/components/common/disclaimer-banner";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { DRAW_TYPE_LABELS, ROLLING_WINDOW_OPTIONS } from "@/lib/constants";
import type { TrendScore, TrendScoreExplanation, DrawType } from "@/types";

function getHeatClass(normalizedScore: number): string {
  if (normalizedScore >= 90) return "heat-7";
  if (normalizedScore >= 75) return "heat-6";
  if (normalizedScore >= 60) return "heat-5";
  if (normalizedScore >= 45) return "heat-4";
  if (normalizedScore >= 30) return "heat-3";
  if (normalizedScore >= 15) return "heat-2";
  if (normalizedScore > 0) return "heat-1";
  return "heat-0";
}

export default function TrendScorePage() {
  const [scores, setScores] = useState<TrendScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawType, setDrawType] = useState("ALL");
  const [window, setWindow] = useState(0);
  const [selectedNum, setSelectedNum] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<TrendScoreExplanation | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "top10" | "top20">("grid");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (drawType !== "ALL") params.set("drawType", drawType);
    if (window > 0) params.set("window", String(window));

    fetch(`/api/trend-score?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setScores(d.scores || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [drawType, window]);

  const handleExplain = async (num: string) => {
    setSelectedNum(num);
    setExplainLoading(true);
    const params = new URLSearchParams({ explain: num });
    if (drawType !== "ALL") params.set("drawType", drawType);
    if (window > 0) params.set("window", String(window));

    try {
      const res = await fetch(`/api/trend-score?${params}`);
      const d = await res.json();
      setExplanation(d.explanation);
    } catch {
      setExplanation(null);
    } finally {
      setExplainLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (scores.length === 0) {
    return <EmptyState message="ไม่มีข้อมูลเพียงพอสำหรับคำนวณ Trend Score" />;
  }

  // Sort grid by number for grid view
  const gridScores = [...scores].sort((a, b) =>
    a.number.localeCompare(b.number)
  );
  const topScores = scores.slice(
    0,
    viewMode === "top10" ? 10 : viewMode === "top20" ? 20 : scores.length
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Statistical Trend Score"
        description="คะแนนแนวโน้มเชิงสถิติจากข้อมูลย้อนหลัง"
      />

      <DisclaimerBanner
        text="ระบบนี้เป็นเครื่องมือวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติ เพื่อใช้ดูแนวโน้มและรูปแบบของข้อมูลเท่านั้น ไม่ใช่การรับประกันผล และไม่ควรตีความว่าเป็นคำแนะนำในการเล่นพนัน"
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
        <div className="tab-group">
          {[
            { label: "Grid 00-99", value: "grid" as const },
            { label: "Top 10", value: "top10" as const },
            { label: "Top 20", value: "top20" as const },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`tab-item ${viewMode === opt.value ? "active" : ""}`}
              onClick={() => setViewMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2">
          {viewMode === "grid" ? (
            /* Heatmap Grid */
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Trend Score Heatmap (00-99)
              </h3>
              <div className="grid grid-cols-10 gap-1">
                {gridScores.map((s) => (
                  <button
                    key={s.number}
                    className={`score-cell ${getHeatClass(s.normalizedScore)} ${
                      selectedNum === s.number
                        ? "ring-2 ring-[var(--accent-blue)]"
                        : ""
                    }`}
                    onClick={() => handleExplain(s.number)}
                    title={`${s.number}: ${s.normalizedScore.toFixed(1)}`}
                  >
                    <span className="text-xs font-bold">{s.number}</span>
                    <span className="text-[9px] opacity-75">
                      {s.normalizedScore.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 justify-center">
                <span className="text-[10px] text-[var(--text-muted)]">ต่ำ</span>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={`w-6 h-4 rounded-sm heat-${i}`}
                  />
                ))}
                <span className="text-[10px] text-[var(--text-muted)]">สูง</span>
              </div>
            </div>
          ) : (
            /* Top N List */
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {viewMode === "top10" ? "Top 10" : "Top 20"} Trend Scores
              </h3>
              <div className="space-y-2">
                {topScores.map((s, idx) => (
                  <button
                    key={s.number}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] transition-colors text-left ${
                      selectedNum === s.number
                        ? "ring-1 ring-[var(--accent-blue)]"
                        : ""
                    }`}
                    onClick={() => handleExplain(s.number)}
                  >
                    <span className="text-lg font-bold text-[var(--text-muted)] w-8">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl font-bold font-mono text-[var(--accent-amber)]">
                      {s.number}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                          style={{ width: `${s.normalizedScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {s.normalizedScore.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explanation Panel */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Evidence Breakdown
            </h3>
            {explainLoading ? (
              <LoadingState message="กำลังวิเคราะห์..." />
            ) : explanation ? (
              <div>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold font-mono text-[var(--accent-amber)]">
                    {explanation.number}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Score: {explanation.normalizedScore.toFixed(1)} / 100
                  </p>
                </div>

                <div className="space-y-3">
                  {explanation.factors.map((f) => (
                    <div key={f.name} className="p-3 rounded-lg bg-[var(--bg-input)]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {f.name}
                        </span>
                        <span className="text-xs font-mono text-[var(--accent-blue)]">
                          {f.weightedValue.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent-blue)]"
                            style={{
                              width: `${Math.min(f.rawValue * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ×{f.weight}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                คลิกที่ตัวเลขเพื่อดู Trend Factors
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
