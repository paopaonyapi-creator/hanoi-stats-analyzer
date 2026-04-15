"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Brain, Sparkles, TrendingUp, RefreshCw, ChevronRight } from "lucide-react";
import { ChartCard } from "@/components/common/chart-card";

interface Prediction {
  number: string;
  confidence: number;
  reasons: string[];
}

export default function PredictionPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = () => {
    setLoading(true);
    fetch("/api/predict")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPredictions(data.predictions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="text-center py-16 text-[var(--accent-rose)]">
        เกิดข้อผิดพลาด: {error}
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
            ระบบเก็งเลข (2 ตัวท้าย) อัจฉริยะจากอัลกอริทึม Truth Engine บนข้อมูลจริง 3,000 งวด
          </p>
        </div>
        <button 
          onClick={fetchPredictions}
          className="btn-secondary rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-[var(--bg-card-hover)]"
        >
          <RefreshCw className="w-5 h-5 text-[var(--accent-blue)]" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top 1 Prediction Hologram Card */}
        {predictions.length > 0 && (
          <div className="lg:col-span-1">
            <div className="glass-card relative overflow-hidden group h-full">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              <div className="p-8 flex flex-col items-center justify-center h-full relative z-10">
                <div className="flex items-center gap-2 text-[var(--accent-violet)] mb-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold tracking-widest text-sm uppercase">Top Pick</span>
                </div>
                
                <h2 className="text-7xl font-black text-white drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] mb-6">
                  {predictions[0].number}
                </h2>
                
                {/* Circular Progress (CSS driven) */}
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-[var(--bg-input)] border-4 border-[var(--border-color)] group-hover:border-[var(--accent-blue)] transition-colors duration-500">
                  <div className="text-center">
                    <span className="text-2xl font-black text-white">{predictions[0].confidence}%</span>
                    <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Predictions List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ChartCard title="การวิเคราะห์เลขเต็งอันดับถัดมา">
            <div className="flex flex-col gap-3 mt-2">
              {predictions.slice(1, 6).map((pred, idx) => (
                <div 
                  key={pred.number}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[var(--accent-violet)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[var(--accent-violet)] font-bold text-xs">
                      #{idx + 2}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[var(--accent-magenta)] transition-colors">{pred.number}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                         {pred.reasons.map((r, i) => (
                           <span key={i} className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                             <TrendingUp className="w-3 h-3" /> {r}
                           </span>
                         ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
                      {pred.confidence}% Score
                    </span>
                    <div className="w-24 h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
      
      {/* Logic Summary Banner */}
      <div className="disclaimer-banner flex items-start gap-4">
        <Brain className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm mb-1 text-[var(--accent-emerald)]">AI Prediction Engine Logic</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            ตัวเลขอ้างอิงจาก Hot numbers ใน 100 งวดล่าสุด (น้ำหนัก 60%) ผสมผสานกับ Sequence Matching ว่าเมื่อออกแบบงวดล่าสุดแล้ว สถิติมักจะออกเลขอะไรตามมา (น้ำหนัก 40%) ทำให้ระบบคิดค้นหาเลขที่มีสัดส่วนความน่าจะเป็นสูงสุดในเวลานี้ โปรดใช้เป็นแนวทางในการตัดสินใจเท่านั้น.
          </p>
        </div>
      </div>
    </div>
  );
}
