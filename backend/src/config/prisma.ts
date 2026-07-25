import { PrismaClient } from "@prisma/client";

// A single shared PrismaClient instance. In development, tsx watch restarts
// the process on file changes, but we still guard against creating multiple
// clients on the same process via globalThis, which matters most once this
// is bundled or run under serverless-style reloads.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
