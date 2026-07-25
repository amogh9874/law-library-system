import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { issueBookSchema, renewBookSchema } from "../validators/borrow.validator";
import { borrowService } from "../services/borrow.service";
import { parsePagination, buildPaginatedResponse } from "../utils/query";
import { logActivity } from "../services/activityLog.service";

export const listBorrowRecords = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req);
  const filters = {
    employeeId: typeof req.query.employeeId === "string" ? req.query.employeeId : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    bookId: typeof req.query.bookId === "string" ? req.query.bookId : undefined,
  };
  const { data, totalCount } = await borrowService.list(filters, pagination.skip, pagination.take);
  res.json(buildPaginatedResponse(data, totalCount, pagination));
});

export const issueBook = asyncHandler(async (req: Request, res: Response) => {
  const input = issueBookSchema.parse(req.body);
  const record = await borrowService.issue(input, req.user!.userId);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_ISSUED",
    module: "Borrow Records",
    details: `${record.book.title} to ${record.employee.name}`,
    req,
  });
  res.status(201).json(record);
});

export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const record = await borrowService.return(req.params.id, req.user!.userId);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_RETURNED",
    module: "Borrow Records",
    details: `${record.book.title} from ${record.employee.name}`,
    req,
  });
  res.json(record);
});

export const renewBook = asyncHandler(async (req: Request, res: Response) => {
  const input = renewBookSchema.parse(req.body);
  const record = await borrowService.renew(req.params.id, input);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_RENEWED",
    module: "Borrow Records",
    details: `${record.book.title} for ${record.employee.name}`,
    req,
  });
  res.json(record);
});

export const markBorrowLost = asyncHandler(async (req: Request, res: Response) => {
  const record = await borrowService.markLost(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_MARKED_LOST",
    module: "Borrow Records",
    details: `${record.book.title} (${record.employee.name})`,
    req,
  });
  res.json(record);
});

export const getEmployeeBorrowHistory = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req);
  const { data, totalCount } = await borrowService.getEmployeeHistory(
    req.params.employeeId,
    pagination.skip,
    pagination.take
  );
  res.json(buildPaginatedResponse(data, totalCount, pagination));
});
