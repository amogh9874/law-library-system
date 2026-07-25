import { describe, it, expect } from "vitest";
import { Request } from "express";
import { parsePagination, buildPaginatedResponse, parseSort } from "./query";

function mockRequest(query: Record<string, string>): Request {
  return { query } as unknown as Request;
}

describe("parsePagination", () => {
  it("defaults to page 1, pageSize 25 when nothing is provided", () => {
    const result = parsePagination(mockRequest({}));
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(25);
  });

  it("computes skip correctly for later pages", () => {
    const result = parsePagination(mockRequest({ page: "3", pageSize: "10" }));
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.skip).toBe(20);
    expect(result.take).toBe(10);
  });

  it("clamps pageSize to the maximum of 100", () => {
    const result = parsePagination(mockRequest({ pageSize: "500" }));
    expect(result.pageSize).toBe(100);
  });

  it("treats page 0 or negative page as page 1", () => {
    expect(parsePagination(mockRequest({ page: "0" })).page).toBe(1);
    expect(parsePagination(mockRequest({ page: "-5" })).page).toBe(1);
  });

  it("falls back to defaults for non-numeric input", () => {
    const result = parsePagination(mockRequest({ page: "abc", pageSize: "xyz" }));
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });
});

describe("buildPaginatedResponse", () => {
  it("computes totalPages correctly", () => {
    const pagination = parsePagination(mockRequest({ page: "2", pageSize: "10" }));
    const response = buildPaginatedResponse(["a", "b"], 25, pagination);
    expect(response.pagination.totalPages).toBe(3);
    expect(response.pagination.totalCount).toBe(25);
    expect(response.data).toEqual(["a", "b"]);
  });

  it("returns 0 total pages for 0 total count", () => {
    const pagination = parsePagination(mockRequest({}));
    const response = buildPaginatedResponse([], 0, pagination);
    expect(response.pagination.totalPages).toBe(0);
  });
});

describe("parseSort", () => {
  it("uses the default field when sortBy is not in the allowed list", () => {
    const result = parseSort(mockRequest({ sortBy: "notAllowed" }), ["title", "createdAt"], "title");
    expect(result).toEqual({ title: "asc" });
  });

  it("respects an allowed sortBy field and desc order", () => {
    const result = parseSort(
      mockRequest({ sortBy: "createdAt", sortOrder: "desc" }),
      ["title", "createdAt"],
      "title"
    );
    expect(result).toEqual({ createdAt: "desc" });
  });

  it("defaults sortOrder to asc for any value other than desc", () => {
    const result = parseSort(mockRequest({ sortBy: "title", sortOrder: "banana" }), ["title"], "title");
    expect(result).toEqual({ title: "asc" });
  });
});
