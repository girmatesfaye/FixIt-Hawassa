import { Router } from "express";
import { getDatabaseStatus } from "../config/db";
import { mockUsers } from "../data/mockData";
import { requireRoleToken } from "../middleware/auth";
import { User } from "../models";

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

export default adminRouter;
