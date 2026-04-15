import type { DrawType, ScoreWeights } from "@/types";

// ═══════════════════════════════════════════════
// Application Constants
// ═══════════════════════════════════════════════

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Hanoi Stats Analyzer";

export const APP_DISCLAIMER =
  process.env.NEXT_PUBLIC_APP_DISCLAIMER ||
  "ระบบนี้เป็นเครื่องมือวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติเท่านั้น ไม่ใช่การรับประกันผล และไม่ควรตีความว่าเป็นคำแนะนำในการเล่นพนัน";

export const DRAW_TYPE_LABELS: Record<DrawType, string> = {
  SPECIAL: "ฮานอยพิเศษ",
  NORMAL: "ฮานอยปกติ",
  VIP: "ฮานอยวีไอพี",
};

export const DRAW_TYPE_TIMES: Record<DrawType, string> = {
  SPECIAL: "17:00–17:30",
  NORMAL: "18:00–18:30",
  VIP: "19:00–19:30",
};

export const DRAW_TYPE_COLORS: Record<DrawType, string> = {
  SPECIAL: "#f59e0b",
  NORMAL: "#3b82f6",
  VIP: "#8b5cf6",
};

export const WEEKDAY_LABELS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

export const WEEKDAY_LABELS_EN = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  allTime: 1.0,
  recent: 1.5,
  gap: 1.2,
  transition: 1.0,
  digitBalance: 0.8,
  repeat: 1.0,
  weekday: 0.7,
};

export const ROLLING_WINDOW_OPTIONS = [
  { label: "ทั้งหมด", value: 0 },
  { label: "10 ล่าสุด", value: 10 },
  { label: "20 ล่าสุด", value: 20 },
  { label: "50 ล่าสุด", value: 50 },
];

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
