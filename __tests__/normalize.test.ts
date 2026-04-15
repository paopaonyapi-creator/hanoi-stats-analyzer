/**
 * Tests for normalization utilities
 *
 * Run with: npx tsx __tests__/normalize.test.ts
 * (Or integrate with Jest/Vitest when ready)
 */

import { normalizeDrawType, extractDigits, parseDrawDate, lastN } from "../src/lib/csv/normalize";

// ═══════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, testName: string) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.log(`  ❌ ${testName} — expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`);
    failed++;
  } else {
    console.log(`  ✅ ${testName}`);
    passed++;
  }
}

// ═══════════════════════════════════════════════
// normalizeDrawType
// ═══════════════════════════════════════════════

console.log("\n📌 normalizeDrawType");

assertEqual(normalizeDrawType("SPECIAL"), "SPECIAL", "uppercase SPECIAL");
assertEqual(normalizeDrawType("special"), "SPECIAL", "lowercase special");
assertEqual(normalizeDrawType("ฮานอยพิเศษ"), "SPECIAL", "Thai ฮานอยพิเศษ");
assertEqual(normalizeDrawType("พิเศษ"), "SPECIAL", "Thai พิเศษ");

assertEqual(normalizeDrawType("NORMAL"), "NORMAL", "uppercase NORMAL");
assertEqual(normalizeDrawType("normal"), "NORMAL", "lowercase normal");
assertEqual(normalizeDrawType("ฮานอยปกติ"), "NORMAL", "Thai ฮานอยปกติ");
assertEqual(normalizeDrawType("hanoi"), "NORMAL", "alias hanoi");

assertEqual(normalizeDrawType("VIP"), "VIP", "uppercase VIP");
assertEqual(normalizeDrawType("vip"), "VIP", "lowercase vip");
assertEqual(normalizeDrawType("ฮานอยวีไอพี"), "VIP", "Thai ฮานอยวีไอพี");

assertEqual(normalizeDrawType(""), null, "empty string");
assertEqual(normalizeDrawType("unknown"), null, "unknown type");

// ═══════════════════════════════════════════════
// extractDigits
// ═══════════════════════════════════════════════

console.log("\n📌 extractDigits");

assertEqual(extractDigits("48273"), "48273", "plain digits");
assertEqual(extractDigits("4-8-2-7-3"), "48273", "digits with dashes");
assertEqual(extractDigits("48 273"), "48273", "digits with space");
assertEqual(extractDigits("result: 48273"), "48273", "digits with text");
assertEqual(extractDigits("a"), null, "single letter");
assertEqual(extractDigits(""), null, "empty string");
assertEqual(extractDigits("1"), null, "single digit (< 2)");
assertEqual(extractDigits("12"), "12", "two digits is valid");

// ═══════════════════════════════════════════════
// parseDrawDate
// ═══════════════════════════════════════════════

console.log("\n📌 parseDrawDate");

const d1 = parseDrawDate("2025-03-01");
assert(d1 !== null, "ISO date parsed");
assertEqual(d1?.getFullYear(), 2025, "ISO year");
assertEqual(d1?.getMonth(), 2, "ISO month (0-indexed)");
assertEqual(d1?.getDate(), 1, "ISO day");

const d2 = parseDrawDate("01/03/2025");
assert(d2 !== null, "dd/MM/yyyy parsed");

const d3 = parseDrawDate("");
assertEqual(d3, null, "empty date returns null");

const d4 = parseDrawDate("invalid");
assertEqual(d4, null, "invalid date returns null");

// ═══════════════════════════════════════════════
// lastN
// ═══════════════════════════════════════════════

console.log("\n📌 lastN");

assertEqual(lastN("48273", 1), "3", "last 1 digit");
assertEqual(lastN("48273", 2), "73", "last 2 digits");
assertEqual(lastN("48273", 3), "273", "last 3 digits");
assertEqual(lastN("5", 2), "05", "padded short string");

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (failed > 0) process.exit(1);
