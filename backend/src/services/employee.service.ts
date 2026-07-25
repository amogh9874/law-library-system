import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { hashPassword } from "../utils/password";
import { CreateEmployeeInput, UpdateEmployeeInput } from "../validators/employee.validator";

export const employeeService = {
  async list(search: string | undefined, skip: number, take: number) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { employeeCode: { contains: search, mode: "insensitive" as const } },
            { department: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: { user: { select: { id: true, role: true, accountStatus: true, email: true } } },
      }),
      prisma.employee.count({ where }),
    ]);
    return { data, totalCount };
  },

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, role: true, accountStatus: true, email: true } } },
    });
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    return employee;
  },

  async create(input: CreateEmployeeInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: input.employeeCode,
          name: input.name,
          designation: input.designation,
          department: input.department,
          officeLocation: input.officeLocation,
          email: input.email,
          phoneNumber: input.phoneNumber,
        },
      });

      let temporaryPassword: string | undefined;

      if (input.createLoginAccount) {
        temporaryPassword = input.temporaryPassword || crypto.randomBytes(9).toString("base64url");
        const passwordHash = await hashPassword(temporaryPassword);

        await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            role: "LIBRARY_ADMIN",
            employeeId: employee.id,
          },
        });
      }

      return { employee, temporaryPassword };
    });
  },

  async update(id: string, input: UpdateEmployeeInput) {
    await this.getById(id);
    const employee = await prisma.employee.update({ where: { id }, data: input });

    // Keep the linked login account's email in sync if it changed.
    if (input.email) {
      await prisma.user.updateMany({ where: { employeeId: id }, data: { email: input.email } });
    }

    return employee;
  },

  async remove(id: string) {
    await this.getById(id);
    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: { employeeId: id, status: { in: ["ISSUED", "OVERDUE"] } },
    });
    if (activeBorrow) {
      throw new AppError("Cannot delete an employee with books currently checked out", 409);
    }
    // Deleting the employee cascades logically: remove linked user first
    // (no onDelete cascade defined in schema, so this is explicit).
    await prisma.user.deleteMany({ where: { employeeId: id } });
    await prisma.employee.delete({ where: { id } });
  },

  async setAccountStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    await this.getById(id);
    const employee = await prisma.employee.update({
      where: { id },
      data: { accountStatus: status },
    });
    // Deactivating the employee also deactivates their login, if any.
    await prisma.user.updateMany({ where: { employeeId: id }, data: { accountStatus: status } });
    return employee;
  },

  async resetPassword(id: string) {
    const employee = await this.getById(id);
    if (!employee.user) {
      throw new AppError("This employee does not have a login account", 400);
    }
    const newPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: employee.user.id }, data: { passwordHash } });
    return newPassword;
  },

  async grantAdminAccess(id: string) {
    const employee = await this.getById(id);
    if (employee.user) {
      if (employee.user.role === "LIBRARY_ADMIN") {
        throw new AppError("This employee is already a Library Admin", 400);
      }
      throw new AppError("This employee already has a login account", 400);
    }
    const temporaryPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await hashPassword(temporaryPassword);
    await prisma.user.create({
      data: {
        email: employee.email,
        passwordHash,
        role: "LIBRARY_ADMIN",
        employeeId: employee.id,
      },
    });
    return temporaryPassword;
  },

  async revokeAdminAccess(id: string) {
    const employee = await this.getById(id);
    if (!employee.user) {
      throw new AppError("This employee does not have a login account", 400);
    }
    await prisma.user.delete({ where: { id: employee.user.id } });
  },
};
