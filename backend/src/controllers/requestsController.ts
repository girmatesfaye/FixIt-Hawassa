import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Report, Review, ServiceRequest, User, WorkerProfile } from "../models";
import { sendNewRequestEmail, sendBookingAcceptedEmail } from "../services/emailService";

type AuthenticatedRequest = Request & {
  userId?: string;
  userRole?: "client" | "worker" | "admin";
};

const requestDraftSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(20),
  area: z.string().min(2),
  landmark: z.string().min(2),
  maintenanceLevel: z.enum(["New", "Medium", "Old"]),
  hasPhotos: z.boolean(),
  photoUrls: z.array(z.string().min(1)).max(3).optional().default([]),
  createdAt: z.string(),
  assignedWorkerId: z.string().optional(),
});

const assignWorkerSchema = z.object({
  workerId: z.string().min(1),
});

const workerDecisionSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

const completionActionSchema = z.object({
  action: z.enum(["worker_complete", "client_confirm"]).optional(),
});

const resolveWorkerUserId = async (
  workerId: string,
): Promise<string | null> => {
  if (!Types.ObjectId.isValid(workerId)) {
    return null;
  }

  const workerUser = await User.findById(workerId).select("_id role").lean();
  if (workerUser?.role === "worker") {
    return String(workerUser._id);
  }

  const workerProfile = await WorkerProfile.findById(workerId)
    .select("userId")
    .lean();
  if (workerProfile?.userId) {
    return String(workerProfile.userId);
  }

  return null;
};

const mapUserRef = (
  value: unknown,
): { _id: string; name: string | null; avatar: string | null } | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { _id?: unknown; fullName?: unknown; avatar?: unknown };
  if (!record._id) {
    return null;
  }

  return {
    _id: String(record._id),
    name: typeof record.fullName === "string" ? record.fullName : null,
    avatar: typeof record.avatar === "string" ? record.avatar : null,
  };
};

const mapRequestResponse = (request: {
  _id: unknown;
  clientUserId: unknown;
  assignedWorkerId?: unknown;
  lastDeclinedWorkerId?: unknown;
  lastDeclinedAt?: Date | string | null;
  workerMarkedCompleteAt?: Date | string | null;
  clientConfirmedCompleteAt?: Date | string | null;
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  photoUrls?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  hasReview?: boolean;
  hasReport?: boolean;
}) => ({
  id: String(request._id),
  clientUserId: mapUserRef(request.clientUserId),
  assignedWorkerId: mapUserRef(request.assignedWorkerId),
  lastDeclinedWorkerId: mapUserRef(request.lastDeclinedWorkerId),
  lastDeclinedAt: request.lastDeclinedAt
    ? request.lastDeclinedAt instanceof Date
      ? request.lastDeclinedAt.toISOString()
      : new Date(request.lastDeclinedAt).toISOString()
    : null,
  workerMarkedCompleteAt: request.workerMarkedCompleteAt
    ? request.workerMarkedCompleteAt instanceof Date
      ? request.workerMarkedCompleteAt.toISOString()
      : new Date(request.workerMarkedCompleteAt).toISOString()
    : null,
  clientConfirmedCompleteAt: request.clientConfirmedCompleteAt
    ? request.clientConfirmedCompleteAt instanceof Date
      ? request.clientConfirmedCompleteAt.toISOString()
      : new Date(request.clientConfirmedCompleteAt).toISOString()
    : null,
  category: request.category,
  description: request.description,
  area: request.area,
  landmark: request.landmark,
  maintenanceLevel: request.maintenanceLevel,
  hasPhotos: request.hasPhotos,
  photoUrls: Array.isArray(request.photoUrls) ? request.photoUrls : [],
  status: request.status,
  createdAt:
    request.createdAt instanceof Date
      ? request.createdAt.toISOString()
      : new Date(request.createdAt).toISOString(),
  updatedAt:
    request.updatedAt instanceof Date
      ? request.updatedAt.toISOString()
      : new Date(request.updatedAt).toISOString(),
  hasReview: request.hasReview ?? false,
  hasReport: request.hasReport ?? false,
});

