"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Calendar as CalendarIcon, Star, Info, TrendingUp, ShieldCheck } from "lucide-react";
import { DRAW_TYPE_LABELS, DRAW_TYPE_COLORS } from "@/lib/constants";

interface CalendarDay {
  date: string;
  day: number;
  weekday: number;
  score: number;
  powerTypes: string[];
  isToday: boolean;
}

export default function LuckyCalendarPage() {
  const [data, setData] = useState<{ days: CalendarDay[]; powerWeekdays: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analysis/calendar")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getScoreColor = (score: number) => {
    if (score > 70) return "bg-[rgba(244,63,94,0.15)] border-[var(--accent-rose)] text-[var(--accent-rose)]";
    if (score > 40) return "bg-[rgba(245,158,11,0.1)] border-[var(--accent-amber)] text-[var(--accent-amber)]";
    return "border-[var(--border-color)] text-[var(--text-muted)]";
  };

  if (loading) return <LoadingState />;

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Lucky Calendar"
        description="ตารางวันนำโชคที่วิเคราะห์จากสถิติความถี่สูงสุดรายวัน"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)]">
              {weekdays.map(w => (
                <div key={w} className="bg-[var(--bg-card)] p-3 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  {w}
                </div>
              ))}
              {/* Padding for first day shift if needed (Simplified for current implementation) */}
              {data?.days.map((d) => (
                <div 
                  key={d.date} 
                  className={`bg-[var(--bg-card)] min-h-[100px] p-2 flex flex-col gap-1 border-t border-[var(--border-color)] transition-all hover:bg-[rgba(255,255,255,0.02)]
                    ${d.isToday ? 'ring-2 ring-inset ring-[var(--accent-blue)]' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${d.isToday ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}>
                      {d.day}
                    </span>
                    {d.score > 50 && (
                      <Star className="w-3 h-3 text-[var(--accent-amber)] animate-pulse fill-current" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {d.powerTypes.map(type => (
                      <div 
                        key={type} 
                        className="text-[8px] px-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-bold text-[var(--text-muted)]"
                        style={{ borderColor: (DRAW_TYPE_COLORS as any)[type] }}
                      >
                        {(DRAW_TYPE_LABELS as any)[type]?.replace('ฮานอย', '') || type}
                      </div>
                    ))}
                  </div>

                  {d.score > 20 && (
                     <div className={`mt-1 h-1 rounded-full overflow-hidden bg-[var(--bg-input)]`}>
                        <div className="h-full bg-gradient-to-r from-blue-500 to-rose-500" style={{ width: `${d.score}%` }}></div>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="glass-card p-5 border-l-4 border-l-[var(--accent-amber)]">
              <div className="flex items-center gap-2 mb-3 text-[var(--accent-amber)]">
                 <ShieldCheck className="w-5 h-5" />
                 <h3 className="text-sm font-bold uppercase">AI Insights</h3>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                 Calendar นี้คำนวณจาก **Weekday Frequency Peaks** ในรอบ 3,000 งวดที่ผ่านมา
              </p>
              <div className="mt-4 space-y-3">
                 {data && Object.entries(data.powerWeekdays).map(([type, day]) => (
                    <div key={type} className="flex items-center justify-between p-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
                       <span className="text-[10px] font-bold">{(DRAW_TYPE_LABELS as any)[type] || type}</span>
                       <span className="text-[10px] text-[var(--accent-blue)] font-black">{weekdays[day as number]}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3 text-[var(--accent-violet)]">
                 <Info className="w-5 h-5" />
                 <h3 className="text-sm font-bold uppercase">Legend</h3>
              </div>
              <ul className="space-y-2">
                 <li className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded bg-rose-500"></div>
                    <span>High Probability Day</span>
                 </li>
                 <li className="flex items-center gap-2 text-[10px]">
                    <Star className="w-3 h-3 text-[var(--accent-amber)]" />
                    <span>AI Star Day (Multiple Match)</span>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
