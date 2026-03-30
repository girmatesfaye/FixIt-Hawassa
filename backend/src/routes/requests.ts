import { Router } from "express";
import { Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { getDatabaseStatus } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ServiceRequest } from "../models";

type AuthenticatedRequest = Request & { userId?: string };

const requestsRouter = Router();

const requestDraftSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(20),
  area: z.string().min(2),
  landmark: z.string().min(2),
  maintenanceLevel: z.enum(["New", "Medium", "Old"]),
  hasPhotos: z.boolean(),
  createdAt: z.string(),
});

requestsRouter.post("/", requireAuth, (req, res) => {
  const parsed = requestDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request draft payload",
      errors: parsed.error.flatten(),
    });
  }

  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    return res.status(201).json({
      id: `req_${Date.now()}`,
      status: "SEARCHING",
      request: parsed.data,
      source: "mock",
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const userIdHeader = req.headers["x-user-id"];
  const rawUserId =
    typeof authenticatedUserId === "string"
      ? authenticatedUserId
      : typeof userIdHeader === "string"
        ? userIdHeader
        : "";

  const clientUserId = Types.ObjectId.isValid(rawUserId)
    ? new Types.ObjectId(rawUserId)
    : new Types.ObjectId("000000000000000000000001");

  return ServiceRequest.create({
    clientUserId,
    category: parsed.data.category,
    description: parsed.data.description,
    area: parsed.data.area,
    landmark: parsed.data.landmark,
    maintenanceLevel: parsed.data.maintenanceLevel,
    hasPhotos: parsed.data.hasPhotos,
    status: "SEARCHING",
  })
    .then((created) => {
      return res.status(201).json({
        id: String(created._id),
        status: created.status,
        request: parsed.data,
        source: "mongodb",
      });
    })
    .catch((error) => {
      console.error(
        "[requests] Failed to persist request in MongoDB, using mock response",
        error,
      );
      return res.status(201).json({
        id: `req_${Date.now()}`,
        status: "SEARCHING",
        request: parsed.data,
        source: "mock",
      });
    });
});

export default requestsRouter;
