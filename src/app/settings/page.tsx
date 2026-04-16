"use client";

import { useEffect, useState } from "react";
import {
  Save,
  RotateCcw,
  Download,
  Trash2,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LoadingState } from "@/components/common/loading-state";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/constants";
import type { ScoreWeights } from "@/types";

const WEIGHT_LABELS: Record<keyof ScoreWeights, { label: string; desc: string }> = {
  allTime: { label: "ความถี่รวม (All Time)", desc: "น้ำหนักความถี่สะสม" },
  recent: { label: "ความถี่ล่าสุด (Recent)", desc: "น้ำหนักความถี่ช่วงล่าสุด" },
  gap: { label: "Gap Factor", desc: "น้ำหนักระยะห่างจากการปรากฏ" },
  transition: { label: "Transition Factor", desc: "น้ำหนักการเปลี่ยนผ่าน" },
  digitBalance: {
    label: "Digit Balance",
    desc: "น้ำหนักความสมดุลหลักสิบ/หน่วย",
  },
  repeat: { label: "Repeat Behavior", desc: "น้ำหนักรูปแบบการซ้ำ" },
  weekday: { label: "Weekday Alignment", desc: "น้ำหนักความสอดคล้องวัน" },
};

export default function SettingsPage() {
  const [weights, setWeights] = useState<ScoreWeights>({
    ...DEFAULT_SCORE_WEIGHTS,
  });
  const [telegramSettings, setTelegramSettings] = useState({ token: "", chatId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [saved, setSaved] = useState(false);
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings?key=scoreWeights").then(r => r.json()),
      fetch("/api/settings?key=telegram_bot_settings").then(r => r.json()),
      fetch("/api/analysis/health").then(r => r.json())
    ])
      .then(([wData, tData, hData]) => {
        if (wData.scoreWeights) {
          setWeights({ ...DEFAULT_SCORE_WEIGHTS, ...wData.scoreWeights });
        }
        if (tData?.valueJson?.token) {
          setTelegramSettings(tData.valueJson);
        }
        if (hData.integrityScore !== undefined) {
           setHealth(hData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleReScan = async () => {
    setScanning(true);
    try {
       const res = await fetch("/api/analysis/health");
       const data = await res.json();
       setHealth(data);
    } catch { } finally {
       setScanning(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "scoreWeights",
          valueJson: weights,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { } finally {
      setSaving(false);
    }
  };

  const handleSaveTelegram = async () => {
    setSavingTelegram(true);
    setTelegramSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "telegram_bot_settings",
          valueJson: telegramSettings,
        }),
      });
      setTelegramSaved(true);
      setTimeout(() => setTelegramSaved(false), 3000);
    } catch { } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch("/api/cron/sync-daily", { 
        method: "POST", 
        body: JSON.stringify({ test: true }) 
      });
      if (res.ok) alert("✅ ส่งข้อความทดสอบไปยัง Telegram สำเร็จ!");
      else alert("❌ เกิดข้อผิดพลาดในการส่งข้อความ");
    } catch {
      alert("❌ ไม่สามารถเชื่อมต่อ API ได้");
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_SCORE_WEIGHTS });
    setShowResetDialog(false);
  };

  const handleDeleteDb = async () => {
    setDeleting(true);
    try {
      await fetch("/api/settings?action=reset-db", { method: "DELETE" });
      setShowDeleteDialog(false);
      alert("ลบข้อมูลสำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="ตั้งค่า"
        description="จัดการ weights สำหรับ Trend Score และตั้งค่าระบบ"
      />

      {/* Score Weights */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Trend Score Weights
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          ปรับน้ำหนักของแต่ละ factor ที่ใช้ในการคำนวณ Statistical Trend Score
          (ค่าระหว่าง 0-10)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {(Object.keys(WEIGHT_LABELS) as Array<keyof ScoreWeights>).map(
            (key) => (
              <div key={key} className="p-4 rounded-lg bg-[var(--bg-input)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {WEIGHT_LABELS[key].label}
                  </label>
                  <input
                    type="number"
                    className="input-field w-20 text-center"
                    value={weights[key]}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={(e) =>
                      setWeights({
                        ...weights,
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {WEIGHT_LABELS[key].desc}
                </p>
                <input
                  type="range"
                  className="w-full mt-2 accent-blue-500"
                  value={weights[key]}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      [key]: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว ✓" : "บันทึก Manual Weights"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            รีเซ็ตค่าเริ่มต้น
          </button>
        </div>
      </div>

      {/* God-Tier Auto-Optimization */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-[var(--accent-amber)] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          God-Tier Genetic Optimization
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          ใช้ Genetic Algorithm จำลองหาค่าน้ำหนัก (Weights) ที่ให้ค่า Edge เหนือ Random Baseline มากที่สุดในสภาวะตลาดปัจจุบัน (ใช้เวลาประมาณ 10-30 วินาที)
        </p>

        {optResult && (
          <div className="mb-4 p-4 rounded-lg bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)]">
            <h4 className="text-[11px] text-[var(--accent-emerald)] font-bold mb-2">🏆 Champion Weights Found</h4>
            <div className="text-[10px] text-[var(--text-secondary)]">
              <span className="block mb-1">🔥 <b>New Edge Delta:</b> {optResult.champion.edgeDelta}</span>
              <p className="mt-2 text-white bg-[rgba(0,0,0,0.3)] p-2 rounded">{JSON.stringify(optResult.champion.weights, null, 2)}</p>
            </div>
          </div>
        )}

        <button
          className="btn-primary w-full sm:w-auto"
          onClick={async () => {
            setOptimizing(true);
            try {
              const res = await fetch("/api/predict/optimize?period=60&iterations=15&population=10");
              const data = await res.json();
              if (data.champion) {
                 setOptResult(data);
                 setWeights(data.champion.weights);
              }
            } catch (err) {
              alert("Optimization Failed");
            } finally {
              setOptimizing(false);
            }
          }}
          disabled={optimizing}
          style={{ background: optimizing ? "var(--bg-input)" : "var(--gradient-amber)" }}
        >
          {optimizing ? (
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 animate-spin" /> ค้นหา Champion Weights...</span>
          ) : (
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> เริ่มกระบวนการ Genetic Evolution</span>
          )}
        </button>
      </div>

      {/* Telegram Bot Settings */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Telegram Bot Optimization
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          ตั้งค่าการแจ้งเตือนสถาปัตยกรรมใหม่ (Telegram Only) เพื่อรับผลรางวัลและสัญญาณ God-Tier
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
               <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Bot API Token</label>
               <input 
                 type="password"
                 value={telegramSettings.token}
                 onChange={(e) => setTelegramSettings({ ...telegramSettings, token: e.target.value })}
                 className="input-field"
                 placeholder="Enter Bot Token..."
               />
            </div>
            <div>
               <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Chat ID</label>
               <input 
                 type="text"
                 value={telegramSettings.chatId}
                 onChange={(e) => setTelegramSettings({ ...telegramSettings, chatId: e.target.value })}
                 className="input-field"
                 placeholder="Enter Chat ID..."
               />
            </div>
        </div>

        <div className="flex flex-wrap gap-3">
           <button 
             onClick={handleSaveTelegram}
             disabled={savingTelegram}
             className="btn-primary"
           >
             <Save className="w-4 h-4 inline mr-1" />
             {savingToken ? "กำลังบันทึก..." : tokenSaved ? "บันทึก Token สำเร็จ ✓" : "บันทึก Token"}
           </button>
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
           <p className="text-[11px] text-[var(--accent-blue)] flex items-center gap-2">
             <AlertTriangle className="w-3 h-3" />
             วิธีใช้: สร้าง Token ได้ที่ <a href="https://notify-bot.line.me/" target="_blank" className="underline font-bold">notify-bot.line.me</a>
           </p>
        </div>
      </div>

      {/* System Health Auditor */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-emerald)]" />
              คุณภาพข้อมูล & System Health
           </h3>
           <button 
             onClick={handleReScan}
             disabled={scanning}
             className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
           >
             <Activity className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
             Re-scan
           </button>
        </div>
        
        {health && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Integrity Score</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                       health.status === 'HEALTHY' ? 'bg-[rgba(16,185,129,0.1)] text-[var(--accent-emerald)]' : 
                       health.status === 'WARNING' ? 'bg-[rgba(245,158,11,0.1)] text-[var(--accent-amber)]' : 
                       'bg-[rgba(244,63,94,0.1)] text-[var(--accent-rose)]'
                    }`}>
                       {health.status}
                    </span>
                 </div>
                 <div className="text-3xl font-black text-white">{health.integrityScore}%</div>
                 <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">{health.recommendation}</p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] overflow-hidden">
                 <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-2">Data Gaps (Last 30 Days)</span>
                 <div className="space-y-2">
                    {['SPECIAL', 'NORMAL', 'VIP'].map(type => (
                       <div key={type} className="flex items-center justify-between text-[10px]">
                          <span className="font-bold">{type}</span>
                          {health.missingDays[type].length > 0 ? (
                             <span className="text-[var(--accent-amber)]">{health.missingDays[type].length} days missing</span>
                          ) : (
                             <span className="text-[var(--accent-emerald)] font-bold">100% COMPLETE</span>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Export */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Export ข้อมูล
        </h3>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export/csv" download className="btn-secondary">
            <Download className="w-4 h-4 inline mr-1" />
            Export CSV
          </a>
          <a href="/api/export/json" download className="btn-secondary">
            <Download className="w-4 h-4 inline mr-1" />
            Export JSON
          </a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-[rgba(244,63,94,0.3)]">
        <h3 className="text-sm font-semibold text-[var(--accent-rose)] mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          การดำเนินการเหล่านี้ไม่สามารถย้อนกลับได้
        </p>
        <button
          className="btn-danger"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 inline mr-1" />
          ลบข้อมูลทั้งหมด
        </button>
      </div>

      {/* Dialogs */}
      {showResetDialog && (
        <ConfirmDialog
          title="รีเซ็ต Weights"
          message="ต้องการรีเซ็ตค่า weights กลับเป็นค่าเริ่มต้นหรือไม่? (ยังไม่ save)"
          variant="warning"
          onConfirm={handleReset}
          onCancel={() => setShowResetDialog(false)}
        />
      )}
      {showDeleteDialog && (
        <ConfirmDialog
          title="ลบข้อมูลทั้งหมด"
          message="ข้อมูลทั้งหมดจะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้ ยืนยันหรือไม่?"
          variant="danger"
          confirmLabel={deleting ? "กำลังลบ..." : "ยืนยันลบ"}
          onConfirm={handleDeleteDb}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
