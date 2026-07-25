import { z } from "zod";

export const issueBookSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  employeeId: z.string().uuid("Invalid employee ID"),
  dueDate: z.coerce.date({ errorMap: () => ({ message: "A valid due date is required" }) }),
  remarks: z.string().trim().optional(),
});

export const renewBookSchema = z.object({
  newDueDate: z.coerce.date({ errorMap: () => ({ message: "A valid new due date is required" }) }),
});

export type IssueBookInput = z.infer<typeof issueBookSchema>;
export type RenewBookInput = z.infer<typeof renewBookSchema>;
