import { describe, it, expect } from "vitest";
import { flattenReportData, toCsv } from "./reportExport";

describe("flattenReportData", () => {
  it("flattens available-books data into the expected columns", () => {
    const input = [
      {
        accessionNumber: "ACC-00001",
        title: "Indian Constitutional Law",
        author: { name: "M.P. Jain" },
        category: { name: "Constitutional Law" },
        bookType: "LAW_BOOK",
        condition: "GOOD",
      },
    ];
    const result = flattenReportData("available-books", input);
    expect(result.headers).toEqual([
      "Accession No.",
      "Title",
      "Author",
      "Category",
      "Book Type",
      "Condition",
    ]);
    expect(result.rows[0]).toEqual([
      "ACC-00001",
      "Indian Constitutional Law",
      "M.P. Jain",
      "Constitutional Law",
      "LAW_BOOK",
      "GOOD",
    ]);
  });

  it("handles missing nested relations gracefully (no crash, empty string)", () => {
    const input = [{ accessionNumber: "ACC-00002", title: "Untitled", bookType: "JOURNAL", condition: "NEW" }];
    const result = flattenReportData("available-books", input);
    expect(result.rows[0][2]).toBe(""); // author name missing
  });

  it("returns empty headers/rows for an unknown report type", () => {
    const result = flattenReportData("not-a-real-type" as never, []);
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});

describe("toCsv", () => {
  it("joins headers and rows with commas and newlines", () => {
    const csv = toCsv({ headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]] });
    expect(csv).toBe("A,B\n1,2\n3,4");
  });

  it("quotes and escapes cells containing commas", () => {
    const csv = toCsv({ headers: ["Title"], rows: [["Smith, Jones & Co."]] });
    expect(csv).toBe('Title\n"Smith, Jones & Co."');
  });

  it("escapes embedded double quotes by doubling them", () => {
    const csv = toCsv({ headers: ["Note"], rows: [['He said "hello"']] });
    expect(csv).toBe('Note\n"He said ""hello"""');
  });

  it("quotes cells containing newlines", () => {
    const csv = toCsv({ headers: ["Note"], rows: [["line one\nline two"]] });
    expect(csv).toBe('Note\n"line one\nline two"');
  });
});
