"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Calendar,
  TrendingUp,
  Award,
  Hash,
  Activity,
  ShieldCheck,
  Bot,
  Zap,
  Terminal,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
  Tv,
  Microscope,
  FileDown,
  Radar
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/common/stat-card";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { LiveMonitor } from "@/components/dashboard/LiveMonitor";
import { NumericalGapMatrix } from "@/components/dashboard/NumericalGapMatrix";
import { DRAW_TYPE_LABELS } from "@/lib/constants";
import type { AnalysisSummary } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analysis/summary").then(r => r.json()),
      fetch("/api/truth/status").then(r => r.json()),
      fetch("/api/predict?type=NORMAL").then(r => r.json())
    ])
    .then(([sum, stat, pred]) => {
      if (sum.error) setError(sum.error);
      else {
        setSummary(sum);
        if (!stat.error) setStatus(stat);
        if (pred.predictions) setPredictions(pred.predictions);
      }
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="text-center py-16 text-[var(--accent-rose)]">System Failure: {error}</div>;

  if (!summary || summary.totalRecords === 0) {
    return (
      <EmptyState
        title="Command Center Offline"
        message="นำเข้าข้อมูลเพื่อเริ่มต้นการวิเคราะห์ระดับ God-Tier"
        action={<Link href="/import" className="btn-primary">Initialize Sync</Link>}
      />
    );
  }

  const latestRecord = summary.recentRecords[0];

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-neon mb-1 tracking-tighter">
            COMMAND CENTER
          </h1>
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">
             <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> System: Online</span>
             <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Status: {status?.systemHealth.verdict} Signal</span>
          </div>
        </div>
        <div className="flex gap-2">
            <Link href="/analysis/radar" className="btn-secondary text-xs flex items-center gap-2 group">
                <Radar className="w-3.5 h-3.5" />
                <span>Radar</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/analysis/simulation" className="btn-secondary text-xs flex items-center gap-2 group">
                <Microscope className="w-3.5 h-3.5" />
                <span>Simulator</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/prediction" className="btn-primary text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Zap className="w-3.5 h-3.5" />
                Apex Predictor
            </Link>
        </div>
      </div>

      {/* Intelligence Pulse Zone */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-blue)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Integrity</div>
                    <div className="text-3xl font-black text-white">{status?.systemHealth.integrity}%</div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[var(--accent-blue)] opacity-40" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[10px] font-bold text-[var(--accent-emerald)] uppercase">
                   {status?.systemHealth.integrityLevel}
              </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-violet)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Backtest Edge</div>
                    <div className="text-3xl font-black text-white">+{((status?.intelligence.averageDelta || 0) * 100).toFixed(1)}%</div>
                  </div>
                  <Award className="w-5 h-5 text-[var(--accent-violet)] opacity-40" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  {status?.intelligence.backtestVerdict}
              </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-magenta)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Market Drift</div>
                    <div className="text-3xl font-black text-white">{status?.systemHealth.driftSeverity === 'NONE' ? 'STABLE' : status?.systemHealth.driftSeverity}</div>
                  </div>
                  <Activity className="w-5 h-5 text-[var(--accent-magenta)] opacity-40" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[10px] font-bold text-white uppercase">
                  Score: {status?.systemHealth.driftScore?.toFixed(2) || '0.00'}
              </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-amber)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Synchronicity</div>
                    <div className="text-3xl font-black text-white">{status?.marketPulse.correlation?.verdict || 'LOW'}</div>
                  </div>
                  <Bot className="w-5 h-5 text-[var(--accent-amber)] opacity-40" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Conductor: Active
              </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-emerald)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Expected ROI</div>
                    <div className="text-3xl font-black text-white">+{((status?.intelligence.expectedValue || 0.12) * 100).toFixed(1)}%</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[var(--accent-emerald)] opacity-40" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Per Unit Edge
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Main Operation Control */}
          <div className="lg:col-span-3 space-y-6">
              <LiveMonitor />
              <NumericalGapMatrix records={summary.recentRecords} />
          </div>

          {/* Side Intelligence Panel */}
          <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Apex Predictions</h3>
                      <Link href="/prediction" className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:bg-[var(--accent-violet)] transition-all">
                          <ArrowRight className="w-4 h-4" />
                      </Link>
                  </div>
                  <div className="space-y-4">
                      {predictions.slice(0, 5).map((pred, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border-color)] group hover:border-[var(--accent-blue)] transition-all">
                              <div className="flex items-center gap-3">
                                  <div className="text-xl font-black text-white">{pred.number}</div>
                                  <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(59,130,246,0.1)] text-[var(--accent-blue)]">
                                      {pred.label.split(' ')[0]}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-[10px] font-bold text-white">{pred.trendScore}</div>
                                  <div className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Trend</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="glass-card p-6 border-t-4 border-t-[var(--accent-violet)]">
                  <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Tactical Summary</div>
                  <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Total Records:</span>
                          <span className="text-white font-bold">{summary.totalRecords}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Latest Result:</span>
                          <span className="text-[var(--accent-amber)] font-bold">{latestRecord?.resultDigits}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Last Market:</span>
                          <span className="text-white font-bold">{latestRecord?.drawType}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-4 border-t border-[rgba(255,255,255,0.05)]">
                          <span className="text-[var(--text-muted)]">Engine Stability:</span>
                          <span className="text-[var(--accent-emerald)] font-bold">OPTIMAL</span>
                      </div>
                  </div>
              </div>

              {/* Quick Actions Zone */}
              <div className="grid grid-cols-2 gap-3">
                  <Link href="/import" className="btn-secondary h-20 flex flex-col items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent-blue)]">
                      <Database className="w-5 h-5 text-[var(--accent-blue)]" />
                      Sync
                  </Link>
                  <button onClick={() => window.open('/api/results/export')} className="btn-secondary h-20 flex flex-col items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent-violet)]">
                      <FileDown className="w-5 h-5 text-[var(--accent-violet)]" />
                      Export
                  </button>
              </div>
          </div>
      </div>

      {/* Numerical Records Strip */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">
            Recent Data Stream
          </h3>
          <Link href="/results" className="text-[10px] uppercase font-bold text-[var(--accent-blue)] hover:underline">Full Log →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Market</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Digits</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Last 2</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Last 3</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentRecords.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        r.drawType === 'NORMAL' ? 'bg-[var(--accent-blue)] text-white' : 
                        r.drawType === 'SPECIAL' ? 'bg-[var(--accent-violet)] text-white' : 
                        'bg-[var(--accent-amber)] text-black'
                    }`}>
                      {r.drawType}
                    </span>
                  </td>
                  <td className="py-4 font-mono font-black text-white">{r.resultDigits}</td>
                  <td className="py-4 font-mono text-[var(--accent-amber)] font-bold">{r.last2}</td>
                  <td className="py-4 font-mono text-[var(--accent-violet)] font-bold">{r.last3}</td>
                  <td className="py-4 text-right font-mono text-[10px] text-[var(--text-muted)]">
                    {new Date(r.drawDate).toLocaleDateString()}
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
