"use client";

import { useEffect, useState } from "react";
import { Brain, RefreshCw, Clock, Database } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DisclaimerBanner } from "@/components/common/disclaimer-banner";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { IntegrityOverview } from "@/components/truth/integrity-overview";
import { RealityOverview } from "@/components/truth/reality-overview";
import { NoReliableSignalBanner } from "@/components/truth/no-reliable-signal-banner";
import { BaselineComparisonCard } from "@/components/truth/baseline-comparison-card";
import { BacktestSummaryCard } from "@/components/truth/backtest-summary-card";
import { DriftWarningCard } from "@/components/truth/drift-warning-card";
import { TruthScorePill } from "@/components/truth/truth-score-pill";
import { ConfidenceMeter } from "@/components/truth/confidence-meter";
import { ScoreExplanationPanel } from "@/components/truth/score-explanation-panel";
import type { TruthPipelineResult, TruthScoreResult } from "@/lib/truth/types";

export default function TruthPage() {
  const [data, setData] = useState<TruthPipelineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<TruthScoreResult | null>(null);
  const [drawType, setDrawType] = useState("ALL");
  const [recomputing, setRecomputing] = useState(false);

  const fetchData = async (dt: string, showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    const params = dt !== "ALL" ? `?drawType=${dt}` : "";
    try {
      const response = await fetch(`/api/truth/reality${params}`);
      const payload = await response.json();

      if (payload.error) {
        setError(payload.error);
      } else {
        setData(payload);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(drawType, false);
  }, [drawType]);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await fetch("/api/truth/snapshot", { method: "POST" });
      await fetchData(drawType);
    } catch { }
    setRecomputing(false);
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        title="เกิดข้อผิดพลาด"
        message={error}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="ไม่มีข้อมูล"
        message="นำเข้าข้อมูลก่อนเพื่อเริ่มวิเคราะห์"
      />
    );
  }

  const top20 = data.truthScores.slice(0, 20);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Truth Engine"
        description="ระบบวิเคราะห์เชิงสถิติที่โปร่งใส ซื่อสัตย์กับข้อมูล ไม่ overclaim"
      >
        <select
          value={drawType}
          onChange={(e) => setDrawType(e.target.value)}
          className="input-field text-sm w-auto"
        >
          <option value="ALL">ทุกประเภท</option>
          <option value="SPECIAL">ฮานอยพิเศษ</option>
          <option value="NORMAL">ฮานอยปกติ</option>
          <option value="VIP">ฮานอยวีไอพี</option>
        </select>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="btn-secondary text-sm"
        >
          <RefreshCw className={`w-4 h-4 inline mr-1 ${recomputing ? "animate-spin" : ""}`} />
          Recompute
        </button>
      </PageHeader>

      <DisclaimerBanner />

      {/* No Reliable Signal Banner */}
      <NoReliableSignalBanner show={data.realityVerdict.showNoReliableSignalBanner} />

      {/* Meta Info */}
      <div className="flex items-center gap-4 mb-4 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          {data.datasetFeatures.totalRecords} records ({data.datasetFeatures.dateSpanDays} days)
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(data.generatedAt).toLocaleString("th-TH")}
        </span>
      </div>

      {/* Row 1: Integrity + Reality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <IntegrityOverview report={data.integrityReport} />
        <RealityOverview result={data.realityVerdict} />
      </div>

      {/* Row 2: Baseline + Backtest + Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <BaselineComparisonCard result={data.baselineComparison} />
        <BacktestSummaryCard summary={data.backtestSummary} />
        <DriftWarningCard report={data.driftReport} />
      </div>

      {/* Row 3: Top Scored Numbers */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-[var(--accent-violet)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Truth Scores — Top 20
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">เลข</th>
                <th className="text-left py-2">Trend</th>
                <th className="text-left py-2">Confidence</th>
                <th className="text-left py-2">Evidence</th>
                <th className="text-left py-2">Label</th>
                <th className="text-left py-2"></th>
              </tr>
            </thead>
            <tbody>
              {top20.map((score, i) => (
                <tr
                  key={score.number}
                  className="border-b border-[var(--border)] border-opacity-30 hover:bg-[var(--bg-input)] cursor-pointer transition-colors"
                  onClick={() => setSelectedNumber(score)}
                >
                  <td className="py-2.5 text-[var(--text-muted)]">{i + 1}</td>
                  <td className="py-2.5">
                    <span className="font-mono font-bold text-lg text-[var(--accent-violet)]">
                      {score.number}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-bold text-[var(--accent-blue)]">
                      {score.trendScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 min-w-[120px]">
                    <ConfidenceMeter value={score.confidenceScore} size="sm" />
                  </td>
                  <td className="py-2.5">
                    <span className="text-[var(--accent-emerald)]">
                      {score.evidenceStrength.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    <TruthScorePill label={score.label} />
                  </td>
                  <td className="py-2.5">
                    <button className="text-[10px] text-[var(--accent-blue)] hover:underline">
                      ดูเพิ่ม
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation Panel */}
      {selectedNumber && (
        <div className="mb-4">
          <ScoreExplanationPanel
            result={selectedNumber}
            onClose={() => setSelectedNumber(null)}
          />
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="text-center py-6">
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed max-w-2xl mx-auto">
          Truth Engine ออกแบบมาให้โปร่งใส ซื่อสัตย์กับข้อมูล และไม่ overclaim
          ทุกคะแนนมาพร้อมกับระดับความมั่นใจ หลักฐานสนับสนุน และ backtest
          ที่ไม่ใช้ข้อมูลอนาคต — ผลลัพธ์ควรใช้เพื่อการศึกษาและสำรวจข้อมูลเท่านั้น
        </p>
      </div>
    </div>
  );
}
