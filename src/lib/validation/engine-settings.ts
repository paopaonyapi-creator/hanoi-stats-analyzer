// ═══════════════════════════════════════════════
// Engine Settings Validation (Zod)
// ═══════════════════════════════════════════════

import { z } from "zod";

export const truthWeightsSchema = z.object({
  frequencyAllTime: z.number().min(0).max(5),
  frequencyRecent: z.number().min(0).max(5),
  recencyDecay: z.number().min(0).max(5),
  transition: z.number().min(0).max(5),
  gapReturn: z.number().min(0).max(5),
  digitBalance: z.number().min(0).max(5),
  weekdayAlignment: z.number().min(0).max(5),
  windowConsistency: z.number().min(0).max(5),
});

export const truthPenaltiesSchema = z.object({
  anomalyPenalty: z.number().min(0).max(10),
  overfitPenalty: z.number().min(0).max(10),
  insufficientDataPenalty: z.number().min(0).max(10),
  driftPenalty: z.number().min(0).max(10),
});

export const truthConfidenceWeightsSchema = z.object({
  sampleSizeQuality: z.number().min(0).max(5),
  featureAgreement: z.number().min(0).max(5),
  windowStability: z.number().min(0).max(5),
  outOfSampleConsistency: z.number().min(0).max(5),
  integrity: z.number().min(0).max(5),
});

export const truthEngineSettingsSchema = z.object({
  minIntegrityScore: z.number().min(0).max(100),
  minSampleForSignal: z.number().min(1).max(1000),
  minSampleForWindow: z.number().min(1).max(500),
  recentWindows: z.array(z.number().min(1).max(200)),
  baselineTopK: z.number().min(1).max(100),
  driftThreshold: z.number().min(0).max(1),
  confidenceLowThreshold: z.number().min(0).max(100),
  confidenceMediumThreshold: z.number().min(0).max(100),
  strongSignalThreshold: z.number().min(0).max(100),
  noReliableEdgeIfBaselineDeltaBelow: z.number().min(0).max(1),
  weights: truthWeightsSchema,
  penalties: truthPenaltiesSchema,
  confidenceWeights: truthConfidenceWeightsSchema,
});
