import { Router } from "express";
import { z } from "zod";
import { UserRole } from "../types";

const authRouter = Router();

const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

const verifySchema = z.object({
  otp: z.string().length(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({
        message: "Invalid login payload",
        errors: parsed.error.flatten(),
      });
  }

  const role: UserRole = parsed.data.role ?? "client";
  return res.json({
    message: "Login accepted. OTP sent.",
    sessionId: `sess_${Date.now()}`,
    next: "/auth/verify",
    role,
  });
});

authRouter.post("/verify", (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({
        message: "Invalid verify payload",
        errors: parsed.error.flatten(),
      });
  }

  const role: UserRole = parsed.data.role ?? "client";
  return res.json({
    message: "Verification successful",
    token: `mock-token-${role}-${Date.now()}`,
    role,
  });
});

export default authRouter;
