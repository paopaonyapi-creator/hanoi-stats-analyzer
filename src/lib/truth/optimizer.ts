import type { DrawResultRecord } from "@/types";
import type { TruthWeights } from "./types";
import { runWalkForwardBacktest } from "./backtest";
import { DEFAULT_TRUTH_ENGINE_SETTINGS } from "./constants";

interface Genome {
  weights: TruthWeights;
  edgeDelta: number;
}

/**
 * Evolutionary weight optimizer to find the champion weights for a given market.
 */
export function findChampionWeights(
  records: DrawResultRecord[],
  options: { 
    iterations?: number; 
    populationSize?: number; 
  } = {}
): Genome {
  const iterations = options.iterations || 10;
  const populationSize = options.populationSize || 5;

  let population: Genome[] = Array.from({ length: populationSize }, () => ({
    weights: mutateWeights(DEFAULT_TRUTH_ENGINE_SETTINGS.weights, 0.3),
    edgeDelta: -1
  }));

  for (let i = 0; i < iterations; i++) {
    // 1. Evaluate
    population = population.map(genome => {
      const summary = runWalkForwardBacktest(records, {
        settings: { ...DEFAULT_TRUTH_ENGINE_SETTINGS, weights: genome.weights },
        testSize: 1,
        stepSize: 5, // Faster evaluation
        trainMinSize: 50
      });
      return { ...genome, edgeDelta: summary.averageDelta };
    });

    // 2. Sort & Select
    population.sort((a, b) => b.edgeDelta - a.edgeDelta);
    const parents = population.slice(0, 2);

    // 3. Crossover & Mutate
    const nextGen: Genome[] = [parents[0]]; // Keep best
    while (nextGen.length < populationSize) {
      const childWeights = crossover(parents[0].weights, parents[1].weights);
      nextGen.push({
        weights: mutateWeights(childWeights, 0.1),
        edgeDelta: -1
      });
    }
    population = nextGen;
  }

  return population[0];
}

function mutateWeights(w: TruthWeights, rate: number): TruthWeights {
  const mutated = { ...w };
  (Object.keys(mutated) as (keyof TruthWeights)[]).forEach(k => {
    if (Math.random() < rate) {
      const factor = 0.5 + Math.random(); // 0.5 to 1.5
      mutated[k] = parseFloat((mutated[k] * factor).toFixed(2));
    }
  });
  return mutated;
}

function crossover(p1: TruthWeights, p2: TruthWeights): TruthWeights {
  const child = { ...p1 };
  (Object.keys(child) as (keyof TruthWeights)[]).forEach(k => {
    if (Math.random() < 0.5) {
      child[k] = p2[k];
    }
  });
  return child;
}
