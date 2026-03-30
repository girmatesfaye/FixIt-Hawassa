import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "../types";

type AuthenticatedRequest = Request & {
  userRole?: UserRole;
  userId?: string;
};

type TokenPayload = {
  sub?: string;
  role?: string;
};

const getRoleFromHeaders = (req: Request): UserRole | null => {
  const role = req.headers["x-user-role"];
  if (role === "client" || role === "worker" || role === "admin") {
    return role;
  }
  return null;
};

const getAuthFromBearerToken = (
  req: Request,
): { role: UserRole; userId?: string } | null => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    const role = decoded.role;
    if (role !== "client" && role !== "worker" && role !== "admin") {
      return null;
    }

    return {
      role,
      userId: typeof decoded.sub === "string" ? decoded.sub : undefined,
    };
  } catch {
    return null;
  }
};

const getAuthContext = (
  req: Request,
): { role: UserRole; userId?: string } | null => {
  const bearerAuth = getAuthFromBearerToken(req);
  if (bearerAuth) {
    return bearerAuth;
  }

  const roleFromHeaders = getRoleFromHeaders(req);
  if (!roleFromHeaders) {
    return null;
  }

  const userIdHeader = req.headers["x-user-id"];
  return {
    role: roleFromHeaders,
    userId: typeof userIdHeader === "string" ? userIdHeader : undefined,
  };
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authContext = getAuthContext(req);
  if (!authContext) {
    return res.status(401).json({
      message: "Unauthorized: provide Bearer token or x-user-role header",
    });
  }

  (req as AuthenticatedRequest).userRole = authContext.role;
  (req as AuthenticatedRequest).userId = authContext.userId;
  next();
};

export const requireRole = (required: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    if (!authContext) {
      return res.status(401).json({
        message: "Unauthorized: provide Bearer token or x-user-role header",
      });
    }

    if (authContext.role !== required) {
      return res
        .status(403)
        .json({ message: `Forbidden: ${required} role required` });
    }

    (req as AuthenticatedRequest).userRole = authContext.role;
    (req as AuthenticatedRequest).userId = authContext.userId;
    next();
  };
};

export const requireRoleToken = (required: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthFromBearerToken(req);
    if (!authContext) {
      return res.status(401).json({
        message: "Unauthorized: Bearer token required",
      });
    }

    if (authContext.role !== required) {
      return res
        .status(403)
        .json({ message: `Forbidden: ${required} role required` });
    }

    (req as AuthenticatedRequest).userRole = authContext.role;
    (req as AuthenticatedRequest).userId = authContext.userId;
    next();
  };
};
