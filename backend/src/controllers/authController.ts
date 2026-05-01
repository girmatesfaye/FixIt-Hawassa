import { randomBytes, scryptSync } from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { User, WorkerProfile } from "../models";
import { UserRole } from "../types";
import { sendResetPasswordEmail } from "../services/emailService";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
  area: z.string().optional(),
  location: z.string().optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
});

/*
const verifySchema = z.object({
  sessionId: z.string().min(6),
  otp: z.string().length(6),
  role: z.enum(["client", "worker", "admin"]).optional(),
});
*/

const updateMeSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    area: z.string().trim().min(2).max(120).optional(),
    location: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(9).max(20).optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.area !== undefined ||
      data.location !== undefined ||
      data.phone !== undefined,
    {
      message: "At least one field is required",
      path: ["fullName"],
    },
  );

/*
type OtpSession = {
  userId: string;
  role: UserRole;
  email: string;
  expiresAt: number;
};
*/

const signAccessToken = (payload: {
  sub: string;
  role: UserRole;
  email: string;
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

// const otpSessions = new Map<string, OtpSession>();

/*
const createOtpSession = (role: UserRole, userId: string, email: string) => {
  const sessionId = `sess_${Date.now()}_${randomBytes(4).toString("hex")}`;
  otpSessions.set(sessionId, {
    userId,
    role,
    email,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return sessionId;
};
*/

const DUMMY_WORKER_NATIONAL_IDS = new Set([
  "ETH-WORKER-1001",
  "ETH-WORKER-1002",
  "ETH-WORKER-1003",
  "ETH-WORKER-1004",
]);

export const getMe = async (req: Request, res: Response) => {
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
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = (req as { userId?: string }).userId;
  const role = (req as { userRole?: UserRole }).userRole;

  if (!userId || !role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid profile update payload",
      errors: parsed.error.flatten(),
    });
  }

  const updatePayload: { fullName?: string; area?: string; phone?: string } = {};
  if (parsed.data.fullName !== undefined) {
    updatePayload.fullName = parsed.data.fullName;
  }

  const normalizedArea = (parsed.data.location ?? parsed.data.area)?.trim();
  if (normalizedArea !== undefined) {
    updatePayload.area = normalizedArea;
  }

  if (parsed.data.phone !== undefined) {
    const trimmedPhone = parsed.data.phone.trim();
    updatePayload.phone = trimmedPhone === "" ? undefined : trimmedPhone;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatePayload },
      { new: true },
    )
      .select("_id fullName role phone area status isVerified")
      .lean();

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found", source: "mongodb" });
    }

    return res.json({
      message: "Profile updated",
      user: {
        id: String(updatedUser._id),
        name: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        area: updatedUser.area,
        status: updatedUser.status,
        isVerified: updatedUser.isVerified,
      },
      source: "mongodb",
    });
  } catch (error) {
    console.error("[auth] Failed to update current user", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const refresh = async (req: Request, res: Response) => {
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
        email: user.email,
      }),
      role: user.role,
      source: "mongodb",
    });
  } catch (error) {
    console.error("[auth] Failed to refresh token", error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorMsg = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(", ")}`)
      .join("; ");
    
    return res.status(400).json({
      message: `Invalid registration payload: ${errorMsg}`,
      errors: parsed.error.flatten(),
    });
  }

  const role: UserRole = parsed.data.role ?? "client";
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
    const existingUser = await User.findOne({ email: parsed.data.email.toLowerCase() })
      .select("_id email")
      .lean();

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
        source: "mongodb",
      });
    }

    const requiresOtp = false; // OTP DISABLED
    const createdUser = await User.create({
      email: parsed.data.email.toLowerCase(),
      fullName: normalizedName,
      passwordHash: hashPassword(parsed.data.password),
      role,
      area: normalizedArea,
      nationalId: role === "worker" ? normalizedNationalId : "",
      phone: parsed.data.phone ? parsed.data.phone.trim() : undefined,
      isVerified: true, // OTP DISABLED
      status: "active",
    });

    // CRITICAL FIX: Create WorkerProfile if the user is a worker
    if (role === "worker") {
      const initialCategory = parsed.data.category || "General";
      await WorkerProfile.create({
        userId: createdUser._id,
        area: normalizedArea,
        title: `${initialCategory} Specialist`, // Temporary title
        skills: [initialCategory], // Add the initial category as a skill
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=random`, // Default avatar
        isActive: true,
      });
    }

    const sessionId = undefined;
    const token = signAccessToken({
      sub: String(createdUser._id),
      role: createdUser.role,
      email: createdUser.email,
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
};

export const login = (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid login payload",
      errors: parsed.error.flatten(),
    });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const providedRole = parsed.data.role;

  return User.findOne({ email: normalizedEmail })
    .select("_id email role status passwordHash")
    .lean()
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
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
          message: "Invalid email or password",
          source: "mongodb",
        });
      }

      const token = signAccessToken({
        sub: String(user._id),
        role: user.role,
        email: user.email,
      });

      return res.json({
        message: "Login successful",
        token,
        role: user.role,
        next: user.role === "admin" ? "/admin/users" : user.role === "worker" ? "/worker-hub" : "/dashboard",
        source: "mongodb",
      });
    })
    .catch((error) => {
      console.error("[auth] Login check failed in MongoDB", error);
      return res.status(500).json({
        message: "Login failed. Please try again.",
      });
    });
};

/*
export const verify = (req: Request, res: Response) => {
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
      email: session.email,
    }),
    role,
  });
};
*/

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // We return 200 even if user not found for security (prevent enumeration)
      return res.json({ message: "If an account exists with this email, a recovery email has been sent." });
    }

    if (!user.email) {
      return res.status(400).json({ message: "No recovery email associated with this account. Please contact support." });
    }

    const token = randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendResetPasswordEmail(user.email, token);

    return res.json({ message: "Recovery email sent successfully." });
  } catch (error) {
    console.error("[auth] Forgot password failed", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.passwordHash = hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    console.error("[auth] Reset password failed", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};
