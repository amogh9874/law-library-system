import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtRole = "WEBSITE_OWNER" | "LIBRARY_ADMIN";

export interface JwtPayload {
  userId: string;
  email: string;
  role: JwtRole;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  // Throws if invalid/expired - callers are expected to catch this.
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