export const getMyRequests = async (req: Request, res: Response) => {
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
        { assignedWorkerId: new Types.ObjectId(authenticatedUserId) },
      ],
    })
      .populate("clientUserId", "fullName avatar")
      .populate("assignedWorkerId", "fullName avatar")
      .populate("lastDeclinedWorkerId", "fullName avatar")
      .sort({ createdAt: -1 })
      .lean();

    const requestIds = requests.map((r) => r._id);
    const [reviews, reports] = await Promise.all([
      Review.find({ requestId: { $in: requestIds } })
        .select("requestId")
        .lean(),
      Report.find({ requestId: { $in: requestIds } })
        .select("requestId")
        .lean(),
    ]);

    const reviewedIds = new Set(reviews.map((r) => String(r.requestId)));
    const reportedIds = new Set(reports.map((r) => String(r.requestId)));

    return res.json({
      total: requests.length,
      requests: requests.map((r) =>
        mapRequestResponse({
          ...r,
          hasReview: reviewedIds.has(String(r._id)),
          hasReport: reportedIds.has(String(r._id)),
        }),
      ),
      source: "mongodb",
    });
  } catch (error) {
    console.error("[requests] Failed to fetch user requests", error);
    return res.status(500).json({
      message: "Failed to load requests",
    });
  }
};

export const getMyReports = async (req: Request, res: Response) => {
  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const authenticatedRole = (req as AuthenticatedRequest).userRole;
  if (
    typeof authenticatedUserId !== "string" ||
    !Types.ObjectId.isValid(authenticatedUserId)
  ) {
    return res.status(401).json({
      message: "Unauthorized: valid user token required",
    });
  }

  try {
    const userObjectId = new Types.ObjectId(authenticatedUserId);
    const reportFilter =
      authenticatedRole === "worker"
        ? { reportedUserId: userObjectId }
        : { reporterUserId: userObjectId };

    const reports = await Report.find(reportFilter)
      .populate("reportedUserId", "fullName")
      .populate("reporterUserId", "fullName")
      .populate("resolvedBy", "fullName")
      .populate("requestId", "category area createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      total: reports.length,
      reports: reports.map((report) => ({
        id: String(report._id),
        type: report.type,
        text: report.text,
        status: report.status,
        adminFeedback:
          typeof report.adminFeedback === "string" ? report.adminFeedback : "",
        resolutionAction:
          typeof report.resolutionAction === "string"
            ? report.resolutionAction
            : null,
        isDangerous: Boolean(report.isDangerous),
        resolvedAt: report.resolvedAt
          ? report.resolvedAt instanceof Date
            ? report.resolvedAt.toISOString()
            : new Date(report.resolvedAt).toISOString()
          : null,
        createdAt:
          report.createdAt instanceof Date
            ? report.createdAt.toISOString()
            : new Date(report.createdAt).toISOString(),
        updatedAt:
          report.updatedAt instanceof Date
            ? report.updatedAt.toISOString()
            : new Date(report.updatedAt).toISOString(),
        reporterUser: report.reporterUserId
          ? {
              _id: String(
                (report.reporterUserId as { _id?: unknown })._id ?? "",
              ),
              name:
                typeof (report.reporterUserId as { fullName?: unknown })
                  .fullName === "string"
                  ? String(
                      (report.reporterUserId as { fullName?: unknown })
                        .fullName,
                    )
                  : null,
            }
          : null,
        resolvedBy: report.resolvedBy
          ? {
              _id: String((report.resolvedBy as { _id?: unknown })._id ?? ""),
              name:
                typeof (report.resolvedBy as { fullName?: unknown })
                  .fullName === "string"
                  ? String(
                      (report.resolvedBy as { fullName?: unknown }).fullName,
                    )
                  : null,
            }
          : null,
        reportedUser: report.reportedUserId
          ? {
              _id: String(
                (report.reportedUserId as { _id?: unknown })._id ?? "",
              ),
              name:
                typeof (report.reportedUserId as { fullName?: unknown })
                  .fullName === "string"
                  ? String(
                      (report.reportedUserId as { fullName?: unknown })
                        .fullName,
                    )
                  : null,
            }
          : null,
        request: report.requestId
          ? {
              id: String((report.requestId as { _id?: unknown })._id ?? ""),
              category:
                typeof (report.requestId as { category?: unknown }).category ===
                "string"
                  ? String(
                      (report.requestId as { category?: unknown }).category,
                    )
                  : null,
              area:
                typeof (report.requestId as { area?: unknown }).area ===
                "string"
                  ? String((report.requestId as { area?: unknown }).area)
                  : null,
            }
          : null,
      })),
      source: "mongodb",
    });
  } catch (error) {
    console.error("[requests] Failed to fetch client reports", error);
    return res.status(500).json({
      message: "Failed to load reports",
    });
  }
};

