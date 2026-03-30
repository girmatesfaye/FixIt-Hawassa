import { Router } from "express";
import { Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { getDatabaseStatus } from "../config/db";
import { mockRequestStore } from "../data/mockRequests";
import { mockWorkers } from "../data/mockData";
import { requireAuth } from "../middleware/auth";
import { ServiceRequest, User, WorkerProfile } from "../models";
import { rankWorkers } from "../services/recommendationService";
import { RequestDraft } from "../types";

const recommendationsRouter = Router();
type AuthenticatedRequest = Request & { userId?: string };

const querySchema = z.object({
  maxDistanceKm: z.coerce.number().min(1).max(20).default(5),
  minRating: z.coerce.number().min(3).max(5).default(4.4),
  onlyActive: z.coerce.boolean().default(true),
});

const loadRankedWorkers = async (
  requestDraft: RequestDraft | null,
  filters: {
    maxDistanceKm: number;
    minRating: number;
    onlyActive: boolean;
  },
) => {
  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    return {
      ranked: rankWorkers(
        mockWorkers,
        requestDraft,
        filters.maxDistanceKm,
        filters.minRating,
        filters.onlyActive,
      ),
      source: "mock",
    };
  }

  try {
    const profiles = await WorkerProfile.find().lean();
    const userIds = profiles.map((profile) => profile.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName")
      .lean();

    const usersById = new Map(users.map((user) => [String(user._id), user]));

    const workersFromMongo = profiles.map((profile) => {
      const linkedUser = usersById.get(String(profile.userId));
      return {
        id: String(profile._id),
        name: linkedUser?.fullName ?? "Worker",
        location: `Hawassa, ${profile.area}`,
        area: profile.area,
        rating: profile.rating,
        reviews: profile.reviews,
        isActive: profile.isActive,
        distanceKm: profile.distanceKm,
        completionRate: profile.completionRate,
        responseMinutes: profile.responseMinutes,
        skills: profile.skills,
        avatar: profile.avatar,
      };
    });

    return {
      ranked: rankWorkers(
        workersFromMongo,
        requestDraft,
        filters.maxDistanceKm,
        filters.minRating,
        filters.onlyActive,
      ),
      source: "mongodb",
    };
  } catch (error) {
    console.error(
      "[recommendations] Failed to read MongoDB worker profiles, using mock data",
      error,
    );
    return {
      ranked: rankWorkers(
        mockWorkers,
        requestDraft,
        filters.maxDistanceKm,
        filters.minRating,
        filters.onlyActive,
      ),
      source: "mock",
    };
  }
};

recommendationsRouter.post("/rank", async (req, res) => {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      message: "Invalid recommendation query",
      errors: parsedQuery.error.flatten(),
    });
  }

  const requestDraft = (req.body ?? null) as RequestDraft | null;
  const { ranked, source } = await loadRankedWorkers(requestDraft, {
    maxDistanceKm: parsedQuery.data.maxDistanceKm,
    minRating: parsedQuery.data.minRating,
    onlyActive: parsedQuery.data.onlyActive,
  });

  return res.json({
    total: ranked.length,
    filters: parsedQuery.data,
    recommendations: ranked,
    source,
  });
});

recommendationsRouter.get(
  "/request/:requestId",
  requireAuth,
  async (req, res) => {
    const parsedQuery = querySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Invalid recommendation query",
        errors: parsedQuery.error.flatten(),
      });
    }

    const requestIdRaw = req.params.requestId;
    const requestId = Array.isArray(requestIdRaw)
      ? requestIdRaw[0]
      : requestIdRaw;
    const authenticatedUserId = (req as AuthenticatedRequest).userId;

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

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
      const request = mockRequestStore.find((entry) => entry.id === requestId);
      if (!request) {
        return res
          .status(404)
          .json({ message: "Request not found", source: "mock" });
      }

      if (request.clientUserId !== authenticatedUserId) {
        return res
          .status(403)
          .json({ message: "Forbidden: request access denied" });
      }

      const requestDraft: RequestDraft = {
        category: request.category,
        description: request.description,
        area: request.area,
        landmark: request.landmark,
        maintenanceLevel: request.maintenanceLevel,
        hasPhotos: request.hasPhotos,
        createdAt: request.createdAt,
      };

      const { ranked, source } = await loadRankedWorkers(requestDraft, {
        maxDistanceKm: parsedQuery.data.maxDistanceKm,
        minRating: parsedQuery.data.minRating,
        onlyActive: parsedQuery.data.onlyActive,
      });

      return res.json({
        requestId,
        total: ranked.length,
        filters: parsedQuery.data,
        recommendations: ranked,
        source,
      });
    }

    if (!Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const request = await ServiceRequest.findById(requestId).lean();
    if (!request) {
      return res
        .status(404)
        .json({ message: "Request not found", source: "mongodb" });
    }

    if (String(request.clientUserId) !== authenticatedUserId) {
      return res
        .status(403)
        .json({ message: "Forbidden: request access denied" });
    }

    const requestDraft: RequestDraft = {
      category: request.category,
      description: request.description,
      area: request.area,
      landmark: request.landmark,
      maintenanceLevel: request.maintenanceLevel,
      hasPhotos: request.hasPhotos,
      createdAt:
        request.createdAt instanceof Date
          ? request.createdAt.toISOString()
          : new Date(request.createdAt).toISOString(),
    };

    const { ranked, source } = await loadRankedWorkers(requestDraft, {
      maxDistanceKm: parsedQuery.data.maxDistanceKm,
      minRating: parsedQuery.data.minRating,
      onlyActive: parsedQuery.data.onlyActive,
    });

    return res.json({
      requestId,
      total: ranked.length,
      filters: parsedQuery.data,
      recommendations: ranked,
      source,
    });
  },
);

export default recommendationsRouter;
