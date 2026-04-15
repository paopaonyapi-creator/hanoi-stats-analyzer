"use client";

import { useEffect, useState } from "react";
import {
  Save,
  RotateCcw,
  Download,
  Trash2,
  AlertTriangle,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.scoreWeights) {
          setWeights({ ...DEFAULT_SCORE_WEIGHTS, ...d.scoreWeights });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    } catch {
      // handle
    } finally {
      setSaving(false);
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
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว ✓" : "บันทึก"}
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
