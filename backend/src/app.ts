import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import { authorsRouter, publishersRouter, categoriesRouter } from "./routes/catalog.routes";
import { floorsRouter, roomsRouter, shelvesRouter } from "./routes/structure.routes";
import bookRoutes from "./routes/book.routes";
import borrowRoutes from "./routes/borrow.routes";
import employeeRoutes from "./routes/employee.routes";
import activityLogRoutes from "./routes/activityLog.routes";
import reportRoutes from "./routes/report.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });
  app.use("/api", limiter);

  // Tighter limit specifically on login to slow down brute-force attempts.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  });
  app.use("/api/auth/login", loginLimiter);

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(env.uploadDir));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/authors", authorsRouter);
  app.use("/api/publishers", publishersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/floors", floorsRouter);
  app.use("/api/rooms", roomsRouter);
  app.use("/api/shelves", shelvesRouter);
  app.use("/api/books", bookRoutes);
  app.use("/api/borrow-records", borrowRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/activity-logs", activityLogRoutes);
  app.use("/api/reports", reportRoutes);

  // 404 handler for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  });

  app.use(errorHandler);

  return app;
}
