import { describe, it, expect } from "vitest";
import { loginSchema, changePasswordSchema } from "../validators/auth.validator";
import { createBookSchema } from "../validators/book.validator";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@lawfirm.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@lawfirm.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("rejects a new password under 8 characters", () => {
    const result = changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects a new password with no digit", () => {
    const result = changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "NoDigitsHere" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid new password", () => {
    const result = changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "GoodPass123" });
    expect(result.success).toBe(true);
  });
});

describe("createBookSchema", () => {
  const validBook = {
    accessionNumber: "ACC-00099",
    title: "Test Book",
    authorId: "11111111-1111-1111-1111-111111111111",
    publisherId: "22222222-2222-2222-2222-222222222222",
    categoryId: "33333333-3333-3333-3333-333333333333",
    bookType: "LAW_BOOK" as const,
  };

  it("accepts a minimal valid book", () => {
    const result = createBookSchema.safeParse(validBook);
    expect(result.success).toBe(true);
  });

  it("rejects a book missing a title", () => {
    const result = createBookSchema.safeParse({ ...validBook, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid bookType", () => {
    const result = createBookSchema.safeParse({ ...validBook, bookType: "NOT_A_REAL_TYPE" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID authorId", () => {
    const result = createBookSchema.safeParse({ ...validBook, authorId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("coerces publicationYear from a string to a number", () => {
    const result = createBookSchema.safeParse({ ...validBook, publicationYear: "2020" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publicationYear).toBe(2020);
    }
  });
});
