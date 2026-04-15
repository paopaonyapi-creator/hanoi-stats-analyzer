import type { GapEntry } from "@/types";

// ═══════════════════════════════════════════════
// Gap Analysis
// ═══════════════════════════════════════════════
// Gap = how many draws since a number last appeared

export function computeGapAnalysis(
  values: string[],
  allPossible: string[]
): GapEntry[] {
  const results: GapEntry[] = [];

  for (const target of allPossible) {
    const appearances: number[] = [];
    values.forEach((v, i) => {
      if (v === target) appearances.push(i);
    });

    if (appearances.length === 0) {
      results.push({
        value: target,
        currentGap: values.length,
        maxGap: values.length,
        avgGap: values.length,
        lastSeen: null,
      });
      continue;
    }

    // Compute gaps between consecutive appearances
    const gaps: number[] = [];
    for (let i = 1; i < appearances.length; i++) {
      gaps.push(appearances[i] - appearances[i - 1]);
    }

    const currentGap = values.length - 1 - appearances[appearances.length - 1];
    const maxGap = gaps.length > 0 ? Math.max(...gaps, currentGap) : currentGap;
    const avgGap =
      gaps.length > 0
        ? Math.round(
            ([...gaps, currentGap].reduce((a, b) => a + b, 0) /
              (gaps.length + 1)) *
              100
          ) / 100
        : currentGap;

    results.push({
      value: target,
      currentGap,
      maxGap,
      avgGap,
      lastSeen: `Draw #${appearances[appearances.length - 1] + 1}`,
    });
  }

  // Sort by currentGap descending (numbers that haven't appeared for longest)
  return results.sort((a, b) => b.currentGap - a.currentGap);
}

/**
 * Get gap factor for a specific number
 * Higher gap = higher factor (it's "overdue")
 */
export function getGapFactor(
  value: string,
  values: string[],
  allPossible: string[]
): number {
  const entry = computeGapAnalysis(values, allPossible).find(
    (e) => e.value === value
  );
  if (!entry) return 0;

  // Normalize: gap / average expected gap
  const expectedGap = allPossible.length; // e.g., 100 for last2
  return Math.min(entry.currentGap / expectedGap, 3); // cap at 3x
}
