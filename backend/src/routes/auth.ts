import { Router } from "express";
import {
  getMe,
  login,
  refresh,
  register,
  updateMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);
authRouter.put("/me", requireAuth, updateMe);
authRouter.post("/refresh", requireAuth, refresh);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
