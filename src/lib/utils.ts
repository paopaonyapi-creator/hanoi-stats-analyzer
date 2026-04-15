import { clsx, type ClassValue } from "clsx";

// ═══════════════════════════════════════════════
// General Utilities
// ═══════════════════════════════════════════════

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  // Simple class merge without tailwind-merge for now
  return clsx(inputs);
}

/** Format a number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Pad a number to N digits with leading zeros */
export function padDigits(value: string | number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Extract last N digits from a string */
export function lastNDigits(digits: string, n: number): string {
  return digits.slice(-n).padStart(n, "0");
}

/** Check if a digit string is odd (last digit odd) */
export function isOdd(last1: string): boolean {
  return parseInt(last1, 10) % 2 !== 0;
}

/** Check if a 2-digit number is "low" (00-49) */
export function isLow(last2: string): boolean {
  return parseInt(last2, 10) < 50;
}

/** Get tens digit from a 2-digit string */
export function getTens(last2: string): string {
  return last2.length >= 2 ? last2[last2.length - 2] : "0";
}

/** Get units digit from a 2-digit string */
export function getUnits(last2: string): string {
  return last2[last2.length - 1] || "0";
}

/** Generate array [00, 01, ..., 99] */
export function generateLast2Range(): string[] {
  return Array.from({ length: 100 }, (_, i) => padDigits(i, 2));
}

/** Generate array [0, 1, ..., 9] */
export function generateDigitRange(): string[] {
  return Array.from({ length: 10 }, (_, i) => String(i));
}

/** Safe JSON parse */
export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/** Delay helper */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
