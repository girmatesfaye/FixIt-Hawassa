import { Router } from "express";
import { Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import {
  RecommendationSnapshot,
  ServiceRequest,
  User,
  WorkerProfile,
} from "../models";
import { rankWorkers } from "../services/recommendationService";
import { RequestDraft, WorkerRecommendation } from "../types";

const recommendationsRouter = Router();
type AuthenticatedRequest = Request & { userId?: string };

const querySchema = z.object({
  maxDistanceKm: z.coerce.number().min(1).max(20).default(5),
  minRating: z.coerce.number().min(3).max(5).default(4.4),
  onlyActive: z.coerce.boolean().default(true),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const loadRankedWorkers = async (
  requestDraft: RequestDraft | null,
  filters: {
    maxDistanceKm: number;
    minRating: number;
    onlyActive: boolean;
  },
): Promise<{
  ranked: Array<WorkerRecommendation & { score: number; reasons: string[] }>;
  source: "mock" | "mongodb";
}> => {


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
        id: String(profile.userId),
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
      ranked: [],
      source: "mongodb",
    };
  }
};

const normalizeSnapshotRecommendations = async (
  recommendations: Array<
    WorkerRecommendation & { score: number; reasons: string[] }
  >,
): Promise<
  | Array<WorkerRecommendation & { score: number; reasons: string[] }>
  | null
> => {
  const normalized = await Promise.all(
    recommendations.map(async (recommendation) => {
      const rawId = String(recommendation.id);
      if (!Types.ObjectId.isValid(rawId)) {
        return null;
      }

      const user = await User.findById(rawId).select("_id role").lean();
      if (user?.role === "worker") {
        return {
          ...recommendation,
          id: String(user._id),
        };
      }

      const profile = await WorkerProfile.findById(rawId)
        .select("userId")
        .lean();
      if (profile?.userId) {
        return {
          ...recommendation,
          id: String(profile.userId),
        };
      }

      return null;
    }),
  );

  if (normalized.some((item) => item === null)) {
    return null;
  }

  return normalized as Array<
    WorkerRecommendation & { score: number; reasons: string[] }
  >;
};

const paginateRecommendations = (
  recommendations: Array<
    WorkerRecommendation & { score: number; reasons: string[] }
  >,
  page: number,
  limit: number,
) => {
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = recommendations.slice(start, end);
  return {
    items,
    total: recommendations.length,
    page,
    limit,
    hasMore: end < recommendations.length,
  };
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
  const { maxDistanceKm, minRating, onlyActive, page, limit } =
    parsedQuery.data;

  const { ranked, source } = await loadRankedWorkers(requestDraft, {
    maxDistanceKm,
    minRating,
    onlyActive,
  });

  const paginated = paginateRecommendations(ranked, page, limit);

  return res.json({
    total: paginated.total,
    page: paginated.page,
    limit: paginated.limit,
    hasMore: paginated.hasMore,
    filters: { maxDistanceKm, minRating, onlyActive },
    recommendations: paginated.items,
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
    const { maxDistanceKm, minRating, onlyActive, page, limit } =
      parsedQuery.data;

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

    const snapshotQuery = {
      requestId: new Types.ObjectId(requestId),
      "filters.maxDistanceKm": maxDistanceKm,
      "filters.minRating": minRating,
      "filters.onlyActive": onlyActive,
    };

    let snapshotDoc =
      await RecommendationSnapshot.findOne(snapshotQuery).lean();

    if (!snapshotDoc) {
      const { ranked, source } = await loadRankedWorkers(requestDraft, {
        maxDistanceKm,
        minRating,
        onlyActive,
      });

      snapshotDoc = await RecommendationSnapshot.findOneAndUpdate(
        snapshotQuery,
        {
          $setOnInsert: {
            requestId: new Types.ObjectId(requestId),
            filters: { maxDistanceKm, minRating, onlyActive },
            recommendations: ranked,
            source,
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true },
      ).lean();
    }

    if (!snapshotDoc) {
      return res.status(500).json({
        message: "Failed to load recommendation snapshot",
      });
    }

    let snapshotRecommendations = Array.isArray(snapshotDoc.recommendations)
      ? (snapshotDoc.recommendations as Array<
          WorkerRecommendation & { score: number; reasons: string[] }
        >)
      : [];

    const normalizedSnapshotRecommendations =
      await normalizeSnapshotRecommendations(snapshotRecommendations);

    if (!normalizedSnapshotRecommendations) {
      const { ranked, source } = await loadRankedWorkers(requestDraft, {
        maxDistanceKm,
        minRating,
        onlyActive,
      });

      snapshotDoc = await RecommendationSnapshot.findOneAndUpdate(
        snapshotQuery,
        {
          $set: {
            recommendations: ranked,
            source,
            createdAt: new Date(),
          },
        },
        { new: true },
      ).lean();

      snapshotRecommendations = Array.isArray(snapshotDoc?.recommendations)
        ? (snapshotDoc.recommendations as Array<
            WorkerRecommendation & { score: number; reasons: string[] }
          >)
        : [];
    } else {
      const changed = normalizedSnapshotRecommendations.some(
        (recommendation, index) =>
          String(recommendation.id) !== String(snapshotRecommendations[index]?.id),
      );

      snapshotRecommendations = normalizedSnapshotRecommendations;

      if (changed) {
        snapshotDoc = await RecommendationSnapshot.findOneAndUpdate(
          snapshotQuery,
          {
            $set: {
              recommendations: normalizedSnapshotRecommendations,
            },
          },
          { new: true },
        ).lean();
      }
    }

    if (!snapshotDoc) {
      return res.status(500).json({
        message: "Failed to refresh recommendation snapshot",
      });
    }

    const paginated = paginateRecommendations(
      snapshotRecommendations,
      page,
      limit,
    );

    return res.json({
      requestId,
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      hasMore: paginated.hasMore,
      filters: { maxDistanceKm, minRating, onlyActive },
      recommendations: paginated.items,
      source: snapshotDoc.source,
      snapshotCreatedAt:
        snapshotDoc.createdAt instanceof Date
          ? snapshotDoc.createdAt.toISOString()
          : new Date(snapshotDoc.createdAt).toISOString(),
    });
  },
);

export default recommendationsRouter;
