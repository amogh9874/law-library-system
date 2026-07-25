import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/employee.validator";
import { employeeService } from "../services/employee.service";
import { parsePagination, buildPaginatedResponse } from "../utils/query";
import { logActivity } from "../services/activityLog.service";

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { data, totalCount } = await employeeService.list(search, pagination.skip, pagination.take);
  res.json(buildPaginatedResponse(data, totalCount, pagination));
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.getById(req.params.id);
  res.json(employee);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const input = createEmployeeSchema.parse(req.body);
  const { employee, temporaryPassword } = await employeeService.create(input);
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_ADDED",
    module: "Employees",
    details: `${employee.name} (${employee.employeeCode})`,
    req,
  });
  res.status(201).json({
    employee,
    temporaryPassword,
    note: temporaryPassword
      ? "Share this temporary password with the employee securely - it will not be shown again."
      : undefined,
  });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const input = updateEmployeeSchema.parse(req.body);
  const employee = await employeeService.update(req.params.id, input);
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_UPDATED",
    module: "Employees",
    details: `${employee.name} (${employee.employeeCode})`,
    req,
  });
  res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.remove(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_DELETED",
    module: "Employees",
    details: req.params.id,
    req,
  });
  res.json({ message: "Employee deleted successfully" });
});

export const activateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.setAccountStatus(req.params.id, "ACTIVE");
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_ACTIVATED",
    module: "Employees",
    details: employee.name,
    req,
  });
  res.json(employee);
});

export const deactivateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.setAccountStatus(req.params.id, "INACTIVE");
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_DEACTIVATED",
    module: "Employees",
    details: employee.name,
    req,
  });
  res.json(employee);
});

export const resetEmployeePassword = asyncHandler(async (req: Request, res: Response) => {
  const newPassword = await employeeService.resetPassword(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "EMPLOYEE_PASSWORD_RESET",
    module: "Employees",
    details: req.params.id,
    req,
  });
  res.json({
    newPassword,
    note: "Share this new password with the employee securely - it will not be shown again.",
  });
});

export const grantAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  const temporaryPassword = await employeeService.grantAdminAccess(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "LIBRARY_ADMIN_GRANTED",
    module: "Employees",
    details: req.params.id,
    req,
  });
  res.json({
    temporaryPassword,
    note: "Share this temporary password with the employee securely - it will not be shown again.",
  });
});

export const revokeAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.revokeAdminAccess(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "LIBRARY_ADMIN_REVOKED",
    module: "Employees",
    details: req.params.id,
    req,
  });
  res.json({ message: "Library Admin access revoked" });
});
