import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtRole } from "../utils/jwt";
import { prisma } from "../config/prisma";

// Verifies the JWT on the Authorization header and attaches the decoded
// payload to req.user. Also re-checks the user's account status on every
// request, so a deactivated account is locked out immediately rather than
// waiting for their token to expire.
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.substring("Bearer ".length);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, accountStatus: true, role: true, email: true },
    });

    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    if (user.accountStatus === "INACTIVE") {
      res.status(403).json({ error: "Account has been deactivated" });
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role as JwtRole };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to one or more roles. Usage: authorize("WEBSITE_OWNER")
export function authorize(...allowedRoles: JwtRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
}
