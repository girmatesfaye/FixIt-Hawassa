import { Router } from "express";
import { Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { ServiceRequest, User, WorkerProfile } from "../models";

type AuthenticatedRequest = Request & {
  userId?: string;
  userRole?: "client" | "worker" | "admin";
};

const requestsRouter = Router();

const requestDraftSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(20),
  area: z.string().min(2),
  landmark: z.string().min(2),
  maintenanceLevel: z.enum(["New", "Medium", "Old"]),
  hasPhotos: z.boolean(),
  createdAt: z.string(),
  assignedWorkerId: z.string().optional(),
});

const assignWorkerSchema = z.object({
  workerId: z.string().min(1),
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

const workerDecisionSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

const mapUserRef = (
  value: unknown,
): { _id: string; name: string | null } | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { _id?: unknown; fullName?: unknown };
  if (!record._id) {
    return null;
  }

  return {
    _id: String(record._id),
    name: typeof record.fullName === "string" ? record.fullName : null,
  };
};

const mapRequestResponse = (
  request: {
    _id: unknown;
    clientUserId: unknown;
    assignedWorkerId?: unknown;
    category: string;
    description: string;
    area: string;
    landmark: string;
    maintenanceLevel: "New" | "Medium" | "Old";
    hasPhotos: boolean;
    status: "SEARCHING" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
    createdAt: Date | string;
    updatedAt: Date | string;
  },
) => ({
  id: String(request._id),
  clientUserId: mapUserRef(request.clientUserId),
  assignedWorkerId: mapUserRef(request.assignedWorkerId),
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



  try {
    const requests = await ServiceRequest.find({
      $or: [
        { clientUserId: new Types.ObjectId(authenticatedUserId) },
        { assignedWorkerId: new Types.ObjectId(authenticatedUserId) },
      ],
    })
      .populate("clientUserId", "fullName")
      .populate("assignedWorkerId", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      total: requests.length,
      requests: requests.map(mapRequestResponse),
      source: "mongodb",
    });
  } catch (error) {
    console.error("[requests] Failed to fetch user requests", error);
    return res.status(500).json({
      message: "Failed to load requests",
    });
  }
});

requestsRouter.post("/", requireRole("client"), async (req, res) => {
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
      hasPhotos: parsed.data.hasPhotos,
      status: normalizedAssignedWorkerId ? "PENDING" : "SEARCHING",
      assignedWorkerId: normalizedAssignedWorkerId
        ? new Types.ObjectId(normalizedAssignedWorkerId)
        : null,
    });

    return res.status(201).json({
        id: String(created._id),
        status: created.status,
        request: parsed.data,
        source: "mongodb",
    });
  } catch (error) {
    console.error(
      "[requests] Failed to persist request in MongoDB",
      error,
    );
    return res.status(500).json({
      message: "Failed to persist request",
    });
  }
});

requestsRouter.patch(
  "/:requestId/assign",
  requireRole("client"),
  async (req, res) => {
    const parsed = assignWorkerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid assignment payload",
        errors: parsed.error.flatten(),
      });
    }

    const authenticatedUserId = (req as AuthenticatedRequest).userId;
    const requestIdRaw = req.params.requestId;
    const requestId = Array.isArray(requestIdRaw) ? requestIdRaw[0] : requestIdRaw;

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
        return res.status(403).json({ message: "Forbidden: request access denied" });
      }

      if (request.status === "IN_PROGRESS") {
        return res.status(409).json({
          message: "This request is already in progress",
        });
      }

      const resolvedWorkerUserId = await resolveWorkerUserId(parsed.data.workerId);
      if (!resolvedWorkerUserId) {
        return res.status(404).json({ message: "Worker not found" });
      }

      if (
        request.status === "PENDING" &&
        request.assignedWorkerId &&
        String(request.assignedWorkerId) !== resolvedWorkerUserId
      ) {
        return res.status(409).json({
          message:
            "This request is already waiting for another worker response",
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
      await request.save();

      const updatedRequest = await ServiceRequest.findById(request._id)
        .populate("clientUserId", "fullName")
        .populate("assignedWorkerId", "fullName")
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
  },
);

requestsRouter.patch(
  "/:requestId/worker-response",
  requireRole("worker"),
  async (req, res) => {
    const parsed = workerDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid worker decision payload",
        errors: parsed.error.flatten(),
      });
    }

    const authenticatedUserId = (req as AuthenticatedRequest).userId;
    const requestIdRaw = req.params.requestId;
    const requestId = Array.isArray(requestIdRaw) ? requestIdRaw[0] : requestIdRaw;

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
      } else {
        request.status = "SEARCHING";
        request.assignedWorkerId = null;
      }

      await request.save();

      const updatedRequest = await ServiceRequest.findById(request._id)
        .populate("clientUserId", "fullName")
        .populate("assignedWorkerId", "fullName")
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
  },
);

export default requestsRouter;
