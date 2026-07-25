import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const bookInclude = { author: true, publisher: true, category: true } as const;

export type ReportType =
  | "available-books"
  | "issued-books"
  | "lost-books"
  | "damaged-books"
  | "borrow-history"
  | "books-added"
  | "books-removed";

export interface ReportDateRange {
  from?: Date;
  to?: Date;
}

export const reportService = {
  async generate(type: ReportType, range: ReportDateRange) {
    switch (type) {
      case "available-books":
        return prisma.book.findMany({
          where: { status: "AVAILABLE", isDeleted: false },
          include: bookInclude,
          orderBy: { title: "asc" },
        });

      case "issued-books":
        return prisma.book.findMany({
          where: { status: "ISSUED", isDeleted: false },
          include: { ...bookInclude, borrowRecords: { where: { status: "ISSUED" }, include: { employee: true } } },
          orderBy: { title: "asc" },
        });

      case "lost-books":
        return prisma.book.findMany({
          where: { status: "LOST" },
          include: bookInclude,
          orderBy: { title: "asc" },
        });

      case "damaged-books":
        return prisma.book.findMany({
          where: { status: "DAMAGED" },
          include: bookInclude,
          orderBy: { title: "asc" },
        });

      case "borrow-history":
        return prisma.borrowRecord.findMany({
          where: dateFilter("issueDate", range),
          include: { book: { include: bookInclude }, employee: true },
          orderBy: { issueDate: "desc" },
        });

      case "books-added":
        return prisma.book.findMany({
          where: { ...dateFilter("createdAt", range), isDeleted: false },
          include: bookInclude,
          orderBy: { createdAt: "desc" },
        });

      case "books-removed":
        return prisma.book.findMany({
          where: { ...dateFilter("deletedAt", range), isDeleted: true },
          include: bookInclude,
          orderBy: { deletedAt: "desc" },
        });

      default:
        throw new AppError("Unknown report type", 400);
    }
  },
};

function dateFilter(field: string, range: ReportDateRange) {
  if (!range.from && !range.to) return {};
  const condition: Record<string, Date> = {};
  if (range.from) condition.gte = range.from;
  if (range.to) condition.lte = range.to;
  return { [field]: condition };
}
