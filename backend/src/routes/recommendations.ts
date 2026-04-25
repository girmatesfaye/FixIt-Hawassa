import { Router } from "express";
import {
  getRecommendationsForRequest,
  rankRecommendations,
} from "../controllers/recommendationsController";
import { requireAuth } from "../middleware/auth";

const recommendationsRouter = Router();

recommendationsRouter.post("/rank", rankRecommendations);
recommendationsRouter.get(
  "/request/:requestId",
  requireAuth,
  getRecommendationsForRequest,
);

export default recommendationsRouter;
