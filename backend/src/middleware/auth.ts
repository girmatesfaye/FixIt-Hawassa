import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types";

const getRoleFromHeaders = (req: Request): UserRole | null => {
  const role = req.headers["x-user-role"];
  if (role === "client" || role === "worker" || role === "admin") {
    return role;
  }
  return null;
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = getRoleFromHeaders(req);
  if (!role) {
    return res
      .status(401)
      .json({ message: "Unauthorized: missing x-user-role header" });
  }
  (req as Request & { userRole?: UserRole }).userRole = role;
  next();
};

export const requireRole = (required: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getRoleFromHeaders(req);
    if (!role) {
      return res
        .status(401)
        .json({ message: "Unauthorized: missing x-user-role header" });
    }
    if (role !== required) {
      return res
        .status(403)
        .json({ message: `Forbidden: ${required} role required` });
    }
    (req as Request & { userRole?: UserRole }).userRole = role;
    next();
  };
};