export const createRequest = async (req: Request, res: Response) => {
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
  const assignedWorkerId = parsed.data.assignedWorkerId;
  let normalizedAssignedWorkerId: string | undefined;

  if (assignedWorkerId) {
    const resolvedWorkerUserId = await resolveWorkerUserId(assignedWorkerId);
    if (!resolvedWorkerUserId) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    normalizedAssignedWorkerId = resolvedWorkerUserId;
    parsed.data.assignedWorkerId = resolvedWorkerUserId;
  }

  try {
    const created = await ServiceRequest.create({
      clientUserId,
      category: parsed.data.category,
      description: parsed.data.description,
      area: parsed.data.area,
      landmark: parsed.data.landmark,
      maintenanceLevel: parsed.data.maintenanceLevel,
      hasPhotos: parsed.data.hasPhotos || parsed.data.photoUrls.length > 0,
      photoUrls: parsed.data.photoUrls,
      status: normalizedAssignedWorkerId ? "PENDING" : "SEARCHING",
        assignedWorkerId: normalizedAssignedWorkerId
        ? new Types.ObjectId(normalizedAssignedWorkerId)
        : null,
    });

    // Notify worker if assigned
    if (normalizedAssignedWorkerId) {
      const worker = await User.findById(normalizedAssignedWorkerId).select("email fullName").lean();
      if (worker?.email) {
        void sendNewRequestEmail(worker.email, worker.fullName, created.category, created.area);
      }
    }

    return res.status(201).json({
      id: String(created._id),
      status: created.status,
      request: parsed.data,
      source: "mongodb",
    });
  } catch (error) {
    console.error("[requests] Failed to persist request in MongoDB", error);
    return res.status(500).json({
      message: "Failed to persist request",
    });
  }
};

export const assignWorker = async (req: Request, res: Response) => {
  const parsed = assignWorkerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid assignment payload",
      errors: parsed.error.flatten(),
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const requestIdRaw = req.params.requestId;
  const requestId = Array.isArray(requestIdRaw)
    ? requestIdRaw[0]
    : requestIdRaw;

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

  try {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.clientUserId) !== authenticatedUserId) {
      return res
        .status(403)
        .json({ message: "Forbidden: request access denied" });
    }

    if (request.status === "IN_PROGRESS") {
      return res.status(409).json({
        message: "This request is already in progress",
      });
    }

    const resolvedWorkerUserId = await resolveWorkerUserId(
      parsed.data.workerId,
    );
    if (!resolvedWorkerUserId) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (
      request.status === "PENDING" &&
      request.assignedWorkerId &&
      String(request.assignedWorkerId) !== resolvedWorkerUserId
    ) {
      return res.status(409).json({
        message: "This request is already waiting for another worker response",
      });
    }

    const worker = await User.findById(resolvedWorkerUserId)
      .select("_id role fullName")
      .lean();
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    request.assignedWorkerId = new Types.ObjectId(resolvedWorkerUserId);
    request.status = "PENDING";
    request.lastDeclinedWorkerId = null;
    request.lastDeclinedAt = null;
    request.workerMarkedCompleteAt = null;
    request.clientConfirmedCompleteAt = null;
    await request.save();

    // Notify worker of the invitation
    if (worker.email) {
      void sendNewRequestEmail(worker.email, worker.fullName, request.category, request.area);
    }

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("clientUserId", "fullName avatar")
      .populate("assignedWorkerId", "fullName avatar")
      .populate("lastDeclinedWorkerId", "fullName avatar")
      .lean();

    if (!updatedRequest) {
      return res.status(500).json({
        message: "Failed to load updated request",
      });
    }

    return res.json({
      message: `Invitation sent to ${worker.fullName}`,
      request: mapRequestResponse(updatedRequest),
    });
  } catch (error) {
    console.error("[requests] Failed to assign worker", error);
    return res.status(500).json({
      message: "Failed to assign worker",
    });
  }
};

