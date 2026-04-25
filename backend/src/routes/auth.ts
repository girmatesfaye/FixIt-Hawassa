import { Router } from "express";
import {
  getMe,
  login,
  refresh,
  register,
  verify,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);
authRouter.post("/refresh", requireAuth, refresh);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify", verify);

export default authRouter;
