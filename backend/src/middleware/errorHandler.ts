import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Structural type for Prisma's known-request errors, matched by shape
// rather than imported from Prisma.* — this keeps the error handler
// working even in environments where full client generation is restricted,
// and Prisma's actual error class satisfies this shape at runtime either way.
interface PrismaKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

function isPrismaKnownRequestError(err: unknown): err is PrismaKnownRequestError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    (err as { code: string }).code.startsWith("P")
  );
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
    return;
  }

  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: `A record with this ${(err.meta?.target as string[])?.join(", ") || "value"} already exists`,
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

// Wraps async route handlers so thrown errors reach errorHandler instead of
// crashing the process or hanging the request.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
