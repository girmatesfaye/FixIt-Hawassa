import { Router } from "express";
import { randomBytes, scryptSync } from "crypto";
import { z } from "zod";
import { getDatabaseStatus } from "../config/db";
import { mockUsers } from "../data/mockData";
import { User } from "../models";
import { UserRole } from "../types";

const authRouter = Router();

const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
  area: z.string().optional(),
});

const verifySchema = z.object({
  otp: z.string().length(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid registration payload",
      errors: parsed.error.flatten(),
    });
  }

  const role: UserRole = parsed.data.role ?? "client";
  const normalizedPhone = parsed.data.phone.trim();
  const normalizedName = parsed.data.fullName.trim();
  const normalizedArea = (parsed.data.area ?? "").trim();

  const databaseStatus = getDatabaseStatus();
  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    const existsInMock = mockUsers.some(
      (user) => user.phone === normalizedPhone,
    );
    if (existsInMock) {
      return res.status(409).json({
        message: "Phone number already registered",
        source: "mock",
      });
    }

    return res.status(201).json({
      message: "Registration successful. OTP sent.",
      user: {
        id: `usr_${Date.now()}`,
        name: normalizedName,
        role,
        phone: normalizedPhone,
        status: "active",
        area: normalizedArea,
        isVerified: false,
      },
      next: "/auth/verify",
      source: "mock",
    });
  }

  try {
    const existingUser = await User.findOne({ phone: normalizedPhone })
      .select("_id")
      .lean();

    if (existingUser) {
      return res.status(409).json({
        message: "Phone number already registered",
        source: "mongodb",
      });
    }

    const createdUser = await User.create({
      phone: normalizedPhone,
      fullName: normalizedName,
      passwordHash: hashPassword(parsed.data.password),
      role,
      area: normalizedArea,
      isVerified: false,
      status: "active",
    });

    return res.status(201).json({
      message: "Registration successful. OTP sent.",
      user: {
        id: String(createdUser._id),
        name: createdUser.fullName,
        role: createdUser.role,
        phone: createdUser.phone,
        status: createdUser.status,
        area: createdUser.area,
        isVerified: createdUser.isVerified,
      },
      next: "/auth/verify",
      source: "mongodb",
    });
  } catch (error) {
    console.error(
      "[auth] Failed to create user in MongoDB, using mock response",
      error,
    );
    return res.status(201).json({
      message: "Registration successful. OTP sent.",
      user: {
        id: `usr_${Date.now()}`,
        name: normalizedName,
        role,
        phone: normalizedPhone,
        status: "active",
        area: normalizedArea,
        isVerified: false,
      },
      next: "/auth/verify",
      source: "mock",
    });
  }
});

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
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
    return res.status(400).json({
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
