import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Law Library backend listening on port ${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown: close the HTTP server and Prisma's connection pool
// cleanly instead of dropping connections abruptly.
async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
