import { Router } from "express";
import { Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { getDatabaseStatus } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ServiceRequest } from "../models";

type AuthenticatedRequest = Request & { userId?: string };

type StoredRequest = {
  id: string;
  clientUserId: string;
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  status: "SEARCHING" | "IN_PROGRESS" | "PENDING" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
};

const requestsRouter = Router();
const mockRequestStore: StoredRequest[] = [];

const requestDraftSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(20),
  area: z.string().min(2),
  landmark: z.string().min(2),
  maintenanceLevel: z.enum(["New", "Medium", "Old"]),
  hasPhotos: z.boolean(),
  createdAt: z.string(),
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

  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    const requests = mockRequestStore.filter(
      (request) => request.clientUserId === authenticatedUserId,
    );
    return res.json({
      total: requests.length,
      requests,
      source: "mock",
    });
  }

  try {
    const requests = await ServiceRequest.find({
      clientUserId: new Types.ObjectId(authenticatedUserId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      total: requests.length,
      requests: requests.map((request) => ({
        id: String(request._id),
        clientUserId: String(request.clientUserId),
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

  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    const nowIso = new Date().toISOString();
    const id = `req_${Date.now()}`;
    mockRequestStore.unshift({
      id,
      clientUserId: authenticatedUserId,
      category: parsed.data.category,
      description: parsed.data.description,
      area: parsed.data.area,
      landmark: parsed.data.landmark,
      maintenanceLevel: parsed.data.maintenanceLevel,
      hasPhotos: parsed.data.hasPhotos,
      status: "SEARCHING",
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return res.status(201).json({
      id,
      status: "SEARCHING",
      request: parsed.data,
      clientUserId: authenticatedUserId,
      source: "mock",
    });
  }

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
