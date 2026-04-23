import { Router, Request } from "express";
import { User, WorkerProfile, Review } from "../models";
import { requireAuth } from "../middleware/auth";

type AuthenticatedRequest = Request & { userId?: string };

const workersRouter = Router();

// Get my own worker profile
workersRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const workerUser = await User.findById(userId).select("-passwordHash -__v").lean();
    if (!workerUser || workerUser.role !== "worker") {
      return res.status(403).json({ error: "Only workers can access this" });
    }

    let workerProfile = await WorkerProfile.findOne({ userId }).lean();
    if (!workerProfile) {
      const newProfile = await WorkerProfile.create({
        userId,
        area: workerUser.area || "Hawassa",
      });
      workerProfile = newProfile.toObject();
    }

    return res.json({
      worker: {
        id: workerUser._id,
        name: workerUser.fullName,
        phone: workerUser.phone,
        profile: workerProfile,
      }
    });
  } catch (error) {
    console.error("[workers] Failed to fetch my profile", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update my own worker profile
workersRouter.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const workerUser = await User.findById(userId);
    if (!workerUser || workerUser.role !== "worker") {
      return res.status(403).json({ error: "Only workers can access this" });
    }

    const { name, phone, area, telegramUsername, tiktokProfile, bio, skills, avatar, portfolio } = req.body;

    if (name) workerUser.fullName = name;
    if (phone) workerUser.phone = phone;
    await workerUser.save();

    const workerProfile = await WorkerProfile.findOne({ userId });
    if (workerProfile) {
      if (area !== undefined) workerProfile.area = area;
      if (telegramUsername !== undefined) workerProfile.telegramUsername = telegramUsername;
      if (tiktokProfile !== undefined) workerProfile.tiktokProfile = tiktokProfile;
      if (bio !== undefined) workerProfile.bio = bio;
      if (skills !== undefined && Array.isArray(skills)) workerProfile.skills = skills;
      if (avatar !== undefined) workerProfile.avatar = avatar;
      if (portfolio !== undefined && Array.isArray(portfolio)) workerProfile.portfolio = portfolio;
      await workerProfile.save();
    } else {
      await WorkerProfile.create({
        userId,
        area: area || "Hawassa",
        telegramUsername: telegramUsername || "",
        tiktokProfile: tiktokProfile || "",
        bio: bio || "",
        skills: Array.isArray(skills) ? skills : [],
        avatar: avatar || "",
        portfolio: Array.isArray(portfolio) ? portfolio : [],
      });
    }

    const updatedProfile = await WorkerProfile.findOne({ userId }).lean();

    return res.json({
      worker: {
        id: workerUser._id,
        name: workerUser.fullName,
        phone: workerUser.phone,
        profile: updatedProfile,
      }
    });
  } catch (error) {
    console.error("[workers] Failed to update my profile", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

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
