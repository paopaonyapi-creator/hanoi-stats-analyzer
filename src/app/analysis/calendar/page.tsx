"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Star, Info, ShieldCheck } from "lucide-react";
import { DRAW_TYPE_LABELS, DRAW_TYPE_COLORS } from "@/lib/constants";
import type { DrawType } from "@/types";

interface CalendarDay {
  date: string;
  day: number;
  weekday: number;
  score: number;
  powerTypes: DrawType[];
  isToday: boolean;
}

interface CalendarResponse {
  days: CalendarDay[];
  powerWeekdays: Partial<Record<DrawType, number>>;
}

export default function LuckyCalendarPage() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch("/api/analysis/calendar");
        const payload: CalendarResponse = await response.json();
        setData(payload);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchCalendar();
  }, []);

  if (loading) return <LoadingState />;

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Lucky Calendar"
        description="Calendar view for high-probability weekdays across each Hanoi market."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--border-color)]">
              {weekdays.map((weekday) => (
                <div
                  key={weekday}
                  className="bg-[var(--bg-card)] p-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"
                >
                  {weekday}
                </div>
              ))}

              {data?.days.map((day) => (
                <div
                  key={day.date}
                  className={`flex min-h-[100px] flex-col gap-1 border-t border-[var(--border-color)] bg-[var(--bg-card)] p-2 transition-all hover:bg-[rgba(255,255,255,0.02)] ${
                    day.isToday ? "ring-2 ring-inset ring-[var(--accent-blue)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        day.isToday ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {day.day}
                    </span>
                    {day.score > 50 && (
                      <Star className="h-3 w-3 animate-pulse fill-current text-[var(--accent-amber)]" />
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-1">
                    {day.powerTypes.map((type) => (
                      <div
                        key={type}
                        className="rounded border bg-[var(--bg-card)] px-1 text-[8px] font-bold text-[var(--text-muted)]"
                        style={{ borderColor: DRAW_TYPE_COLORS[type] }}
                      >
                        {DRAW_TYPE_LABELS[type].replace("ฮานอย", "").trim() || type}
                      </div>
                    ))}
                  </div>

                  {day.score > 20 && (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--bg-input)]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-rose-500"
                        style={{ width: `${day.score}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-card border-l-4 border-l-[var(--accent-amber)] p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--accent-amber)]">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase">AI Insights</h3>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              Power days are inferred from the strongest weekday frequency over the last year of
              results for each market.
            </p>
            <div className="mt-4 space-y-3">
              {data &&
                (Object.entries(data.powerWeekdays) as [DrawType, number][]).map(([type, day]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2"
                  >
                    <span className="text-[10px] font-bold">{DRAW_TYPE_LABELS[type]}</span>
                    <span className="text-[10px] font-black text-[var(--accent-blue)]">
                      {weekdays[day]}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--accent-violet)]">
              <Info className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase">Legend</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-[10px]">
                <div className="h-2 w-2 rounded bg-rose-500" />
                <span>High probability day</span>
              </li>
              <li className="flex items-center gap-2 text-[10px]">
                <Star className="h-3 w-3 text-[var(--accent-amber)]" />
                <span>Multiple markets align on the same day</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
