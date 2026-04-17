"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Settings2,
  Zap,
  AlertCircle,
  Trophy,
  Save,
  Sparkles,
  Activity,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { LoadingState } from "@/components/common/loading-state";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "@/lib/truth/constants";
import type { DrawType } from "@/types";

type Pillar = "statistical" | "pattern" | "market" | "stability";

interface SimulationFold {
  fold: number;
  hitRate: number;
  delta: number;
}

interface SimulationResponse {
  type: DrawType;
  totalFolds: number;
  averageHitRate: number;
  averageBaseline: number;
  averageDelta: number;
  verdict: string;
  message: string;
  folds: SimulationFold[];
  error?: string;
}

const MARKETS: DrawType[] = ["NORMAL", "SPECIAL", "VIP"];

export default function SimulationLabPage() {
  const [type, setType] = useState<DrawType>("NORMAL");
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [pillars, setPillars] = useState<Record<Pillar, number>>({
    statistical: 1.0,
    pattern: 1.0,
    market: 1.0,
    stability: 1.0,
  });

  const computeFinalWeights = useCallback(() => {
    const base = DEFAULT_TRUTH_ENGINE_SETTINGS.weights;
    return {
      frequencyAllTime: base.frequencyAllTime * pillars.statistical,
      frequencyRecent: base.frequencyRecent * pillars.statistical,
      recencyDecay: base.recencyDecay * pillars.statistical,
      varianceStability: base.varianceStability * pillars.statistical,
      transition: base.transition * pillars.pattern,
      patternStrength: base.patternStrength * pillars.pattern,
      windowConsistency: base.windowConsistency * pillars.pattern,
      marketCorrelation: base.marketCorrelation * pillars.market,
      bayesianBias: base.bayesianBias * pillars.market,
      weekdayAlignment: base.weekdayAlignment * pillars.market,
      gapReturn: base.gapReturn * pillars.stability,
      digitBalance: base.digitBalance * pillars.stability,
    };
  }, [pillars]);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const weights = computeFinalWeights();
      const response = await fetch(
        `/api/predict/backtest?type=${type}&period=${period}&weights=${encodeURIComponent(
          JSON.stringify(weights)
        )}`
      );
      const payload: SimulationResponse = await response.json();

      if (payload.error) {
        setError(payload.error);
        setData(null);
      } else {
        setData(payload);
      }
    } catch (simulationError: unknown) {
      setError(
        simulationError instanceof Error ? simulationError.message : "Simulation request failed"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [computeFinalWeights, period, type]);

  const handleApplySettings = async () => {
    setApplying(true);
    try {
      const weights = computeFinalWeights();
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "scoreWeights",
          valueJson: weights,
        }),
      });
      const payload: { error?: string } = await response.json();
      if (payload.error) {
        throw new Error(payload.error);
      }
      alert("Saved the current simulation weights into the main engine settings.");
    } catch (applyError: unknown) {
      alert(
        applyError instanceof Error ? `Error: ${applyError.message}` : "Error: apply failed"
      );
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    void runSimulation();
  }, [runSimulation]);

  if (loading && !data && !error) {
    return <LoadingState />;
  }

  const folds = data?.folds ?? [];
  const foldHighlights = folds.filter(
    (_, index) => index % Math.max(1, Math.ceil(folds.length / 5)) === 0 || index === folds.length - 1
  );

  return (
    <div className="animate-slide-up">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-2 bg-gradient-neon bg-clip-text text-3xl font-extrabold text-transparent">
            AI Simulation Lab
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Walk-forward backtest lab for tuning the Truth Engine without leaking future data.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-[rgba(236,72,153,0.2)] bg-[rgba(236,72,153,0.1)] px-3 py-1.5 md:flex">
          <Sparkles className="h-4 w-4 text-[var(--accent-magenta)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            Truthparagon v2.1
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-card p-6">
            <div className="mb-6 flex items-center gap-2 text-[var(--accent-blue)]">
              <Settings2 className="h-5 w-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Engine Parameters</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Target Market
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {MARKETS.map((market) => (
                    <button
                      key={market}
                      onClick={() => setType(market)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                        type === market
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                          : "border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)]"
                      }`}
                    >
                      {market}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  History Depth: {period} Days
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={period}
                  onChange={(event) => setPeriod(parseInt(event.target.value, 10))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[var(--bg-input)] accent-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-5 border-t border-[var(--border-color)] pt-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white">
                  Intelligence Pillars
                </label>

                {(Object.entries(pillars) as [Pillar, number][]).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold capitalize text-[var(--text-muted)]">
                        {key}
                      </span>
                      <span className="text-[10px] font-black text-white">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.1"
                      value={value}
                      onChange={(event) =>
                        setPillars((current) => ({
                          ...current,
                          [key]: parseFloat(event.target.value),
                        }))
                      }
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[var(--bg-input)] accent-[var(--accent-violet)]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => void runSimulation()}
                  disabled={loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  {loading ? <Zap className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Simulate Truth Engine
                </button>

                <button
                  onClick={handleApplySettings}
                  disabled={applying || !data}
                  className="btn-secondary flex w-full items-center justify-center gap-2 py-3"
                >
                  <Save className="h-4 w-4" />
                  Apply Champion Weights
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card border-l-4 border-l-[var(--accent-blue)] bg-[rgba(59,130,246,0.05)] p-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
              <ShieldCheck className="h-4 w-4 text-[var(--accent-blue)]" />
              Simulation Integrity
            </div>
            <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
              This lab runs a walk-forward backtest so each fold is evaluated using only past
              history. That keeps the result much closer to real deployment conditions.
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-rose)] bg-[rgba(244,63,94,0.1)] p-4 text-sm text-[var(--accent-rose)]">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="glass-card group relative flex flex-col items-center overflow-hidden p-6 text-center">
                  <div className="absolute right-0 top-0 p-3 opacity-5 transition-opacity group-hover:opacity-10">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Average Hit Rate
                  </span>
                  <div className="mb-1 text-5xl font-black text-white">{data.averageHitRate}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-emerald)]">
                    Verdict: {data.verdict}
                  </div>
                </div>

                <div className="glass-card flex flex-col items-center p-6 text-center">
                  <BarChart3 className="mb-2 h-6 w-6 text-[var(--accent-blue)]" />
                  <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Avg Edge Delta
                  </span>
                  <div className="text-4xl font-black text-white">
                    {data.averageDelta > 0 ? "+" : ""}
                    {(data.averageDelta * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[10px] uppercase text-[var(--text-muted)]">
                    Baseline {data.averageBaseline}%
                  </div>
                </div>

                <div className="glass-card flex flex-col items-center p-6 text-center">
                  <Activity className="mb-2 h-6 w-6 text-[var(--accent-violet)]" />
                  <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Total Folds
                  </span>
                  <div className="text-4xl font-black text-white">{data.totalFolds}</div>
                  <div className="mt-1 text-[10px] uppercase text-[var(--text-muted)]">
                    Backtest windows processed
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                    Performance Pulse Timeline
                  </h3>
                  <Activity className="h-4 w-4 text-[var(--accent-blue)]" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {foldHighlights.map((fold) => (
                    <div
                      key={fold.fold}
                      className="rounded-xl border border-[var(--border-color)] bg-[rgba(255,255,255,0.02)] p-4 text-center transition-all hover:border-[var(--accent-blue)]"
                    >
                      <div className="mb-2 text-[9px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
                        Fold {fold.fold + 1}
                      </div>
                      <div
                        className={`text-xl font-black ${
                          fold.hitRate > 0 ? "text-[var(--accent-emerald)]" : "text-white"
                        }`}
                      >
                        {(fold.hitRate * 100).toFixed(0)}%
                      </div>
                      <div className="mt-1 text-[8px] font-black uppercase text-[var(--text-muted)]">
                        Delta: {fold.delta > 0 ? "+" : ""}
                        {(fold.delta * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[rgba(255,255,255,0.02)] p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Detailed Fold Log</h3>
                  <div className="text-[10px] text-[var(--text-muted)]">{data.message}</div>
                </div>
                <div className="max-h-[500px] overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-card)] shadow-sm">
                      <tr className="border-b border-[var(--border-color)]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Fold
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Hit Rate
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Edge Delta
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {folds
                        .slice()
                        .reverse()
                        .map((fold) => (
                          <tr
                            key={fold.fold}
                            className={`border-b border-[rgba(255,255,255,0.03)] transition-colors ${
                              fold.delta > 0
                                ? "bg-[rgba(16,185,129,0.08)]"
                                : "hover:bg-[rgba(255,255,255,0.02)]"
                            }`}
                          >
                            <td className="px-6 py-4 text-[10px] font-mono font-bold text-[var(--text-muted)]">
                              Fold {fold.fold + 1}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xl font-black text-white">
                                {(fold.hitRate * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-mono text-xs font-black ${
                                fold.delta > 0
                                  ? "text-[var(--accent-emerald)]"
                                  : "text-[var(--accent-rose)]"
                              }`}
                            >
                              {fold.delta > 0 ? "+" : ""}
                              {(fold.delta * 100).toFixed(1)}%
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
