import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { loginSchema, changePasswordSchema } from "../validators/auth.validator";
import { loginUser, getCurrentUser, changePassword } from "../services/auth.service";
import { logActivity } from "../services/activityLog.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  await logActivity({
    userId: result.user.id,
    action: "USER_LOGIN",
    module: "Auth",
    req,
  });

  res.json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.userId);
  res.json(user);
});

// Logout is stateless on the server (JWTs aren't stored server-side), this
// endpoint exists purely to record the activity log entry consistently.
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await logActivity({
    userId: req.user!.userId,
    action: "USER_LOGOUT",
    module: "Auth",
    req,
  });
  res.json({ message: "Logged out" });
});

export const changeOwnPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = changePasswordSchema.parse(req.body);
  await changePassword(req.user!.userId, input);

  await logActivity({
    userId: req.user!.userId,
    action: "PASSWORD_CHANGED",
    module: "Auth",
    req,
  });

  res.json({ message: "Password updated successfully" });
});
