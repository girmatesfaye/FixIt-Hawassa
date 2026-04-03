import { Router } from "express";
import { getDatabaseStatus } from "../config/db";
import { mockUsers } from "../data/mockData";
import { requireRoleToken } from "../middleware/auth";
import { User, Report, Category, ServiceRequest, WorkerProfile } from "../models";

const adminRouter = Router();

adminRouter.use(requireRoleToken("admin"));

adminRouter.get("/users", async (_req, res) => {
  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    return res.json({
      total: mockUsers.length,
      users: mockUsers,
      source: "mock",
    });
  }

  try {
    const users = await User.find()
      .select("fullName role status phone")
      .sort({ createdAt: -1 })
      .lean();

    const normalizedUsers = users.map((user) => ({
      id: String(user._id),
      name: user.fullName,
      role: user.role,
      status: user.status,
      phone: user.phone,
    }));

    return res.json({
      total: normalizedUsers.length,
      users: normalizedUsers,
      source: "mongodb",
    });
  } catch (error) {
    console.error(
      "[admin] Failed to fetch users from MongoDB, using mock data",
      error,
    );
    return res.json({
      total: mockUsers.length,
      users: mockUsers,
      source: "mock",
    });
  }
});

adminRouter.get("/reports", async (_req, res) => {
  try {
    const reports = await Report.find()
      .populate("reportedUserId", "fullName")
      .populate("reporterUserId", "fullName")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ reports });
  } catch (error) {
    console.error("[admin] Failed to fetch reports", error);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
});

adminRouter.put("/reports/:id/resolve", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || "resolved" },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({ report });
  } catch (error) {
    console.error("[admin] Failed to update report", error);
    return res.status(500).json({ error: "Failed to update report" });
  }
});

adminRouter.get("/categories", async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    return res.json({ categories });
  } catch (error) {
    console.error("[admin] Failed to fetch categories", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

adminRouter.post("/categories", async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const category = new Category({ name, description, icon });
    await category.save();
    return res.status(201).json({ category });
  } catch (error) {
    console.error("[admin] Failed to create category", error);
    return res.status(500).json({ error: "Failed to create category" });
  }
});

adminRouter.get("/stats", async (_req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRequests = await ServiceRequest.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });
    const totalWorkers = await WorkerProfile.countDocuments();

    return res.json({
      totalUsers,
      totalRequests,
      pendingReports,
      totalWorkers,
    });
  } catch (error) {
    console.error("[admin] Failed to fetch stats", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default adminRouter;
