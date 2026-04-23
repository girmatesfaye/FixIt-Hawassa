import { Router } from "express";
import { randomBytes, scryptSync } from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { env } from "../config/env";
import { getDatabaseStatus } from "../config/db";
import { User } from "../models";
import { UserRole } from "../types";

const authRouter = Router();

const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2),
    phone: z.string().min(9),
    password: z.string().min(6),
    role: z.enum(["client", "worker", "admin"]).optional(),
    area: z.string().min(2).optional(),
    location: z.string().min(2).optional(),
    nationalId: z.string().optional(),
  })
  .refine(
    (data) => {
      const normalized = (data.location ?? data.area ?? "").trim();
      return normalized.length >= 2;
    },
    {
      message: "Location (Neighborhood/Area) is required",
      path: ["location"],
    },
  );

const verifySchema = z.object({
  sessionId: z.string().min(6),
  otp: z.string().length(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  status: "active" | "suspended";
  area: string;
  nationalId?: string;
  isVerified: boolean;
  passwordHash: string;
};

type OtpSession = {
  userId: string;
  role: UserRole;
  phone: string;
  expiresAt: number;
};

const signAccessToken = (payload: {
  sub: string;
  role: UserRole;
  phone?: string;
}) => {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
};

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password: string, encodedHash: string): boolean => {
  const [algo, salt, expectedHash] = encodedHash.split(":");
  if (algo !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, 64).toString("hex");
  return candidateHash === expectedHash;
};

const createOtpSession = (role: UserRole, userId: string, phone: string) => {
  const sessionId = `sess_${Date.now()}_${randomBytes(4).toString("hex")}`;
  otpSessions.set(sessionId, {
    userId,
    role,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return sessionId;
};



const otpSessions = new Map<string, OtpSession>();

const DUMMY_WORKER_NATIONAL_IDS = new Set([
  "ETH-WORKER-1001",
  "ETH-WORKER-1002",
  "ETH-WORKER-1003",
  "ETH-WORKER-1004",
]);

authRouter.get("/me", requireAuth, async (req, res) => {
  const userId = (req as { userId?: string }).userId;
  const role = (req as { userRole?: UserRole }).userRole;

  if (!userId || !role) {
    return res.status(401).json({ message: "Unauthorized" });
  }



  try {
    const user = await User.findById(userId)
      .select("_id fullName role phone area status isVerified")
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", source: "mongodb" });
    }

    return res.json({
      user: {
        id: String(user._id),
        name: user.fullName,
        role: user.role,
        phone: user.phone,
        area: user.area,
        status: user.status,
        isVerified: user.isVerified,
      },
      source: "mongodb",
    });
  } catch (error) {
    console.error("[auth] Failed to load current user", error);
    return res.status(500).json({ message: "Failed to load current user" });
  }
});

authRouter.post("/refresh", requireAuth, async (req, res) => {
  const userId = (req as { userId?: string }).userId;
  const roleFromToken = (req as { userRole?: UserRole }).userRole;

  if (!userId || !roleFromToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }



  try {
    const user = await User.findById(userId)
      .select("_id role status phone")
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", source: "mongodb" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Account is not active", source: "mongodb" });
    }

    return res.json({
      message: "Token refreshed",
      token: signAccessToken({
        sub: String(user._id),
        role: user.role,
        phone: user.phone,
      }),
      role: user.role,
      source: "mongodb",
    });
  } catch (error) {
    console.error("[auth] Failed to refresh token", error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
});

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
  const normalizedArea = (
    parsed.data.location ??
    parsed.data.area ??
    ""
  ).trim();
  const normalizedNationalId = (parsed.data.nationalId ?? "")
    .trim()
    .toUpperCase();

  if (role === "worker") {
    if (!normalizedNationalId) {
      return res.status(400).json({
        message: "National ID is required for worker registration",
      });
    }

    if (!DUMMY_WORKER_NATIONAL_IDS.has(normalizedNationalId)) {
      return res.status(403).json({
        message: "Worker national ID not recognized",
      });
    }
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

    const requiresOtp = role !== "client";
    const createdUser = await User.create({
      phone: normalizedPhone,
      fullName: normalizedName,
      passwordHash: hashPassword(parsed.data.password),
      role,
      area: normalizedArea,
      nationalId: role === "worker" ? normalizedNationalId : "",
      isVerified: !requiresOtp,
      status: "active",
    });
    const sessionId = requiresOtp
      ? createOtpSession(
          createdUser.role,
          String(createdUser._id),
          createdUser.phone,
        )
      : undefined;
    const token = requiresOtp
      ? undefined
      : signAccessToken({
          sub: String(createdUser._id),
          role: createdUser.role,
          phone: createdUser.phone,
        });

    return res.status(201).json({
      message: requiresOtp
        ? "Registration successful. OTP sent."
        : "Registration successful.",
      requiresOtp,
      sessionId,
      token,
      user: {
        id: String(createdUser._id),
        name: createdUser.fullName,
        role: createdUser.role,
        phone: createdUser.phone,
        status: createdUser.status,
        area: createdUser.area,
        nationalId:
          createdUser.role === "worker" ? createdUser.nationalId : undefined,
        isVerified: createdUser.isVerified,
      },
      next: requiresOtp ? "/auth/verify" : "/dashboard",
      source: "mongodb",
    });
  } catch (error) {
    console.error(
      "[auth] Failed to create user in MongoDB, using mock response",
      error,
    );
    return res.status(500).json({
      message: "Registration failed",
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

  const normalizedPhone = parsed.data.phone.trim();
  const providedRole = parsed.data.role;


  return User.findOne({ phone: normalizedPhone })
    .select("_id phone role status passwordHash")
    .lean()
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Invalid phone or password",
          source: "mongodb",
        });
      }

      if (providedRole && providedRole !== user.role) {
        return res.status(403).json({
          message: "Role does not match this account",
          source: "mongodb",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          message: "Account is not active",
          source: "mongodb",
        });
      }

      if (!verifyPassword(parsed.data.password, user.passwordHash)) {
        return res.status(401).json({
          message: "Invalid phone or password",
          source: "mongodb",
        });
      }

      const sessionId = createOtpSession(
        user.role,
        String(user._id),
        user.phone,
      );
      return res.json({
        message: "Login accepted. OTP sent.",
        sessionId,
        next: "/auth/verify",
        role: user.role,
        source: "mongodb",
      });
    })
    .catch((error) => {
      console.error("[auth] Login check failed in MongoDB", error);
      return res.status(500).json({
        message: "Login failed. Please try again.",
      });
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

  const session = otpSessions.get(parsed.data.sessionId);
  if (!session) {
    return res.status(401).json({
      message: "Invalid or expired verification session",
    });
  }

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(parsed.data.sessionId);
    return res.status(401).json({
      message: "Verification session expired. Please login again.",
    });
  }

  const role: UserRole = parsed.data.role ?? session.role;
  if (role !== session.role) {
    return res.status(403).json({
      message: "Verification role mismatch",
    });
  }

  otpSessions.delete(parsed.data.sessionId);

  void User.findByIdAndUpdate(session.userId, { isVerified: true }).catch(
    (error) => {
      console.error("[auth] Failed to update verification flag", error);
    },
  );

  return res.json({
    message: "Verification successful",
    token: signAccessToken({
      sub: session.userId,
      role,
      phone: session.phone,
    }),
    role,
  });
});

export default authRouter;
