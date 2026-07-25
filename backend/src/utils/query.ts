import { Request } from "express";

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const rawPageSize = parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.min(Math.max(rawPageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  pagination: PaginationParams
) {
  return {
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize),
    },
  };
}

export function parseSort(
  req: Request,
  allowedFields: string[],
  defaultField: string
): Record<string, "asc" | "desc"> {
  const sortBy = String(req.query.sortBy ?? defaultField);
  const sortOrder = String(req.query.sortOrder ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder };
}
