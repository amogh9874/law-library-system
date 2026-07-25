import { z } from "zod";

export const nameOnlySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export type NameOnlyInput = z.infer<typeof nameOnlySchema>;
