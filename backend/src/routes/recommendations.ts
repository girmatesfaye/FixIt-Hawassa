import { Router } from "express";
import { z } from "zod";
import { mockWorkers } from "../data/mockData";
import { rankWorkers } from "../services/recommendationService";
import { RequestDraft } from "../types";

const recommendationsRouter = Router();

const querySchema = z.object({
  maxDistanceKm: z.coerce.number().min(1).max(20).default(5),
  minRating: z.coerce.number().min(3).max(5).default(4.4),
  onlyActive: z.coerce.boolean().default(true),
});

recommendationsRouter.post("/rank", (req, res) => {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res
      .status(400)
      .json({
        message: "Invalid recommendation query",
        errors: parsedQuery.error.flatten(),
      });
  }

  const requestDraft = (req.body ?? null) as RequestDraft | null;

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
  });
});

export default recommendationsRouter;
