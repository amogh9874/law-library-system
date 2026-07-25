import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { IssueBookInput, RenewBookInput } from "../validators/borrow.validator";

const borrowInclude = {
  book: { include: { author: true, publisher: true, category: true } },
  employee: true,
} as const;

export const borrowService = {
  async list(
    filters: { employeeId?: string; status?: string; bookId?: string },
    skip: number,
    take: number
  ) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.bookId) where.bookId = filters.bookId;

    const [data, totalCount] = await Promise.all([
      prisma.borrowRecord.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: "desc" },
        include: borrowInclude,
      }),
      prisma.borrowRecord.count({ where }),
    ]);
    return { data, totalCount };
  },

  async issue(input: IssueBookInput, issuedById: string) {
    // Transaction guarantees the "book already issued" check and the
    // resulting status update happen atomically, so two concurrent issue
    // requests for the same book can't both succeed.
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const book = await tx.book.findFirst({ where: { id: input.bookId, isDeleted: false } });
      if (!book) {
        throw new AppError("Book not found", 404);
      }
      if (book.status !== "AVAILABLE") {
        throw new AppError(
          `This book cannot be issued because its current status is ${book.status}`,
          409
        );
      }

      const employee = await tx.employee.findUnique({ where: { id: input.employeeId } });
      if (!employee) {
        throw new AppError("Employee not found", 404);
      }
      if (employee.accountStatus === "INACTIVE") {
        throw new AppError("Cannot issue a book to an inactive employee", 409);
      }

      const record = await tx.borrowRecord.create({
        data: {
          bookId: input.bookId,
          employeeId: input.employeeId,
          dueDate: input.dueDate,
          remarks: input.remarks,
          issuedById,
          status: "ISSUED",
        },
        include: borrowInclude,
      });

      await tx.book.update({ where: { id: input.bookId }, data: { status: "ISSUED" } });

      return record;
    });
  },

  async return(borrowRecordId: string, returnedById: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const record = await tx.borrowRecord.findUnique({ where: { id: borrowRecordId } });
      if (!record) {
        throw new AppError("Borrow record not found", 404);
      }
      if (record.status === "RETURNED") {
        throw new AppError("This book has already been returned", 409);
      }

      const updated = await tx.borrowRecord.update({
        where: { id: borrowRecordId },
        data: { status: "RETURNED", returnDate: new Date(), returnedById },
        include: borrowInclude,
      });

      await tx.book.update({ where: { id: record.bookId }, data: { status: "AVAILABLE" } });

      return updated;
    });
  },

  async renew(borrowRecordId: string, input: RenewBookInput) {
    const record = await prisma.borrowRecord.findUnique({ where: { id: borrowRecordId } });
    if (!record) {
      throw new AppError("Borrow record not found", 404);
    }
    if (record.status !== "ISSUED" && record.status !== "OVERDUE") {
      throw new AppError("Only currently issued books can be renewed", 409);
    }
    if (input.newDueDate <= record.dueDate) {
      throw new AppError("New due date must be after the current due date", 400);
    }

    return prisma.borrowRecord.update({
      where: { id: borrowRecordId },
      data: { dueDate: input.newDueDate, status: "ISSUED" },
      include: borrowInclude,
    });
  },

  async markLost(borrowRecordId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const record = await tx.borrowRecord.findUnique({ where: { id: borrowRecordId } });
      if (!record) {
        throw new AppError("Borrow record not found", 404);
      }

      const updated = await tx.borrowRecord.update({
        where: { id: borrowRecordId },
        data: { status: "LOST" },
        include: borrowInclude,
      });

      await tx.book.update({ where: { id: record.bookId }, data: { status: "LOST" } });

      return updated;
    });
  },

  async getEmployeeHistory(employeeId: string, skip: number, take: number) {
    const where = { employeeId };
    const [data, totalCount] = await Promise.all([
      prisma.borrowRecord.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: "desc" },
        include: borrowInclude,
      }),
      prisma.borrowRecord.count({ where }),
    ]);
    return { data, totalCount };
  },
};
