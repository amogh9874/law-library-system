import { z } from "zod";

export const bookFormSchema = z.object({
  accessionNumber: z.string().min(1, "Accession number is required"),
  isbn: z.string().optional(),
  barcodeNumber: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  authorId: z.string().min(1, "Author is required"),
  publisherId: z.string().min(1, "Publisher is required"),
  publicationYear: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  edition: z.string().optional(),
  volume: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  subject: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  bookType: z.string().min(1, "Book type is required"),
  numberOfPages: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  condition: z.string().optional(),

  floorId: z.string().optional(),
  roomId: z.string().optional(),
  shelfId: z.string().optional(),
  row: z.string().optional(),
  position: z.string().optional(),
});

export type BookFormSchema = z.infer<typeof bookFormSchema>;
