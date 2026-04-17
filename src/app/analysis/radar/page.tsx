"use client";

import { useState, useEffect } from "react";
import { Flame, Zap, Activity, ArrowUpRight, Crosshair, AlertCircle } from "lucide-react";
import { LoadingState } from "@/components/common/loading-state";
import type { NumericalMomentum } from "@/lib/truth/momentum";
import type { DrawType } from "@/types";

interface AggregatedMomentum {
  totalHeat: number;
  marketsHot: string[];
}

interface MomentumResponse {
  marketMomentum: Record<DrawType, Record<string, NumericalMomentum>>;
  aggregated: Record<string, AggregatedMomentum>;
  hyperActive: NumericalMomentum[];
  generatedAt: string;
  error?: string;
}

const MARKETS: DrawType[] = ["NORMAL", "SPECIAL", "VIP"];

export default function TrendRadarPage() {
  const [data, setData] = useState<MomentumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<DrawType>("NORMAL");

  const fetchMomentum = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/truth/momentum");
      const payload: MomentumResponse = await response.json();
      if (payload.error) {
        setError(payload.error);
        setData(null);
      } else {
        setError(null);
        setData(payload);
      }
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load momentum");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMomentum();
  }, []);

  if (loading && !data) {
    return <LoadingState />;
  }

  const momentumMap = data?.marketMomentum[selectedMarket] ?? {};
  const numbers = Array.from({ length: 100 }, (_, index) => String(index).padStart(2, "0"));
  const intersections = Object.entries(data?.aggregated ?? {}).filter(
    ([, value]) => value.marketsHot.length > 1
  );

  const getMomentumColor = (score: number) => {
    if (score > 1.8) return "bg-[rgb(219,39,119)] text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]";
    if (score > 1.4) return "bg-[rgb(124,58,237)] text-white";
    if (score > 1.1) return "bg-[rgb(59,130,246)] text-white";
    if (score < 0.6) return "bg-[rgba(255,255,255,0.02)] text-[var(--text-muted)]";
    return "bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]";
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-violet)] to-[var(--accent-magenta)] bg-clip-text text-3xl font-black uppercase tracking-tighter text-transparent">
            Numerical Trend Radar
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Monitor momentum velocity and cross-market heat zones for all 00-99 candidates.
          </p>
        </div>
        <button
          onClick={() => void fetchMomentum()}
          className="rounded-lg bg-[rgba(255,255,255,0.05)] p-2 transition-all hover:bg-[rgba(255,255,255,0.1)]"
        >
          <Activity className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--accent-rose)] bg-[rgba(244,63,94,0.1)] p-4 text-sm text-[var(--accent-rose)]">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-card p-6">
            <div className="mb-6 flex items-center gap-2 text-[var(--accent-magenta)]">
              <Flame className="h-5 w-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Hyper-Active Streaks</h3>
            </div>
            <div className="space-y-4">
              {data?.hyperActive.map((item) => (
                <div
                  key={item.number}
                  className="group flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] p-3 transition-all hover:border-[var(--accent-magenta)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-black text-white transition-colors group-hover:text-[var(--accent-magenta)]">
                      {item.number}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase italic text-[var(--text-muted)]">
                        Velocity
                      </div>
                      <div className="text-xs font-bold text-[var(--accent-emerald)]">
                        {item.velocity}x
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase italic text-[var(--text-muted)]">
                      Acc.
                    </div>
                    <div className="text-xs font-bold text-white">
                      {(item.acceleration * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card border-l-4 border-l-[var(--accent-blue)] p-6">
            <div className="mb-4 flex items-center gap-2 text-[var(--accent-blue)]">
              <Crosshair className="h-5 w-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Market Intersection</h3>
            </div>
            <div className="space-y-2">
              {intersections.map(([number, value]) => (
                <div
                  key={number}
                  className="flex items-center justify-between rounded-lg bg-[rgba(59,130,246,0.05)] p-2 text-[10px]"
                >
                  <span className="text-sm font-black text-white">{number}</span>
                  <div className="flex gap-1">
                    {value.marketsHot.map((market) => (
                      <span
                        key={market}
                        className="rounded bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 text-[8px] font-black"
                      >
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="mb-2 flex items-center gap-4">
            {MARKETS.map((market) => (
              <button
                key={market}
                onClick={() => setSelectedMarket(market)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  selectedMarket === market
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {market} MARKET
              </button>
            ))}
          </div>

          <div className="glass-card p-8">
            <div className="grid grid-cols-10 gap-3">
              {numbers.map((number) => {
                const momentum = momentumMap[number];
                const score = momentum?.compositeScore ?? 0;

                return (
                  <div
                    key={number}
                    className={`group relative flex aspect-square cursor-help flex-col items-center justify-center rounded-xl transition-all duration-500 hover:scale-110 ${getMomentumColor(
                      score
                    )}`}
                  >
                    <div className="text-lg font-black leading-none">{number}</div>
                    {momentum?.isHeatingUp && (
                      <Zap className="absolute right-1 top-1 h-2 w-2 text-yellow-400" />
                    )}

                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-32 -translate-x-1/2 rounded-xl border border-[var(--border-color)] bg-black p-3 opacity-0 shadow-2xl transition-all group-hover:opacity-100">
                      <div className="mb-1 text-[10px] font-black uppercase text-[var(--accent-blue)]">
                        Momentum Report
                      </div>
                      <div className="flex justify-between text-xs text-white">
                        V: <span>{momentum?.velocity ?? 0}x</span>
                      </div>
                      <div className="flex justify-between text-xs text-white">
                        A: <span>{((momentum?.acceleration ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-[rgba(255,255,255,0.1)] pt-1 text-xs text-white">
                        Heat: <span className="font-bold">{score.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="glass-card bg-gradient-to-br from-[rgba(219,39,119,0.1)] to-transparent p-6">
              <div className="mb-2 flex items-center gap-2 text-[var(--accent-magenta)]">
                <ArrowUpRight className="h-5 w-5" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Velocity Concept</h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Velocity above 1.2 means the number is appearing more often than its long-term
                baseline. Brighter cells indicate stronger short-term pressure.
              </p>
            </div>
            <div className="glass-card bg-gradient-to-br from-[rgba(59,130,246,0.1)] to-transparent p-6">
              <div className="mb-2 flex items-center gap-2 text-[var(--accent-blue)]">
                <Zap className="h-5 w-5" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">
                  Acceleration Factor
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Acceleration compares the very recent burst to the broader recent window. High
                acceleration highlights candidates whose momentum is increasing right now.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
