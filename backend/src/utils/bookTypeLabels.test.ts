import { describe, it, expect } from "vitest";
import { normalizeBookType, normalizeCondition } from "./bookTypeLabels";

describe("normalizeBookType", () => {
  it("accepts the canonical enum code", () => {
    expect(normalizeBookType("LAW_BOOK")).toBe("LAW_BOOK");
  });

  it("accepts a human-readable label", () => {
    expect(normalizeBookType("Law Book")).toBe("LAW_BOOK");
  });

  it("is case-insensitive and ignores extra spaces", () => {
    expect(normalizeBookType("  law book  ")).toBe("LAW_BOOK");
    expect(normalizeBookType("BARE ACT")).toBe("BARE_ACT");
  });

  it("matches a label with no spaces at all", () => {
    expect(normalizeBookType("CaseLaw")).toBe("CASE_LAW");
  });

  it("returns null for an unrecognized value", () => {
    expect(normalizeBookType("Comic Book")).toBeNull();
  });
});

describe("normalizeCondition", () => {
  it("accepts each valid condition case-insensitively", () => {
    expect(normalizeCondition("new")).toBe("NEW");
    expect(normalizeCondition("Good")).toBe("GOOD");
    expect(normalizeCondition("WORN")).toBe("WORN");
    expect(normalizeCondition("Damaged")).toBe("DAMAGED");
  });

  it("returns null for an unrecognized value", () => {
    expect(normalizeCondition("Excellent")).toBeNull();
  });
});
