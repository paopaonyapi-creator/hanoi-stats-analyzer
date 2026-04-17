"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface DrawStatus {
  type: string;
  label: string;
  timeSlot: string;
  status: "SOON" | "LIVE" | "CLOSED";
  countdown?: string;
}

const DRAW_SCHEDULE = [
  { type: "SPECIAL", label: "ฮานอยพิเศษ", hour: 17, min: 0 },
  { type: "NORMAL", label: "ฮานอยปกติ", hour: 18, min: 0 },
  { type: "VIP", label: "ฮานอยวีไอพี", hour: 19, min: 0 },
];

export function LiveMonitor() {
  const [statuses, setStatuses] = useState<DrawStatus[]>([]);
  const [now, setNow] = useState(new Date());
  const [lastSyncStatus, setLastSyncStatus] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Bangkok Time logic (UTC+7)
    const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    
    const newStatuses = DRAW_SCHEDULE.map((item) => {
      const drawTime = new Date(bangkokTime);
      drawTime.setHours(item.hour, item.min, 0);

      const endTime = new Date(drawTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      let status: "SOON" | "LIVE" | "CLOSED";
      let countdown = "";

      if (bangkokTime < drawTime) {
        status = "SOON";
        const diff = drawTime.getTime() - bangkokTime.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        countdown = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      } else if (bangkokTime >= drawTime && bangkokTime < endTime) {
        status = "LIVE";
      } else {
        status = "CLOSED";
      }

      return {
        type: item.type,
        label: item.label,
        timeSlot: `${item.hour}:${item.min.toString().padStart(2, "0")} น.`,
        status,
        countdown,
      };
    });

    setStatuses(newStatuses);

    // ─── AUTO-SYNC LOGIC ───
    newStatuses.forEach(s => {
       if (s.status === "CLOSED" && lastSyncStatus[s.type] !== "CLOSED") {
          setLastSyncStatus(prev => ({ ...prev, [s.type]: "CLOSED" }));
          handleAutoSync(s.label);
       } else if (s.status !== "CLOSED" && lastSyncStatus[s.type] === "CLOSED") {
          setLastSyncStatus(prev => ({ ...prev, [s.type]: s.status }));
       }
    });

  }, [now]);

  const handleAutoSync = async (label: string) => {
    setIsSyncing(true);
    try {
       const res = await fetch("/api/cron/sync-daily", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ sync: true }),
       });
       if (res.ok) console.log(`Auto-sync success for ${label}`);
       else console.warn(`Auto-sync returned ${res.status} for ${label}`);
    } catch (e) {
       console.error("Auto-sync failed", e);
    } finally {
       setTimeout(() => setIsSyncing(false), 5000);
    }
  };

  return (
    <div className="relative">
      {isSyncing && (
        <div className="absolute -top-6 right-0 flex items-center gap-2 text-[10px] text-[var(--accent-blue)] animate-pulse">
           <RefreshCw className="w-3 h-3 animate-spin" />
           ระบบกำลังอัปเดตผลรางวัลอัตโนมัติ...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statuses.map((s) => (
          <div key={s.type} className={`glass-card p-4 flex items-center justify-between border-l-4 ${
            s.status === "LIVE" ? "border-l-[var(--accent-emerald)] bg-[rgba(16,185,129,0.05)]" : 
            s.status === "SOON" ? "border-l-[var(--accent-blue)]" : "border-l-[var(--text-muted)] opacity-80"
          }`}>
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-muted)] font-medium mb-1 uppercase tracking-wider">{s.label}</span>
              <div className="flex items-center gap-2">
                 {s.status === "LIVE" ? (
                   <span className="flex h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
                 ) : s.status === "SOON" ? (
                   <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
                 ) : (
                   <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)]" />
                 )}
                 <span className="font-bold text-lg">{s.status === "SOON" ? s.countdown : s.status === "LIVE" ? "กำลังออกผล" : "ปิดรับแล้ว"}</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                 s.status === "LIVE" ? "bg-[var(--accent-emerald)] text-white" : "bg-[var(--bg-input)] text-[var(--text-secondary)]"
              }`}>
                {s.status}
              </span>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{s.timeSlot}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
