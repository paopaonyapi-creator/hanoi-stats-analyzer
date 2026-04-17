import { PrismaClient } from "@prisma/client";

// Validate that DATABASE_URL is present at startup
// This gives a clear error instead of a cryptic Prisma crash
if (!process.env.DATABASE_URL) {
  const msg =
    "❌ DATABASE_URL environment variable is not set. " +
    "Please configure it in Railway: Service → Variables → DATABASE_URL";
  if (process.env.NODE_ENV === "production") {
    // In production, log prominently and exit so Railway restarts with visible error
    console.error(msg);
    // Don't process.exit here — let the request fail gracefully with 500
  } else {
    console.warn(msg);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
