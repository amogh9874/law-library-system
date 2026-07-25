import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { parsePagination, buildPaginatedResponse } from "../utils/query";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req);

    const where: any = {};
    if (typeof req.query.module === "string") where.module = req.query.module;
    if (typeof req.query.action === "string") where.action = req.query.action;
    if (typeof req.query.userId === "string") where.userId = req.query.userId;

    const [data, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json(buildPaginatedResponse(data, totalCount, pagination));
  })
);

export default router;
