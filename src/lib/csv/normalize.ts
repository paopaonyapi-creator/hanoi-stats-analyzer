import type { DrawType } from "@/types";
import { parse, isValid } from "date-fns";

// ═══════════════════════════════════════════════
// Normalize Draw Type
// ═══════════════════════════════════════════════

const TYPE_MAP: Record<string, DrawType> = {
  special: "SPECIAL",
  "ฮานอยพิเศษ": "SPECIAL",
  พิเศษ: "SPECIAL",
  hanoi_special: "SPECIAL",
  normal: "NORMAL",
  "ฮานอยปกติ": "NORMAL",
  ปกติ: "NORMAL",
  hanoi_normal: "NORMAL",
  hanoi: "NORMAL",
  vip: "VIP",
  "ฮานอยวีไอพี": "VIP",
  วีไอพี: "VIP",
  hanoi_vip: "VIP",
};

export function normalizeDrawType(raw: string): DrawType | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  // Direct match
  if (TYPE_MAP[key]) return TYPE_MAP[key];
  // Check if raw matches enum directly
  const upper = raw.trim().toUpperCase();
  if (upper === "SPECIAL" || upper === "NORMAL" || upper === "VIP") {
    return upper as DrawType;
  }
  return null;
}

// ═══════════════════════════════════════════════
// Extract Digits from Result
// ═══════════════════════════════════════════════

export function extractDigits(raw: string): string | null {
  if (!raw) return null;
  // Strip everything that is not a digit
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 2) return null;
  return digits;
}

// ═══════════════════════════════════════════════
// Parse Date String
// ═══════════════════════════════════════════════

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "dd/MM/yyyy",
  "d/M/yyyy",
  "dd-MM-yyyy",
  "yyyy/MM/dd",
  "MM/dd/yyyy",
  "dd.MM.yyyy",
];

export function parseDrawDate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (isValid(isoDate) && !isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try various formats
  for (const fmt of DATE_FORMATS) {
    try {
      const parsed = parse(trimmed, fmt, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/** Get last N digits */
export function lastN(digits: string, n: number): string {
  return digits.slice(-n).padStart(n, "0");
}

/** Get month key from Date: "YYYY-MM" */
export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
