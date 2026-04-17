"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Info, TrendingUp, Hash } from "lucide-react";

interface HeatmapData {
  number: string;
  score: number;
  gap: number;
  hits: number;
}

interface PredictionItem {
  number: string;
  confidence: number;
  signals: string[];
}

interface PredictResponse {
  predictions: PredictionItem[];
}

export default function SignalHeatmapPage() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawType, setDrawType] = useState("ALL");

  const fetchHeatmapData = async (currentDrawType: string) => {
    setLoading(true);
    // Fetch prediction data for all numbers to build the heatmap
    // We'll reuse the logic from trend-score or similar
    try {
      const res = await fetch(`/api/predict?type=${currentDrawType}`);
      const payload: PredictResponse = await res.json();
      const numbers = Array.from({ length: 100 }, (_, i) => {
        const num = i.toString().padStart(2, "0");
        const pred = payload.predictions.find((item) => item.number === num);
        return {
          number: num,
          score: pred?.confidence ?? 0,
          gap: 0, // In a real app, we'd fetch this too
          hits: pred?.signals.length ?? 0,
        };
      });
      setData(numbers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHeatmapData(drawType);
  }, [drawType]);

  const getColor = (score: number) => {
    if (score > 80) return "bg-[var(--accent-rose)] text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]";
    if (score > 60) return "bg-[var(--accent-amber)] text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]";
    if (score > 40) return "bg-[var(--accent-violet)] text-white";
    if (score > 20) return "bg-[var(--accent-blue)] text-white opacity-80";
    return "bg-[var(--bg-input)] text-[var(--text-muted)] opacity-40";
  };

  if (loading) return <LoadingState />;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="AI Signal Heatmap"
        description="ตารางความร้อนแรงของตัวเลข 00-99 วิเคราะห์จากสถิติและ AI"
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
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Heatmap Grid */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <div className="grid grid-cols-10 gap-2">
              {data.map((item) => (
                <div
                  key={item.number}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 cursor-help hover:scale-110 hover:z-10 ${getColor(item.score)}`}
                  title={`เลข: ${item.number}\nคะแนน: ${item.score}%\nจำนวนครั้งที่ออก: ${item.hits}`}
                >
                  <span className="text-sm">{item.number}</span>
                  {item.score > 50 && <span className="text-[8px] opacity-70">{item.score}%</span>}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded bg-[var(--accent-rose)]"></div>
                   <span className="text-[10px] text-[var(--text-muted)]">Hot (80%+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded bg-[var(--accent-amber)]"></div>
                   <span className="text-[10px] text-[var(--text-muted)]">High (60%+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded bg-[var(--accent-violet)]"></div>
                   <span className="text-[10px] text-[var(--text-muted)]">Mid (40%+)</span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] italic">
                * แตะที่ช่องเพื่อดูรายละเอียด
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Legend */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 text-[var(--accent-violet)]">
              <Info className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">How it works</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Heatmap คำนวณความร้อนแรงโดยใช้ดัชนี **Truth Engine** ซึ่งพิจารณาจาก:
            </p>
            <ul className="space-y-3">
               <li className="flex items-start gap-2">
                 <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-[var(--accent-blue)]" />
                 <span className="text-[11px]">**Frequency**: จำนวนครั้งที่ออกในช่วง 100 งวด</span>
               </li>
               <li className="flex items-start gap-2">
                 <Hash className="w-3.5 h-3.5 mt-0.5 text-[var(--accent-emerald)]" />
                 <span className="text-[11px]">**Transition**: โอกาสที่จะตามเลขงวดล่าสุด</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
