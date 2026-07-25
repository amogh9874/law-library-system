import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { reportService, ReportType } from "../services/report.service";
import { flattenReportData, toCsv, toExcelBuffer, toPdfBuffer } from "../utils/reportExport";
import { logActivity } from "../services/activityLog.service";

const VALID_TYPES: ReportType[] = [
  "available-books",
  "issued-books",
  "lost-books",
  "damaged-books",
  "borrow-history",
  "books-added",
  "books-removed",
];

const router = Router();
router.use(authenticate);

router.get(
  "/:type",
  asyncHandler(async (req: Request, res: Response) => {
    const type = req.params.type as ReportType;
    if (!VALID_TYPES.includes(type)) {
      throw new AppError(`Unknown report type. Valid types: ${VALID_TYPES.join(", ")}`, 400);
    }

    const range = {
      from: req.query.from ? new Date(String(req.query.from)) : undefined,
      to: req.query.to ? new Date(String(req.query.to)) : undefined,
    };

    const data = await reportService.generate(type, range);
    const format = String(req.query.format ?? "json").toLowerCase();
    const flat = flattenReportData(type, data);

    await logActivity({
      userId: req.user!.userId,
      action: "REPORT_GENERATED",
      module: "Reports",
      details: `${type} (${format})`,
      req,
    });

    if (format === "json") {
      res.json({ type, count: data.length, data });
      return;
    }

    const filenameBase = `${type}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
      res.send(toCsv(flat));
      return;
    }

    if (format === "excel" || format === "xlsx") {
      const buffer = await toExcelBuffer(flat, type);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.xlsx"`);
      res.send(buffer);
      return;
    }

    if (format === "pdf") {
      const buffer = await toPdfBuffer(flat, type.replace(/-/g, " ").toUpperCase());
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.pdf"`);
      res.send(buffer);
      return;
    }

    throw new AppError("Invalid format. Use json, csv, excel, or pdf", 400);
  })
);

export default router;
