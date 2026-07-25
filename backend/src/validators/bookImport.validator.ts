import { z } from "zod";

export const importBooksSchema = z.object({
  fileBase64: z.string().min(1, "No file was provided"),
});

export type ImportBooksInput = z.infer<typeof importBooksSchema>;