export const workerResponse = async (req: Request, res: Response) => {
  const parsed = workerDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid worker decision payload",
      errors: parsed.error.flatten(),
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const requestIdRaw = req.params.requestId;
  const requestId = Array.isArray(requestIdRaw)
    ? requestIdRaw[0]
    : requestIdRaw;

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

  try {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (
      !request.assignedWorkerId ||
      String(request.assignedWorkerId) !== authenticatedUserId
    ) {
      return res.status(403).json({
        message: "Forbidden: invitation access denied",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(409).json({
        message: "This invitation is no longer pending",
      });
    }

    if (parsed.data.decision === "accept") {
      request.status = "IN_PROGRESS";
      request.lastDeclinedWorkerId = null;
      request.lastDeclinedAt = null;
      request.workerMarkedCompleteAt = null;
      request.clientConfirmedCompleteAt = null;
    } else {
      request.status = "SEARCHING";
      request.lastDeclinedWorkerId = request.assignedWorkerId;
      request.lastDeclinedAt = new Date();
      request.workerMarkedCompleteAt = null;
      request.clientConfirmedCompleteAt = null;
      request.assignedWorkerId = null;
    }

    await request.save();

    // Notify client if accepted
    if (parsed.data.decision === "accept") {
      const client = await User.findById(request.clientUserId).select("email fullName").lean();
      const worker = await User.findById(request.assignedWorkerId).select("fullName").lean();
      if (client?.email && worker) {
        void sendBookingAcceptedEmail(client.email, client.fullName, worker.fullName);
      }
    }

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("clientUserId", "fullName avatar")
      .populate("assignedWorkerId", "fullName avatar")
      .populate("lastDeclinedWorkerId", "fullName avatar")
      .lean();

    if (!updatedRequest) {
      return res.status(500).json({
        message: "Failed to load updated request",
      });
    }

    return res.json({
      message:
        parsed.data.decision === "accept"
          ? "Request accepted"
          : "Request declined",
      request: mapRequestResponse(updatedRequest),
    });
  } catch (error) {
    console.error("[requests] Failed to process worker response", error);
    return res.status(500).json({
      message: "Failed to process worker response",
    });
  }
};

export const workerComplete = async (req: Request, res: Response) => {
  const parsed = completionActionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid completion payload",
      errors: parsed.error.flatten(),
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const requestIdRaw = req.params.requestId;
  const requestId = Array.isArray(requestIdRaw)
    ? requestIdRaw[0]
    : requestIdRaw;

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

  try {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (
      !request.assignedWorkerId ||
      String(request.assignedWorkerId) !== authenticatedUserId
    ) {
      return res.status(403).json({
        message: "Forbidden: request access denied",
      });
    }

    if (request.status !== "IN_PROGRESS") {
      return res.status(409).json({
        message: "Only in-progress requests can be marked complete",
      });
    }

    request.workerMarkedCompleteAt = new Date();
    await request.save();

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("clientUserId", "fullName avatar")
      .populate("assignedWorkerId", "fullName avatar")
      .populate("lastDeclinedWorkerId", "fullName avatar")
      .lean();

    if (!updatedRequest) {
      return res.status(500).json({
        message: "Failed to load updated request",
      });
    }

    return res.json({
      message: "Marked complete. Waiting for client confirmation.",
      request: mapRequestResponse(updatedRequest),
    });
  } catch (error) {
    console.error("[requests] Failed to mark request complete", error);
    return res.status(500).json({
      message: "Failed to mark request complete",
    });
  }
};

export const clientConfirmCompletion = async (req: Request, res: Response) => {
  const parsed = completionActionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid completion payload",
      errors: parsed.error.flatten(),
    });
  }

  const authenticatedUserId = (req as AuthenticatedRequest).userId;
  const requestIdRaw = req.params.requestId;
  const requestId = Array.isArray(requestIdRaw)
    ? requestIdRaw[0]
    : requestIdRaw;

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

  try {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.clientUserId) !== authenticatedUserId) {
      return res.status(403).json({
        message: "Forbidden: request access denied",
      });
    }

    if (request.status !== "IN_PROGRESS") {
      return res.status(409).json({
        message: "Only in-progress requests can be confirmed complete",
      });
    }

    if (!request.workerMarkedCompleteAt) {
      return res.status(409).json({
        message: "Worker has not marked this service as complete yet",
      });
    }

    request.clientConfirmedCompleteAt = new Date();
    request.status = "COMPLETED";
    await request.save();

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("clientUserId", "fullName avatar")
      .populate("assignedWorkerId", "fullName avatar")
      .populate("lastDeclinedWorkerId", "fullName avatar")
      .lean();

    if (!updatedRequest) {
      return res.status(500).json({
        message: "Failed to load updated request",
      });
    }

    return res.json({
      message: "Service marked as completed",
      request: mapRequestResponse(updatedRequest),
    });
  } catch (error) {
    console.error("[requests] Failed to confirm request completion", error);
    return res.status(500).json({
      message: "Failed to confirm request completion",
    });
  }
};
