"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="glass-card p-6 max-w-md w-full relative animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              variant === "danger"
                ? "bg-[rgba(244,63,94,0.15)]"
                : "bg-[rgba(245,158,11,0.15)]"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                variant === "danger"
                  ? "text-[var(--accent-rose)]"
                  : "text-[var(--accent-amber)]"
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={variant === "danger" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
