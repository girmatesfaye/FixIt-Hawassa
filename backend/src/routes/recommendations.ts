import { Router } from "express";
import { z } from "zod";
import { getDatabaseStatus } from "../config/db";
import { mockWorkers } from "../data/mockData";
import { User, WorkerProfile } from "../models";
import { rankWorkers } from "../services/recommendationService";
import { RequestDraft } from "../types";

const recommendationsRouter = Router();

const querySchema = z.object({
  maxDistanceKm: z.coerce.number().min(1).max(20).default(5),
  minRating: z.coerce.number().min(3).max(5).default(4.4),
  onlyActive: z.coerce.boolean().default(true),
});

recommendationsRouter.post("/rank", async (req, res) => {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      message: "Invalid recommendation query",
      errors: parsedQuery.error.flatten(),
    });
  }

  const requestDraft = (req.body ?? null) as RequestDraft | null;
  const databaseStatus = getDatabaseStatus();

  if (databaseStatus.mode === "mock" || !databaseStatus.connected) {
    const ranked = rankWorkers(
      mockWorkers,
      requestDraft,
      parsedQuery.data.maxDistanceKm,
      parsedQuery.data.minRating,
      parsedQuery.data.onlyActive,
    );

    return res.json({
      total: ranked.length,
      filters: parsedQuery.data,
      recommendations: ranked,
      source: "mock",
    });
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

    const ranked = rankWorkers(
      workersFromMongo,
      requestDraft,
      parsedQuery.data.maxDistanceKm,
      parsedQuery.data.minRating,
      parsedQuery.data.onlyActive,
    );

    return res.json({
      total: ranked.length,
      filters: parsedQuery.data,
      recommendations: ranked,
      source: "mongodb",
    });
  } catch (error) {
    console.error(
      "[recommendations] Failed to read MongoDB worker profiles, using mock data",
      error,
    );
    const ranked = rankWorkers(
      mockWorkers,
      requestDraft,
      parsedQuery.data.maxDistanceKm,
      parsedQuery.data.minRating,
      parsedQuery.data.onlyActive,
    );

    return res.json({
      total: ranked.length,
      filters: parsedQuery.data,
      recommendations: ranked,
      source: "mock",
    });
  }
});

export default recommendationsRouter;
