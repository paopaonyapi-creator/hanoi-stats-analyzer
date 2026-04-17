"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { Activity, Shield, RefreshCw, Sparkles, Zap } from "lucide-react";
import { ChartCard } from "@/components/common/chart-card";

interface EnsembleBreakdown {
  score: number;
  bayesian: number;
  momentum: number;
  gapReturn: number;
  windowAgreement: number;
  driftAdjusted: boolean;
}

interface Prediction {
  number: string;
  trendScore: number;
  rawTruthScore?: number;
  confidence: number;
  evidence: number;
  label: string;
  signals: string[];
  penalties: string[];
  ensemble?: EnsembleBreakdown | null;
}

interface EngineSummary {
  integrity: number;
  verdict: string;
  baselineDelta: number;
  backtestHitRate: number;
  driftSeverity: string;
  ensembleActive?: boolean;
  modelVersion?: string;
}

interface EnsembleTop {
  number: string;
  ensembleScore: number;
  breakdown: { bayesian: number; momentum: number; gapReturn: number; windowAgreement: number };
}

type DrawType = "NORMAL" | "SPECIAL" | "VIP";

const compactPercent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export default function PredictionPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [ensembleTop5, setEnsembleTop5] = useState<EnsembleTop[]>([]);
  const [summary, setSummary] = useState<EngineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<DrawType>("NORMAL");
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [showEnsemble, setShowEnsemble] = useState(false);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predict?type=${type}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setPredictions(data.predictions || []);
        setEnsembleTop5(data.ensembleTop5 || []);
        setSummary(data.engineSummary || null);
        setGeneratedAt(data.generatedAt);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="text-center py-16 text-[var(--accent-rose)]">
        เกิดข้อผิดพลาด: {error}
        <button onClick={fetchPredictions} className="block mx-auto mt-4 btn-secondary text-xs">ลองอีกครั้ง</button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-neon mb-2">
            AI Truth Prediction
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            ระบบเก็งเลข (2 ตัวท้าย) อัจฉริยะจากอัลกอริทึม Truth Engine (Apex v2.1)
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          {generatedAt && (
            <span className="max-w-[200px] text-[10px] font-mono text-[var(--text-muted)] md:text-right">
              Updated: {new Date(generatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchPredictions}
            className="btn-secondary rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-[var(--bg-card-hover)]"
          >
            <RefreshCw className="w-5 h-5 text-[var(--accent-blue)]" />
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {(["NORMAL", "SPECIAL", "VIP"] as DrawType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg border px-4 py-3 text-xs font-bold transition-all ${type === t
              ? 'bg-[var(--accent-violet)] border-[var(--accent-violet)] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-transparent border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Engine Status / Verdict Bar */}
      {summary && (
        <div className={`mb-8 flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${summary.verdict === 'STRONG'
          ? 'bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)]'
          : 'bg-[rgba(245,158,11,0.05)] border-[rgba(245,158,11,0.2)]'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${summary.verdict === 'STRONG' ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--accent-amber)]'
              }`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Engine Verdict</div>
              <div className="text-sm font-black text-white">{summary.verdict} SIGNAL ATTESTED</div>
            </div>
          </div>
          <div className="hidden md:flex flex-1 mx-8 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${summary.verdict === 'STRONG' ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--accent-amber)]'
                }`}
              style={{ width: `${summary.integrity}%` }}
            ></div>
          </div>
          <div className="w-full text-left md:w-auto md:text-right">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Integrity</div>
            <div className="text-sm font-black text-white">{summary.integrity}%</div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {predictions.length > 0 && (
          <div className="lg:col-span-1">
            <div className="glass-card relative overflow-hidden group h-full border-[var(--accent-violet)] border-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-blue)] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

              <div className="p-8 flex flex-col items-center justify-center h-full relative z-10">
                <div className="flex items-center gap-2 text-[var(--accent-magenta)] mb-4 bg-[rgba(236,72,153,0.1)] px-3 py-1 rounded-full border border-[rgba(236,72,153,0.3)]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-black tracking-widest text-[10px] uppercase">Apex Candidate</span>
                </div>

                <h2 className="mb-6 text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.8)] sm:text-8xl">
                  {predictions[0].number}
                </h2>

                <div className="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-[rgba(255,255,255,0.03)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
                    <div className="text-[9px] uppercase text-[var(--text-muted)] mb-1">Trend Score</div>
                    <div className="text-lg font-black text-[var(--accent-blue)]">{predictions[0].trendScore}</div>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.03)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
                    <div className="text-[9px] uppercase text-[var(--text-muted)] mb-1">Confidence</div>
                    <div className="break-words text-lg font-black text-[var(--accent-emerald)]">
                      {compactPercent.format(predictions[0].confidence)}%
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {predictions[0].signals.slice(0, 3).map((sig, i) => (
                    <span key={i} className="text-[9px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-2 py-1 rounded-md text-[var(--text-secondary)] font-medium">
                      {sig.split(': ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 flex flex-col gap-4">
          <ChartCard title="Intelligence Breakdown — Signal Attribution">
            <div className="flex flex-col gap-3 mt-2">
              {predictions.slice(1, 6).map((pred) => (
                <div
                  key={pred.number}
                  className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 transition-all duration-300 hover:border-[var(--accent-violet)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[var(--accent-violet)] font-black text-sm border border-[var(--border-color)]">
                        {pred.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pred.label === 'STRONG SIGNAL' ? 'bg-[var(--accent-emerald)] text-white' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'
                            }`}>
                            {pred.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {pred.signals.map((r, i) => (
                            <span key={i} className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                              <Zap className="w-3 h-3 text-[var(--accent-blue)]" /> {r.split(': ')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Score</span>
                        <span className="text-sm font-black text-white">{pred.trendScore}</span>
                      </div>
                      <div className="w-24 h-1 bg-[var(--bg-card)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                          style={{ width: `${pred.trendScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="mb-8">
        <ChartCard title="Apex Intelligence: Real-Time Performance Monitor">
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Integrity Score', val: `${summary?.integrity || 0}%`, desc: 'ความถูกต้องเชิงโครงสร้าง' },
              { label: 'Baseline Edge', val: `+${((summary?.baselineDelta || 0) * 100).toFixed(1)}%`, desc: 'ประสิทธิภาพเหนือค่าเฉลี่ย' },
              { label: 'Backtest Hit', val: `${((summary?.backtestHitRate || 0) * 100).toFixed(1)}%`, desc: 'สถิติทำกำไรย้อนหลัง' },
              { label: 'Drift Warning', val: summary?.driftSeverity?.toUpperCase() || 'NONE', desc: 'การเบี่ยงเบนของตลาด' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)] text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold mb-2 tracking-widest">{item.label}</div>
                <div className="text-2xl font-black text-white mb-1">{item.val}</div>
                <div className="text-[10px] text-[var(--accent-blue)] font-medium italic">{item.desc}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Ensemble Crosscheck Panel */}
      {ensembleTop5.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Bayesian Ensemble Crosscheck
              </h3>
              {summary?.ensembleActive && (
                <span className="text-[8px] bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] text-[var(--accent-blue)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {summary.modelVersion ?? "Ensemble Active"}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowEnsemble(!showEnsemble)}
              className="text-[10px] text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-wider font-bold"
            >
              {showEnsemble ? "▲ ซ่อน" : "▼ แสดง Breakdown"}
            </button>
          </div>

          {showEnsemble && (
            <div className="glass-card p-5 border border-[rgba(245,158,11,0.2)]">
              <p className="text-[10px] text-[var(--text-muted)] mb-4">
                ตัวเลขเหล่านี้มาจาก Bayesian Ensemble (ไม่ผสม TruthScore) — ใช้เปรียบเทียบกับ Apex Predictions ด้านบน
              </p>
              <div className="space-y-3">
                {ensembleTop5.map((e, i) => (
                  <div key={e.number} className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-[var(--accent-amber)]">{e.number}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">#{i + 1} Ensemble Rank</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{e.ensembleScore}</div>
                        <div className="text-[8px] text-[var(--text-muted)] uppercase">Ensemble Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Bayesian", val: e.breakdown.bayesian, color: "var(--accent-blue)" },
                        { label: "Momentum", val: e.breakdown.momentum, color: "var(--accent-emerald)" },
                        { label: "Gap Return", val: e.breakdown.gapReturn, color: "var(--accent-amber)" },
                        { label: "Window", val: e.breakdown.windowAgreement, color: "var(--accent-violet)" },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="text-[8px] text-[var(--text-muted)] uppercase mb-1">{item.label}</div>
                          <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full mb-1">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${item.val}%`, background: item.color }}
                            />
                          </div>
                          <div className="text-[9px] font-bold" style={{ color: item.color }}>
                            {item.val.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="disclaimer-banner flex items-start gap-4">
        <Shield className="w-6 h-6 flex-shrink-0 mt-0.5 text-[var(--accent-blue)]" />
        <div>
          <h4 className="font-semibold text-sm mb-1 text-white">Truth Engine v2.1 Protocol</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            ตัวเลขอ้างอิงจากการวิเคราะห์สัญญาณ 12 มิติ (Entropy, Variance, Pattern Consistency) พร้อมระบบ <b>Multi-Market Correlation</b> ที่วิเคราะห์ความสัมพันธ์ระหว่างหวย 3 ตลาดแบบเรียลไทม์ และได้รับการปรับจูนน้ำหนักผ่าน Genetic Algorithm เพื่อหาค่าที่แม่นยำที่สุดในสัปดาห์นี้ โปรดใช้วิจารณญาณ.
          </p>
        </div>
      </div>
    </div>
  );
}
