// ═══════════════════════════════════════════════
// Truth Engine — Snapshot & Audit Engines
// ═══════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { IntegrityReport, TruthScoreResult, BacktestSummary, RealityVerdictResult } from "./types";

// ─────────────────────────────────────────────
// Snapshots
// ─────────────────────────────────────────────

export async function saveAnalysisSnapshot(
  prisma: PrismaClient,
  payload: {
    datasetSize: number;
    integrityScore: number;
    integrityLevel: "HIGH" | "MEDIUM" | "LOW" | "BROKEN";
    summaryJson: Record<string, unknown>;
    notesJson?: Record<string, unknown>;
  }
) {
  return prisma.analysisSnapshot.create({ 
    data: {
      ...payload,
      summaryJson: payload.summaryJson as any,
      notesJson: payload.notesJson as any,
    } 
  });
}

export async function saveTrendScoreSnapshot(
  prisma: PrismaClient,
  payload: {
    drawType?: "SPECIAL" | "NORMAL" | "VIP" | null;
    windowType: string;
    trendScoreJson: unknown;
    confidenceJson: unknown;
    evidenceJson: unknown;
    verdictJson?: unknown;
  }
) {
  return prisma.trendScoreSnapshot.create({
    data: {
      drawType: payload.drawType ?? undefined,
      windowType: payload.windowType,
      trendScoreJson: payload.trendScoreJson as any,
      confidenceJson: payload.confidenceJson as any,
      evidenceJson: payload.evidenceJson as any,
      verdictJson: payload.verdictJson as any,
    },
  });
}

export async function saveBacktestRun(
  prisma: PrismaClient,
  payload: {
    drawType?: "SPECIAL" | "NORMAL" | "VIP" | null;
    windowType: string;
    configJson: unknown;
    resultJson: unknown;
    baselineDelta?: number;
    calibrationJson?: unknown;
    driftJson?: unknown;
    verdict: "STRONG" | "MODERATE" | "WEAK" | "NO_RELIABLE_EDGE";
  }
) {
  return prisma.backtestRun.create({
    data: {
      drawType: payload.drawType ?? undefined,
      windowType: payload.windowType,
      configJson: payload.configJson as any,
      resultJson: payload.resultJson as any,
      baselineDelta: payload.baselineDelta,
      calibrationJson: payload.calibrationJson as any,
      driftJson: payload.driftJson as any,
      verdict: payload.verdict,
    },
  });
}

// ─────────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────────

export async function logEngineEvent(
  prisma: PrismaClient,
  eventType: string,
  severity: "info" | "warning" | "error",
  detailJson: Record<string, unknown>
) {
  return prisma.engineAuditLog.create({
    data: {
      eventType,
      severity,
      detailJson: detailJson as any,
    },
  });
}

export async function getRecentAuditLogs(
  prisma: PrismaClient,
  limit: number = 50
) {
  return prisma.engineAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestSnapshot(prisma: PrismaClient) {
  return prisma.analysisSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestBacktestRun(
  prisma: PrismaClient,
  drawType?: "SPECIAL" | "NORMAL" | "VIP" | null
) {
  return prisma.backtestRun.findFirst({
    where: drawType ? { drawType } : {},
    orderBy: { createdAt: "desc" },
  });
}
