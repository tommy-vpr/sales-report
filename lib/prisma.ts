// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` in TS
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // Optional, but nice while developing
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// In development, store the client on `globalThis` so we don't
// create a new connection on every HMR reload.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
