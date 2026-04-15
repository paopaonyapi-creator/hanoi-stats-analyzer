import type { TransitionEntry } from "@/types";

// ═══════════════════════════════════════════════
// Transition Analysis
// ═══════════════════════════════════════════════
// Tracks which numbers tend to follow which other numbers

export function computeTransitions(values: string[]): TransitionEntry[] {
  const map = new Map<string, number>();

  for (let i = 0; i < values.length - 1; i++) {
    const key = `${values[i]}->${values[i + 1]}`;
    map.set(key, (map.get(key) || 0) + 1);
  }

  const entries: TransitionEntry[] = [];
  map.forEach((count, key) => {
    const [from, to] = key.split("->");
    entries.push({ from, to, count });
  });

  return entries.sort((a, b) => b.count - a.count);
}

/**
 * Get transition factor for a specific number
 * Based on how often the last drawn number transitions to this number
 */
export function getTransitionFactor(
  targetValue: string,
  lastValue: string,
  values: string[]
): number {
  if (!lastValue || values.length < 2) return 0;

  let transitionCount = 0;
  let lastValueCount = 0;

  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] === lastValue) {
      lastValueCount++;
      if (values[i + 1] === targetValue) {
        transitionCount++;
      }
    }
  }

  if (lastValueCount === 0) return 0;
  return transitionCount / lastValueCount;
}
