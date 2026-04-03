import { Router, Request } from "express";
import { User, WorkerProfile, Review } from "../models";
import { requireAuth } from "../middleware/auth";

type AuthenticatedRequest = Request & { userId?: string };

const workersRouter = Router();

// Get public profile of a worker
workersRouter.get("/:id", async (req, res) => {
  try {
    const workerId = req.params.id;
    const workerUser = await User.findById(workerId).select("-passwordHash -__v").lean();
    
    if (!workerUser || workerUser.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerProfile = await WorkerProfile.findOne({ userId: workerId }).lean();
    const reviews = await Review.find({ workerId }).populate("clientId", "fullName").sort({ createdAt: -1 }).lean();

    return res.json({
      worker: {
        id: workerUser._id,
        name: workerUser.fullName,
        phone: workerUser.phone,
        profile: workerProfile,
        reviews
      }
    });

  } catch (error) {
    console.error("[workers] Failed to fetch worker", error);
    return res.status(500).json({ error: "Failed to fetch worker" });
  }
});

// Post a review for a worker
workersRouter.post("/:id/review", requireAuth, async (req, res) => {
  try {
    const workerId = req.params.id;
    const clientId = (req as AuthenticatedRequest).userId;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    const newReview = new Review({
      workerId,
      clientId,
      rating,
      comment
    });

    await newReview.save();

    return res.status(201).json({ review: newReview });
  } catch (error) {
    console.error("[workers] Failed to submit review", error);
    return res.status(500).json({ error: "Failed to submit review" });
  }
});

export default workersRouter;
