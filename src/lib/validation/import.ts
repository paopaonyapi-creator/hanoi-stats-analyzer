import { z } from "zod";

// ═══════════════════════════════════════════════
// Import Validation
// ═══════════════════════════════════════════════

export const ImportRowSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Type is required"),
  time: z.string().optional().default(""),
  result: z.string().min(1, "Result is required"),
});

export const ImportRequestSchema = z.object({
  rows: z.array(ImportRowSchema).min(1, "At least one row is required"),
  fileName: z.string().min(1, "File name is required"),
});

export type ImportRowInput = z.infer<typeof ImportRowSchema>;
export type ImportRequestInput = z.infer<typeof ImportRequestSchema>;
