import Papa from "papaparse";
import type { DrawType, CsvPreviewRow } from "@/types";
import { normalizeDrawType, extractDigits } from "./normalize";

// ═══════════════════════════════════════════════
// CSV Field Aliases
// ═══════════════════════════════════════════════
const DATE_ALIASES = ["date", "draw_date", "drawdate", "วันที่"];
const TYPE_ALIASES = ["type", "draw_type", "drawtype", "ประเภท"];
const TIME_ALIASES = ["time", "draw_time", "drawtime", "เวลา"];
const RESULT_ALIASES = ["result", "number", "value", "result5", "ผล", "เลข"];

function findField(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === alias.toLowerCase()
    );
    if (key && row[key] !== undefined && row[key] !== "") {
      return row[key].trim();
    }
  }
  return "";
}

// ═══════════════════════════════════════════════
// Parse CSV Text
// ═══════════════════════════════════════════════

export interface ParsedCsvResult {
  rows: CsvPreviewRow[];
  errors: string[];
}

export function parseCsvText(csvText: string): ParsedCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  const errors: string[] = [];
  const rows: CsvPreviewRow[] = [];

  parsed.data.forEach((row, index) => {
    const dateStr = findField(row, DATE_ALIASES);
    const typeStr = findField(row, TYPE_ALIASES);
    const timeStr = findField(row, TIME_ALIASES);
    const resultStr = findField(row, RESULT_ALIASES);

    // Validate required fields
    if (!dateStr || !resultStr) {
      rows.push({
        rowIndex: index + 1,
        date: dateStr,
        type: typeStr,
        time: timeStr,
        result: resultStr,
        status: "invalid",
        reason: !dateStr ? "Missing date" : "Missing result",
      });
      return;
    }

    // Normalize type
    const parsedType = normalizeDrawType(typeStr);
    if (!parsedType) {
      rows.push({
        rowIndex: index + 1,
        date: dateStr,
        type: typeStr,
        time: timeStr,
        result: resultStr,
        status: "invalid",
        reason: `Unknown draw type: "${typeStr}"`,
      });
      return;
    }

    // Extract digits
    const digits = extractDigits(resultStr);
    if (!digits || digits.length < 2) {
      rows.push({
        rowIndex: index + 1,
        date: dateStr,
        type: typeStr,
        time: timeStr,
        result: resultStr,
        status: "invalid",
        reason: `Invalid result digits: "${resultStr}"`,
      });
      return;
    }

    rows.push({
      rowIndex: index + 1,
      date: dateStr,
      type: typeStr,
      time: timeStr,
      result: resultStr,
      status: "valid",
      parsedType,
      parsedDigits: digits,
    });
  });

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((e) => {
      errors.push(`Row ${e.row}: ${e.message}`);
    });
  }

  return { rows, errors };
}

export function parseCsvRow(row: Record<string, string>): {
  date: string;
  type: string;
  time: string;
  result: string;
} {
  return {
    date: findField(row, DATE_ALIASES),
    type: findField(row, TYPE_ALIASES),
    time: findField(row, TIME_ALIASES),
    result: findField(row, RESULT_ALIASES),
  };
}
