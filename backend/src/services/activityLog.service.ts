import { Request } from "express";
import { prisma } from "../config/prisma";

interface LogActivityParams {
  userId?: string | null;
  action: string;
  module: string;
  details?: string;
  req?: Request;
}

// Fire-and-forget style logger: failures here should never break the
// primary request, so errors are caught and swallowed (with a console
// warning) rather than propagated.
export async function logActivity({
  userId,
  action,
  module,
  details,
  req,
}: LogActivityParams): Promise<void> {
  try {
    const ipAddress = req
      ? (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || undefined
      : undefined;

    await prisma.activityLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        module,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.warn("Failed to write activity log:", err);
  }
}
