import { describe, it, expect, beforeAll } from "vitest";

// Must be set before importing the module under test, since env.ts reads
// process.env at import time.
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests-only";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

describe("signToken / verifyToken", () => {
  it("round-trips a payload correctly", async () => {
    const { signToken, verifyToken } = await import("./jwt");
    const payload = { userId: "abc-123", email: "test@example.com", role: "LIBRARY_ADMIN" as const };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("throws when verifying a garbage token", async () => {
    const { verifyToken } = await import("./jwt");
    expect(() => verifyToken("not-a-real-token")).toThrow();
  });

  it("throws when verifying a token signed with a different secret", async () => {
    const jwt = await import("jsonwebtoken");
    const { verifyToken } = await import("./jwt");
    const foreignToken = jwt.sign({ userId: "x", email: "x@x.com", role: "LIBRARY_ADMIN" }, "wrong-secret");
    expect(() => verifyToken(foreignToken)).toThrow();
  });
});
