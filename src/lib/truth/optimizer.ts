// ═══════════════════════════════════════════════
// Truth Engine — Genetic Weight Optimizer
// ═══════════════════════════════════════════════

import type { DrawResultRecord } from "@/types";
import type { TruthWeights } from "./types";
import { runWalkForwardBacktest } from "./backtest";
import { DEFAULT_TRUTH_WEIGHTS } from "./constants";

interface Genome {
  weights: TruthWeights;
  edgeDelta: number;
}

/**
 * findChampionWeights
 * Uses a genetic approach to find the weights that maximize the edge over baseline.
 */
export function findChampionWeights(
  records: DrawResultRecord[],
  options: {
    iterations?: number;
    mutationRate?: number;
    populationSize?: number;
  } = {}
): Genome {
  const {
    iterations = 20,
    mutationRate = 0.2,
    populationSize = 10
  } = options;

  let population: Genome[] = [];

  // 1. Initialize Population
  for (let i = 0; i < populationSize; i++) {
    const weights = i === 0 ? DEFAULT_TRUTH_WEIGHTS : mutateWeights(DEFAULT_TRUTH_WEIGHTS, 0.5);
    population.push({ weights, edgeDelta: -1 });
  }

  // 2. Evolution Loop
  let champion: Genome = population[0];

  for (let gen = 0; gen < iterations; gen++) {
    // Evaluate fitness
    for (let i = 0; i < population.length; i++) {
      if (population[i].edgeDelta === -1) {
        const summary = runWalkForwardBacktest(records, {
          settings: { weights: population[i].weights }
        });
        population[i].edgeDelta = summary.averageDelta;
      }
    }

    // Sort by fitness
    population.sort((a, b) => b.edgeDelta - a.edgeDelta);
    
    // Track champion
    if (population[0].edgeDelta > champion.edgeDelta) {
      champion = { ...population[0] };
    }

    // Culling & Reproduction (Top 50% survive)
    const survivors = population.slice(0, Math.floor(populationSize / 2));
    const nextGen: Genome[] = [...survivors];

    while (nextGen.length < populationSize) {
      const parent = survivors[Math.floor(Math.random() * survivors.length)];
      nextGen.push({
        weights: mutateWeights(parent.weights, mutationRate),
        edgeDelta: -1
      });
    }

    population = nextGen;
  }

  return champion;
}

/**
 * mutateWeights
 * Randomly nudges weights to explore the search space.
 */
function mutateWeights(base: TruthWeights, rate: number): TruthWeights {
  const mutated = { ...base };
  const keys = Object.keys(mutated) as (keyof TruthWeights)[];

  for (const key of keys) {
    if (Math.random() < rate) {
      // Nudge by +/- 0.5 to 1.5
      const nudge = (Math.random() * 2 - 1) * 1.5;
      mutated[key] = Math.max(0, Math.min(10, mutated[key] + nudge));
    }
  }

  return mutated;
}
