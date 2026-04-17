// ═══════════════════════════════════════════════
// Migration Utility — CSV Batch Importer
// ═══════════════════════════════════════════════
// Handles importing historical Hanoi lottery CSV data
// with full validation, deduplication, and dry-run mode.
//
// Expected CSV columns (in any order, case-insensitive):
//   date, type, result, time (optional), source (optional)
//
// Date formats supported:
//   - yyyy-MM-dd
//   - dd/MM/yyyy
//   - dd-MM-yyyy
//   - ISO 8601
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";

export interface MigrationRow {
    date: string;
    type: string;
    result: string;
    time?: string;
    source?: string;
}

export interface MigrationResult {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    imported: number;
    errors: Array<{ row: number; reason: string; raw: string }>;
    records: Array<Omit<DrawResultRecord, "id" | "createdAt" | "updatedAt">>;
}

// ─────────────────────────────────────────────

const DRAW_TYPE_MAP: Record<string, string> = {
    special: "SPECIAL",
    "hanoi special": "SPECIAL",
    "ฮานอยพิเศษ": "SPECIAL",
    พิเศษ: "SPECIAL",
    normal: "NORMAL",
    "hanoi normal": "NORMAL",
    "ฮานอยปกติ": "NORMAL",
    ปกติ: "NORMAL",
    vip: "VIP",
    "hanoi vip": "VIP",
    "ฮานอยวีไอพี": "VIP",
    "วีไอพี": "VIP",
};

function normalizeDrawType(raw: string): "SPECIAL" | "NORMAL" | "VIP" | null {
    const key = raw.trim().toLowerCase();
    const found = DRAW_TYPE_MAP[key];
    if (found) return found as "SPECIAL" | "NORMAL" | "VIP";
    // Partial match fallback
    if (key.includes("special") || key.includes("พิเศษ")) return "SPECIAL";
    if (key.includes("vip") || key.includes("วีไอ")) return "VIP";
    if (key.includes("normal") || key.includes("ปกติ")) return "NORMAL";
    return null;
}

function parseDate(raw: string): Date | null {
    if (!raw?.trim()) return null;
    const s = raw.trim();

    // yyyy-MM-dd or dd/MM/yyyy or dd-MM-yyyy
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
        const [a, b, c] = parts.map(Number);
        // heuristic: year > 31 means it's the first part
        if (a > 31) {
            const d = new Date(a, b - 1, c);
            if (!isNaN(d.getTime())) return d;
        } else {
            // dd/MM/yyyy
            const d = new Date(c, b - 1, a);
            if (!isNaN(d.getTime())) return d;
        }
    }

    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso;
    return null;
}

function extractDigits(raw: string): { digits: string; last1: string; last2: string; last3: string } | null {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 2) return null;

    const last1 = digits.slice(-1);
    const last2 = digits.slice(-2).padStart(2, "0");
    const last3 = digits.slice(-3).padStart(3, "0");

    return { digits, last1, last2, last3 };
}

function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────

