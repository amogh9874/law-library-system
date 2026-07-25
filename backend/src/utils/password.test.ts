import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isPasswordStrongEnough } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("produces a hash that verifies correctly against the original password", async () => {
    const hash = await hashPassword("CorrectHorse1");
    const isValid = await verifyPassword("CorrectHorse1", hash);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect password against the hash", async () => {
    const hash = await hashPassword("CorrectHorse1");
    const isValid = await verifyPassword("WrongPassword1", hash);
    expect(isValid).toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const hash1 = await hashPassword("SamePassword1");
    const hash2 = await hashPassword("SamePassword1");
    expect(hash1).not.toBe(hash2);
  });
});

describe("isPasswordStrongEnough", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(isPasswordStrongEnough("Ab1")).toBe(false);
  });

  it("rejects passwords with no number", () => {
    expect(isPasswordStrongEnough("NoNumbersHere")).toBe(false);
  });

  it("rejects passwords with no letter", () => {
    expect(isPasswordStrongEnough("12345678")).toBe(false);
  });

  it("accepts a password with letters, numbers, and 8+ length", () => {
    expect(isPasswordStrongEnough("Password123")).toBe(true);
  });
});
