import { z } from "zod";

export const bookTypeEnum = z.enum([
  "LAW_BOOK",
  "BARE_ACT",
  "CASE_LAW",
  "JOURNAL",
  "MANUAL",
  "COMMENTARY",
  "RESEARCH_PAPER",
  "REFERENCE_BOOK",
]);

export const bookConditionEnum = z.enum(["NEW", "GOOD", "WORN", "DAMAGED"]);
export const bookStatusEnum = z.enum(["AVAILABLE", "ISSUED", "LOST", "DAMAGED"]);

export const createBookSchema = z.object({
  accessionNumber: z.string().trim().min(1, "Accession number is required"),
  isbn: z.string().trim().optional(),
  barcodeNumber: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
  subtitle: z.string().trim().optional(),
  authorId: z.string().uuid("Invalid author ID"),
  publisherId: z.string().uuid("Invalid publisher ID"),
  publicationYear: z.coerce.number().int().min(1000).max(3000).optional(),
  edition: z.string().trim().optional(),
  volume: z.string().trim().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
  description: z.string().trim().optional(),
  keywords: z.string().trim().optional(),
  bookType: bookTypeEnum,
  numberOfPages: z.coerce.number().int().positive().optional(),
  coverImageUrl: z.string().trim().optional(),
  condition: bookConditionEnum.optional(),

  // Physical location - all required together when provided, since a book
  // should always have a full exact location once placed on a shelf.
  shelfId: z.string().uuid("Invalid shelf ID").optional(),
  row: z.string().trim().optional(),
  position: z.string().trim().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bulkDeleteBooksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one book must be selected").max(500, "Too many books selected at once"),
});

export const bookSearchQuerySchema = z.object({
  search: z.string().optional(),
  bookType: bookTypeEnum.optional(),
  status: bookStatusEnum.optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  publisherId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  shelfId: z.string().uuid().optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
