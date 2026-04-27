import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getReports,
  getStats,
  getUserById,
  getUsers,
  resolveReport,
  updateCategory,
  updateCategoryStatus,
  updateUser,
  updateUserStatus,
} from "../controllers/adminController";
import { requireRoleToken } from "../middleware/auth";

const adminRouter = Router();

adminRouter.use(requireRoleToken("admin"));

adminRouter.get("/users", getUsers);
adminRouter.get("/users/:id", getUserById);
adminRouter.put("/users/:id", updateUser);
adminRouter.patch("/users/:id/status", updateUserStatus);
adminRouter.get("/reports", getReports);
adminRouter.put("/reports/:id/resolve", resolveReport);
adminRouter.get("/categories", getCategories);
adminRouter.post("/categories", createCategory);
adminRouter.put("/categories/:id", updateCategory);
adminRouter.patch("/categories/:id/status", updateCategoryStatus);
adminRouter.delete("/categories/:id", deleteCategory);
adminRouter.get("/stats", getStats);

export default adminRouter;