export function parseCsvForMigration(
    csvText: string,
    options?: { source?: string; dryRun?: boolean }
): MigrationResult {
    const source = options?.source ?? "csv-import";
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
        return {
            total: 0, valid: 0, invalid: 0, duplicates: 0, imported: 0,
            errors: [{ row: 0, reason: "File is empty or has no data rows", raw: "" }],
            records: [],
        };
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("วัน"));
    const typeIdx = headers.findIndex((h) => h.includes("type") || h.includes("ประเภท"));
    const resultIdx = headers.findIndex((h) => h.includes("result") || h.includes("ผล") || h.includes("digit") || h.includes("number"));
    const timeIdx = headers.findIndex((h) => h.includes("time") || h.includes("เวลา"));
    const sourceIdx = headers.findIndex((h) => h.includes("source") || h.includes("แหล่ง"));

    if (dateIdx === -1 || typeIdx === -1 || resultIdx === -1) {
        return {
            total: 0, valid: 0, invalid: 0, duplicates: 0, imported: 0,
            errors: [{ row: 0, reason: `Required columns missing. Found: ${headers.join(", ")}. Need: date, type, result`, raw: "" }],
            records: [],
        };
    }

    const result: MigrationResult = {
        total: lines.length - 1,
        valid: 0, invalid: 0, duplicates: 0, imported: 0,
        errors: [],
        records: [],
    };

    const seenKeys = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        const cols = raw.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

        const rawDate = cols[dateIdx] ?? "";
        const rawType = cols[typeIdx] ?? "";
        const rawResult = cols[resultIdx] ?? "";
        const rawTime = timeIdx >= 0 ? (cols[timeIdx] ?? "") : "";
        const rawSource = sourceIdx >= 0 ? (cols[sourceIdx] ?? source) : source;

        // Validate date
        const drawDate = parseDate(rawDate);
        if (!drawDate) {
            result.invalid++;
            result.errors.push({ row: i + 1, reason: `Invalid date: "${rawDate}"`, raw });
            continue;
        }

        // Validate type
        const drawType = normalizeDrawType(rawType);
        if (!drawType) {
            result.invalid++;
            result.errors.push({ row: i + 1, reason: `Invalid draw type: "${rawType}"`, raw });
            continue;
        }

        // Validate result digits
        const digitData = extractDigits(rawResult);
        if (!digitData) {
            result.invalid++;
            result.errors.push({ row: i + 1, reason: `Cannot extract digits from: "${rawResult}"`, raw });
            continue;
        }

        // Deduplication check
        const dedupKey = `${drawDate.toISOString().split("T")[0]}_${drawType}`;
        if (seenKeys.has(dedupKey)) {
            result.duplicates++;
            continue;
        }
        seenKeys.add(dedupKey);

        result.valid++;
        result.records.push({
            drawDate: drawDate.toISOString(),
            drawType,
            drawTime: rawTime || null,
            resultRaw: rawResult,
            resultDigits: digitData.digits,
            last1: digitData.last1,
            last2: digitData.last2,
            last3: digitData.last3,
            weekday: drawDate.getDay(),
            monthKey: getMonthKey(drawDate),
            source: rawSource,
        });
    }

    result.imported = options?.dryRun ? 0 : result.valid - result.duplicates;
    return result;
}

// ─────────────────────────────────────────────
// Generate realistic-looking seed records
// Uses weighted distribution to simulate real lottery patterns
// ─────────────────────────────────────────────

export function generateRealisticSeedRecords(
    startDate: Date,
    days: number,
    drawTypes: ("SPECIAL" | "NORMAL" | "VIP")[] = ["SPECIAL", "NORMAL", "VIP"]
): Array<Omit<DrawResultRecord, "id" | "createdAt" | "updatedAt">> {
    const records: Array<Omit<DrawResultRecord, "id" | "createdAt" | "updatedAt">> = [];

    // Hot numbers — appear more frequently (simulating real patterns)
    const hotNumbers = ["23", "45", "67", "12", "78", "34", "56", "89", "01", "90"];
    const coldNumbers = ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99"];

    function weightedRandom(): string {
        const roll = Math.random();
        if (roll < 0.25) {
            // 25% chance of hot number
            return hotNumbers[Math.floor(Math.random() * hotNumbers.length)];
        } else if (roll < 0.30) {
            // 5% chance of cold number (doubles/mirrors)
            return coldNumbers[Math.floor(Math.random() * coldNumbers.length)];
        } else {
            // Regular random
            return Math.floor(Math.random() * 100).toString().padStart(2, "0");
        }
    }

    const DRAW_TIMES: Record<string, string> = {
        SPECIAL: "17:00",
        NORMAL: "18:00",
        VIP: "19:00",
    };

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);

        // Skip ~3% of days randomly for realism
        if (Math.random() < 0.03) continue;

        for (const type of drawTypes) {
            // Skip VIP on random days ~5% of the time
            if (type === "VIP" && Math.random() < 0.05) continue;

            const last2 = weightedRandom();
            // Generate a realistic 5-digit result where last 2 match
            const prefix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
            const digits = prefix + last2;

            const last1 = digits.slice(-1);
            const last3 = digits.slice(-3).padStart(3, "0");
            const drawTime = DRAW_TIMES[type];
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            records.push({
                drawDate: date.toISOString(),
                drawType: type,
                drawTime,
                resultRaw: digits,
                resultDigits: digits,
                last1,
                last2,
                last3,
                weekday: date.getDay(),
                monthKey,
                source: "seed",
            });
        }
    }

    return records;
}
