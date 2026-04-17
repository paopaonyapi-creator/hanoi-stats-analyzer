import { describe, expect, it } from "vitest";
import {
  extractDigits,
  lastN,
  normalizeDrawType,
  parseDrawDate,
} from "../src/lib/csv/normalize";

describe("normalizeDrawType", () => {
  it("normalizes known draw types", () => {
    expect(normalizeDrawType("SPECIAL")).toBe("SPECIAL");
    expect(normalizeDrawType("special")).toBe("SPECIAL");
    expect(normalizeDrawType("ฮานอยพิเศษ")).toBe("SPECIAL");
    expect(normalizeDrawType("พิเศษ")).toBe("SPECIAL");

    expect(normalizeDrawType("NORMAL")).toBe("NORMAL");
    expect(normalizeDrawType("normal")).toBe("NORMAL");
    expect(normalizeDrawType("ฮานอยปกติ")).toBe("NORMAL");
    expect(normalizeDrawType("hanoi")).toBe("NORMAL");

    expect(normalizeDrawType("VIP")).toBe("VIP");
    expect(normalizeDrawType("vip")).toBe("VIP");
    expect(normalizeDrawType("ฮานอยวีไอพี")).toBe("VIP");
  });

  it("returns null for unknown values", () => {
    expect(normalizeDrawType("")).toBeNull();
    expect(normalizeDrawType("unknown")).toBeNull();
  });
});

describe("extractDigits", () => {
  it("extracts digits from mixed input", () => {
    expect(extractDigits("48273")).toBe("48273");
    expect(extractDigits("4-8-2-7-3")).toBe("48273");
    expect(extractDigits("48 273")).toBe("48273");
    expect(extractDigits("result: 48273")).toBe("48273");
  });

  it("returns null when there are not enough digits", () => {
    expect(extractDigits("a")).toBeNull();
    expect(extractDigits("")).toBeNull();
    expect(extractDigits("1")).toBeNull();
  });

  it("accepts two digits and above", () => {
    expect(extractDigits("12")).toBe("12");
  });
});

describe("parseDrawDate", () => {
  it("parses ISO dates", () => {
    const date = parseDrawDate("2025-03-01");

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2025);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(1);
  });

  it("parses dd/MM/yyyy dates", () => {
    expect(parseDrawDate("01/03/2025")).not.toBeNull();
  });

  it("returns null for empty or invalid input", () => {
    expect(parseDrawDate("")).toBeNull();
    expect(parseDrawDate("invalid")).toBeNull();
  });
});

describe("lastN", () => {
  it("returns the requested suffix", () => {
    expect(lastN("48273", 1)).toBe("3");
    expect(lastN("48273", 2)).toBe("73");
    expect(lastN("48273", 3)).toBe("273");
  });

  it("pads short values", () => {
    expect(lastN("5", 2)).toBe("05");
  });
});
