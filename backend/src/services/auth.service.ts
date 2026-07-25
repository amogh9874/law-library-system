import { prisma } from "../config/prisma";
import { verifyPassword, hashPassword } from "../utils/password";
import { signToken, JwtRole } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { LoginInput, ChangePasswordInput } from "../validators/auth.validator";

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { employee: true },
  });

  // Deliberately identical error for "no such user" and "wrong password" so
  // we don't leak which emails are registered.
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.accountStatus === "INACTIVE") {
    throw new AppError("This account has been deactivated. Contact the website owner.", 403);
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role as JwtRole,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
        ? {
            id: user.employee.id,
            name: user.employee.name,
            designation: user.employee.designation,
            department: user.employee.department,
          }
        : null,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    lastLoginAt: user.lastLoginAt,
    employee: user.employee
      ? {
          id: user.employee.id,
          employeeCode: user.employee.employeeCode,
          name: user.employee.name,
          designation: user.employee.designation,
          department: user.employee.department,
          officeLocation: user.employee.officeLocation,
          phoneNumber: user.employee.phoneNumber,
        }
      : null,
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const currentValid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const newHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}
