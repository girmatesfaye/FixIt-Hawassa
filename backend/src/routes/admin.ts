import { Router } from "express";
import {
  createCategory,
  getCategories,
  getReports,
  getStats,
  getUsers,
  resolveReport,
} from "../controllers/adminController";
import { requireRoleToken } from "../middleware/auth";

const adminRouter = Router();

adminRouter.use(requireRoleToken("admin"));

adminRouter.get("/users", getUsers);
adminRouter.get("/reports", getReports);
adminRouter.put("/reports/:id/resolve", resolveReport);
adminRouter.get("/categories", getCategories);
adminRouter.post("/categories", createCategory);
adminRouter.get("/stats", getStats);

export default adminRouter;
