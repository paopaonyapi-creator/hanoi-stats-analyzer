import { z } from "zod";

// ═══════════════════════════════════════════════
// Filter Validation
// ═══════════════════════════════════════════════

export const FilterSchema = z.object({
  drawType: z.enum(["SPECIAL", "NORMAL", "VIP", "ALL"]).optional().default("ALL"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  last2: z.string().optional(),
  last3: z.string().optional(),
  weekday: z.coerce.number().int().min(0).max(6).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(20),
  sortBy: z.string().optional().default("drawDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const SettingsSchema = z.object({
  key: z.string().min(1),
  valueJson: z.any(),
});

export const ScoreWeightsSchema = z.object({
  allTime: z.number().min(0).max(10),
  recent: z.number().min(0).max(10),
  gap: z.number().min(0).max(10),
  transition: z.number().min(0).max(10),
  digitBalance: z.number().min(0).max(10),
  repeat: z.number().min(0).max(10),
  weekday: z.number().min(0).max(10),
});

export type FilterInput = z.infer<typeof FilterSchema>;
