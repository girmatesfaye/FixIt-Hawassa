import { Request, Response } from "express";
import { Types } from "mongoose";
import { Report, Review, ServiceRequest, User, WorkerProfile } from "../models";

type AuthenticatedRequest = Request & { userId?: string };

const resolveWorkerUserId = async (
  workerId: string,
): Promise<string | null> => {
  if (!Types.ObjectId.isValid(workerId)) {
    return null;
  }

  const user = await User.findById(workerId).select("_id role").lean();
  if (user?.role === "worker") {
    return String(user._id);
  }

  const profile = await WorkerProfile.findById(workerId)
    .select("userId")
    .lean();
  if (profile?.userId) {
    return String(profile.userId);
  }

  return null;
};

export const getMyWorkerProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workerUser = await User.findById(userId)
      .select("-passwordHash -__v")
      .lean();
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
        avatar: workerUser.avatar,
        profile: workerProfile,
      },
    });
  } catch (error) {
    console.error("[workers] Failed to fetch my profile", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateMyWorkerProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workerUser = await User.findById(userId);
    if (!workerUser || workerUser.role !== "worker") {
      return res.status(403).json({ error: "Only workers can access this" });
    }

    const {
      name,
      phone,
      area,
      telegramUsername,
      tiktokProfile,
      bio,
      skills,
      avatar,
      portfolio,
      isActive,
    } = req.body;

    if (name !== undefined) {
      workerUser.fullName = name;
    }
    if (phone !== undefined) {
      workerUser.phone = phone;
    }
    if (avatar !== undefined) {
      workerUser.avatar = avatar;
    }
    await workerUser.save();

    const workerProfile = await WorkerProfile.findOne({ userId });
    if (workerProfile) {
      if (area !== undefined) {
        workerProfile.area = area;
      }
      if (telegramUsername !== undefined) {
        workerProfile.telegramUsername = telegramUsername;
      }
      if (tiktokProfile !== undefined) {
        workerProfile.tiktokProfile = tiktokProfile;
      }
      if (bio !== undefined) {
        workerProfile.bio = bio;
      }
      if (skills !== undefined && Array.isArray(skills)) {
        workerProfile.skills = skills;
      }
      if (avatar !== undefined) {
        workerProfile.avatar = avatar;
      }
      if (portfolio !== undefined && Array.isArray(portfolio)) {
        workerProfile.portfolio = portfolio;
      }
      if (isActive !== undefined) {
        workerProfile.isActive = isActive;
      }
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
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    const updatedProfile = await WorkerProfile.findOne({ userId }).lean();

    return res.json({
      worker: {
        id: workerUser._id,
        name: workerUser.fullName,
        phone: workerUser.phone,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error("[workers] Failed to update my profile", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const getWorkerById = async (req: Request, res: Response) => {
  try {
    const workerIdRaw = req.params.id;
    const workerId = Array.isArray(workerIdRaw) ? workerIdRaw[0] : workerIdRaw;
    const resolvedWorkerUserId = await resolveWorkerUserId(workerId);
    if (!resolvedWorkerUserId) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerUser = await User.findById(resolvedWorkerUserId)
      .select("-passwordHash -__v")
      .lean();

    if (!workerUser || workerUser.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerProfile = await WorkerProfile.findOne({
      userId: resolvedWorkerUserId,
    }).lean();
    const reviews = await Review.find({ workerId: resolvedWorkerUserId })
      .populate("clientId", "fullName avatar")
      .sort({ createdAt: -1 })
      .lean();

    const aggregateStats = await Review.aggregate<{
      avgRating: number;
      count: number;
    }>([
      { $match: { workerId: new Types.ObjectId(resolvedWorkerUserId) } },
      {
        $group: {
          _id: "$workerId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          avgRating: 1,
          count: 1,
        },
      },
    ]);

    const stats = aggregateStats[0];

    return res.json({
      worker: {
        id: workerUser._id,
        name: workerUser.fullName,
        phone: workerUser.phone,
        avatar: workerUser.avatar,
        profile: workerProfile
          ? {
              ...workerProfile,
              rating: stats ? Number(stats.avgRating.toFixed(2)) : 0,
              reviews: stats ? stats.count : 0,
            }
          : workerProfile,
        reviews,
      },
    });
  } catch (error) {
    console.error("[workers] Failed to fetch worker", error);
    return res.status(500).json({ error: "Failed to fetch worker" });
  }
};

export const createWorkerReview = async (req: Request, res: Response) => {
  try {
    const workerIdRaw = req.params.id;
    const workerId = Array.isArray(workerIdRaw) ? workerIdRaw[0] : workerIdRaw;
    const resolvedWorkerUserId = await resolveWorkerUserId(workerId);
    const clientId = (req as AuthenticatedRequest).userId;
    const { rating, comment, requestId } = req.body as {
      rating?: number;
      comment?: string;
      requestId?: string;
    };

    if (!rating || !comment || !requestId) {
      return res.status(400).json({
        error: "Rating, comment and requestId are required",
      });
    }

    if (!resolvedWorkerUserId) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (!clientId || !Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const matchedRequest = await ServiceRequest.findOne({
      _id: new Types.ObjectId(requestId),
      clientUserId: new Types.ObjectId(clientId),
      assignedWorkerId: new Types.ObjectId(resolvedWorkerUserId),
      status: "COMPLETED",
      clientConfirmedCompleteAt: { $ne: null },
    })
      .select("_id")
      .lean();

    if (!matchedRequest) {
      return res.status(403).json({
        error:
          "You can only review workers who completed and were confirmed on your request",
      });
    }

    const alreadyReviewed = await Review.findOne({
      requestId: new Types.ObjectId(requestId),
      workerId: new Types.ObjectId(resolvedWorkerUserId),
      clientId: new Types.ObjectId(clientId),
    })
      .select("_id")
      .lean();

    if (alreadyReviewed) {
      return res.status(409).json({
        error: "You already reviewed this completed request",
      });
    }

    const newReview = new Review({
      requestId: new Types.ObjectId(requestId),
      workerId: resolvedWorkerUserId,
      clientId,
      rating,
      comment,
    });

    await newReview.save();

    const aggregateResult = await Review.aggregate<{
      avgRating: number;
      count: number;
    }>([
      { $match: { workerId: new Types.ObjectId(resolvedWorkerUserId) } },
      {
        $group: {
          _id: "$workerId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          avgRating: 1,
          count: 1,
        },
      },
    ]);

    const reviewStats = aggregateResult[0];
    if (reviewStats) {
      await WorkerProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(resolvedWorkerUserId) },
        {
          $set: {
            rating: Number(reviewStats.avgRating.toFixed(2)),
            reviews: reviewStats.count,
          },
        },
      );
    }

    return res.status(201).json({ review: newReview });
  } catch (error) {
    console.error("[workers] Failed to submit review", error);
    return res.status(500).json({ error: "Failed to submit review" });
  }
};

export const createWorkerReport = async (req: Request, res: Response) => {
  try {
    const workerIdRaw = req.params.id;
    const workerId = Array.isArray(workerIdRaw) ? workerIdRaw[0] : workerIdRaw;
    const resolvedWorkerUserId = await resolveWorkerUserId(workerId);
    const reporterUserId = (req as AuthenticatedRequest).userId;
    const { type, text, requestId } = req.body as {
      type?: string;
      text?: string;
      requestId?: string;
    };

    if (!type?.trim() || !text?.trim() || !requestId) {
      return res.status(400).json({
        error: "type, text and requestId are required",
      });
    }

    if (!resolvedWorkerUserId) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (!reporterUserId || !Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const matchedRequest = await ServiceRequest.findOne({
      _id: new Types.ObjectId(requestId),
      clientUserId: new Types.ObjectId(reporterUserId),
      assignedWorkerId: new Types.ObjectId(resolvedWorkerUserId),
      status: "COMPLETED",
      clientConfirmedCompleteAt: { $ne: null },
    })
      .select("_id")
      .lean();

    if (!matchedRequest) {
      return res.status(403).json({
        error:
          "You can only report workers who completed and were confirmed on your request",
      });
    }

    const newReport = await Report.create({
      type: type.trim(),
      text: text.trim(),
      requestId: new Types.ObjectId(requestId),
      reportedUserId: new Types.ObjectId(resolvedWorkerUserId),
      reporterUserId: new Types.ObjectId(reporterUserId),
      status: "pending",
    });

    return res.status(201).json({ report: newReport });
  } catch (error) {
    console.error("[workers] Failed to submit report", error);
    return res.status(500).json({ error: "Failed to submit report" });
  }
};
