"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Brain, TrendingUp, Target, Activity, Clock, ChevronRight, Share2, Shield, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { ChartCard } from "@/components/common/chart-card";

interface Prediction {
  number: string;
  trendScore: number;
  confidence: number;
  evidence: number;
  label: string;
  signals: string[];
  penalties: string[];
}

interface EngineSummary {
    integrity: number;
    verdict: string;
    baselineDelta: number;
    backtestHitRate: number;
    driftSeverity: string;
}

type DrawType = "NORMAL" | "SPECIAL" | "VIP";

export default function PredictionPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [summary, setSummary] = useState<EngineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<DrawType>("NORMAL");
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predict?type=${type}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
          setPredictions(data.predictions || []);
          setSummary(data.engineSummary || null);
          setGeneratedAt(data.generatedAt);
          setError(null);
      }
    } catch (err: any) {
      setError(err.message);
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-neon mb-2">
            AI Truth Prediction
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            ระบบเก็งเลข (2 ตัวท้าย) อัจฉริยะจากอัลกอริทึม Truth Engine (Apex v2.1)
          </p>
        </div>
        <div className="flex items-center gap-3">
            {generatedAt && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(["NORMAL", "SPECIAL", "VIP"] as DrawType[]).map((t) => (
            <button
                key={t}
                onClick={() => setType(t)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all border ${
                    type === t 
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
          <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between gap-4 ${
              summary.verdict === 'STRONG' 
              ? 'bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)]'
              : 'bg-[rgba(245,158,11,0.05)] border-[rgba(245,158,11,0.2)]'
          }`}>
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      summary.verdict === 'STRONG' ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--accent-amber)]'
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
                    className={`h-full transition-all duration-1000 ${
                        summary.verdict === 'STRONG' ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--accent-amber)]'
                    }`} 
                    style={{ width: `${summary.integrity}%` }}
                  ></div>
              </div>
              <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Integrity</div>
                  <div className="text-sm font-black text-white">{summary.integrity}%</div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {predictions.length > 0 && (
          <div className="lg:col-span-1">
            <div className="glass-card relative overflow-hidden group h-full border-[var(--accent-violet)] border-2">
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-blue)] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              <div className="p-8 flex flex-col items-center justify-center h-full relative z-10">
                <div className="flex items-center gap-2 text-[var(--accent-magenta)] mb-4 bg-[rgba(236,72,153,0.1)] px-3 py-1 rounded-full border border-[rgba(236,72,153,0.3)]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-black tracking-widest text-[10px] uppercase">Apex Candidate</span>
                </div>
                
                <h2 className="text-8xl font-black text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.8)] mb-6 tracking-tighter">
                  {predictions[0].number}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="bg-[rgba(255,255,255,0.03)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
                        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-1">Trend Score</div>
                        <div className="text-lg font-black text-[var(--accent-blue)]">{predictions[0].trendScore}</div>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.03)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
                        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-1">Confidence</div>
                        <div className="text-lg font-black text-[var(--accent-emerald)]">{predictions[0].confidence}%</div>
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
              {predictions.slice(1, 6).map((pred, idx) => (
                <div 
                  key={pred.number}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[var(--accent-violet)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[var(--accent-violet)] font-black text-sm border border-[var(--border-color)]">
                      {pred.number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pred.label === 'STRONG SIGNAL' ? 'bg-[var(--accent-emerald)] text-white' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'
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
                  
                  <div className="flex flex-col items-end">
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
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
      
      <div className="mb-8">
        <ChartCard title="Apex Intelligence: Real-Time Performance Monitor">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Integrity Score', val: `${summary?.integrity || 0}%`, desc: 'ความถูกต้องเชิงโครงสร้าง' },
                { label: 'Baseline Edge', val: `+${((summary?.baselineDelta || 0)*100).toFixed(1)}%`, desc: 'ประสิทธิภาพเหนือค่าเฉลี่ย' },
                { label: 'Backtest Hit', val: `${((summary?.backtestHitRate || 0)*100).toFixed(1)}%`, desc: 'สถิติทำกำไรย้อนหลัง' },
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
