import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required"),
  name: z.string().trim().min(1, "Name is required"),
  designation: z.string().trim().min(1, "Designation is required"),
  department: z.string().trim().min(1, "Department is required"),
  officeLocation: z.string().trim().min(1, "Office location is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),

  // Optional: creates a login account (User) for this employee, making
  // them a Library Admin. If omitted, this is just a staff record that
  // can borrow books but cannot log in.
  createLoginAccount: z.boolean().optional(),
  temporaryPassword: z.string().min(8).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ createLoginAccount: true, temporaryPassword: true })
  .partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
