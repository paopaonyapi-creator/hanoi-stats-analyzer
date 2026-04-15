"use client";

import { AlertOctagon } from "lucide-react";

export function NoReliableSignalBanner({
  show,
  message,
}: {
  show: boolean;
  message?: string;
}) {
  if (!show) return null;

  return (
    <div className="glass-card p-4 mb-4 border border-[rgba(107,114,128,0.3)] bg-[rgba(107,114,128,0.05)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(107,114,128,0.15)] flex items-center justify-center flex-shrink-0">
          <AlertOctagon className="w-5 h-5 text-[#9ca3af]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#9ca3af] mb-1">
            ไม่พบสัญญาณที่น่าเชื่อถือ
          </h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {message ||
              "ระบบยังไม่พบสัญญาณเชิงสถิติที่น่าเชื่อถือจากข้อมูลปัจจุบัน ผลลัพธ์ที่แสดงควรใช้เพื่อการสำรวจข้อมูลเท่านั้น ไม่ควรใช้เป็นฐานในการตัดสินใจ"}
          </p>
        </div>
      </div>
    </div>
  );
}
