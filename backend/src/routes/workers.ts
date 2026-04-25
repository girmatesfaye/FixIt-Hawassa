import { Router } from "express";
import {
  createWorkerReport,
  createWorkerReview,
  getMyWorkerProfile,
  getWorkerById,
  updateMyWorkerProfile,
} from "../controllers/workersController";
import { requireAuth, requireRole } from "../middleware/auth";

const workersRouter = Router();

workersRouter.get("/me", requireAuth, getMyWorkerProfile);
workersRouter.put("/me", requireAuth, updateMyWorkerProfile);
workersRouter.get("/:id", getWorkerById);
workersRouter.post("/:id/review", requireRole("client"), createWorkerReview);
workersRouter.post("/:id/report", requireRole("client"), createWorkerReport);

export default workersRouter;
