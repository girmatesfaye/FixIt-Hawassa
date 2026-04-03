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
  assignedWorkerId: z.string().optional(),
});

requestsRouter.get("/mine", requireAuth, async (req, res) => {
  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  if (
    typeof authenticatedUserId !== "string" ||
    !Types.ObjectId.isValid(authenticatedUserId)
  ) {
    return res.status(401).json({
      message: "Unauthorized: valid user token required",
    });
  }



  try {
    const requests = await ServiceRequest.find({
      $or: [
        { clientUserId: new Types.ObjectId(authenticatedUserId) },
        { assignedWorkerId: new Types.ObjectId(authenticatedUserId) }
      ]
    })
      .populate("clientUserId", "name")
      .populate("assignedWorkerId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      total: requests.length,
      requests: requests.map((request) => ({
        id: String(request._id),
        clientUserId: request.clientUserId,
        assignedWorkerId: request.assignedWorkerId,
        category: request.category,
        description: request.description,
        area: request.area,
        landmark: request.landmark,
        maintenanceLevel: request.maintenanceLevel,
        hasPhotos: request.hasPhotos,
        status: request.status,
        createdAt:
          request.createdAt instanceof Date
            ? request.createdAt.toISOString()
            : new Date(request.createdAt).toISOString(),
        updatedAt:
          request.updatedAt instanceof Date
            ? request.updatedAt.toISOString()
            : new Date(request.updatedAt).toISOString(),
      })),
      source: "mongodb",
    });
  } catch (error) {
    console.error("[requests] Failed to fetch user requests", error);
    return res.status(500).json({
      message: "Failed to load requests",
    });
  }
});

requestsRouter.post("/", requireAuth, (req, res) => {
  const parsed = requestDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request draft payload",
      errors: parsed.error.flatten(),
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  if (
    typeof authenticatedUserId !== "string" ||
    !Types.ObjectId.isValid(authenticatedUserId)
  ) {
    return res.status(401).json({
      message: "Unauthorized: valid user token required",
    });
  }

  const clientUserId = new Types.ObjectId(authenticatedUserId);



  return ServiceRequest.create({
    clientUserId,
    category: parsed.data.category,
    description: parsed.data.description,
    area: parsed.data.area,
    landmark: parsed.data.landmark,
    maintenanceLevel: parsed.data.maintenanceLevel,
    hasPhotos: parsed.data.hasPhotos,
    status: parsed.data.assignedWorkerId ? "PENDING" : "SEARCHING",
    assignedWorkerId: parsed.data.assignedWorkerId ? new Types.ObjectId(parsed.data.assignedWorkerId) : null,
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
        "[requests] Failed to persist request in MongoDB",
        error,
      );
      return res.status(500).json({
        message: "Failed to persist request",
      });
    });
});

export default requestsRouter;
