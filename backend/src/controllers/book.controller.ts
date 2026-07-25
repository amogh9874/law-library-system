import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { createBookSchema, updateBookSchema, bookSearchQuerySchema, bulkDeleteBooksSchema } from "../validators/book.validator";
import { bookService } from "../services/book.service";
import { parsePagination, parseSort, buildPaginatedResponse } from "../utils/query";
import { logActivity } from "../services/activityLog.service";

const SORTABLE_FIELDS = ["title", "accessionNumber", "publicationYear", "createdAt"];

export const searchBooks = asyncHandler(async (req: Request, res: Response) => {
  const filters = bookSearchQuerySchema.parse(req.query);
  const pagination = parsePagination(req);
  const orderBy = parseSort(req, SORTABLE_FIELDS, "title");

  const { data, totalCount } = await bookService.search(
    filters,
    pagination.skip,
    pagination.take,
    orderBy
  );
  res.json(buildPaginatedResponse(data, totalCount, pagination));
});

export const listDeletedBooks = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req);
  const { data, totalCount } = await bookService.listDeleted(pagination.skip, pagination.take);
  res.json(buildPaginatedResponse(data, totalCount, pagination));
});

export const getBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.getById(req.params.id);
  res.json(book);
});

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const input = createBookSchema.parse(req.body);
  const book = await bookService.create(input, req.user!.userId);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_ADDED",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.status(201).json(book);
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const input = updateBookSchema.parse(req.body);
  const book = await bookService.update(req.params.id, input);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_EDITED",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.json(book);
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.softDelete(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_DELETED",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.json({ message: "Book deleted successfully" });
});

export const bulkDeleteBooks = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = bulkDeleteBooksSchema.parse(req.body);
  const result = await bookService.bulkSoftDelete(ids);

  await logActivity({
    userId: req.user!.userId,
    action: "BOOKS_BULK_DELETED",
    module: "Books",
    details: `${result.successCount} of ${ids.length} books deleted: ${result.succeeded.map((b) => b.title).join(", ")}`,
    req,
  });

  res.json(result);
});

export const restoreBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.restore(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_RESTORED",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.json(book);
});

export const markBookLost = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.markLost(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_MARKED_LOST",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.json(book);
});

export const markBookDamaged = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.markDamaged(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "BOOK_MARKED_DAMAGED",
    module: "Books",
    details: `${book.title} (${book.accessionNumber})`,
    req,
  });
  res.json(book);
});
