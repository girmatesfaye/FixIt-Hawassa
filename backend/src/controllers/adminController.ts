import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  Category,
  Message,
  Report,
  Review,
  ServiceRequest,
  User,
  WorkerProfile,
} from "../models";

const formatDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (yearMonth: string) => {
  const [yearPart, monthPart] = yearMonth.split("-");
  const monthIndex = Number(monthPart) - 1;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${monthNames[monthIndex] ?? monthPart} ${yearPart}`;
};

type RecentActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
};

const isRecentActivityItem = (
  item: RecentActivityItem | null,
): item is RecentActivityItem => item !== null;

const buildRecentActivity = async () => {
  const [requests, reports, reviews] = await Promise.all([
    ServiceRequest.find()
      .populate("clientUserId", "fullName")
      .populate("assignedWorkerId", "fullName")
      .populate("lastDeclinedWorkerId", "fullName")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
    Report.find()
      .populate("reporterUserId", "fullName")
      .populate("reportedUserId", "fullName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Review.find()
      .populate("clientId", "fullName")
      .populate("workerId", "fullName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const activity = [
    ...requests.flatMap((request) => {
      const clientName =
        typeof request.clientUserId === "object" &&
        request.clientUserId &&
        "fullName" in request.clientUserId
          ? String(
              (request.clientUserId as { fullName?: unknown }).fullName ??
                "Client",
            )
          : "Client";
      const workerName =
        typeof request.assignedWorkerId === "object" &&
        request.assignedWorkerId &&
        "fullName" in request.assignedWorkerId
          ? String(
              (request.assignedWorkerId as { fullName?: unknown }).fullName ??
                "Worker",
            )
          : "Worker";
      const declinedWorkerName =
        typeof request.lastDeclinedWorkerId === "object" &&
        request.lastDeclinedWorkerId &&
        "fullName" in request.lastDeclinedWorkerId
          ? String(
              (request.lastDeclinedWorkerId as { fullName?: unknown })
                .fullName ?? "Worker",
            )
          : "Worker";

      return [
        {
          id: `request-created-${String(request._id)}`,
          type: "request_created",
          title: "Client submitted a request",
          description: `${clientName} requested ${request.category} in ${request.area}.`,
          timestamp: new Date(request.createdAt).toISOString(),
          actor: clientName,
        },
        request.assignedWorkerId
          ? {
              id: `request-assigned-${String(request._id)}`,
              type: "worker_assigned",
              title: "Worker assigned to request",
              description: `${clientName} assigned ${workerName} to ${request.category}.`,
              timestamp: new Date(request.updatedAt).toISOString(),
              actor: clientName,
            }
          : null,
        request.lastDeclinedWorkerId && request.lastDeclinedAt
          ? {
              id: `request-declined-${String(request._id)}`,
              type: "worker_declined",
              title: "Worker declined invitation",
              description: `${declinedWorkerName} declined the request invitation.`,
              timestamp: new Date(request.lastDeclinedAt).toISOString(),
              actor: declinedWorkerName,
            }
          : null,
        request.workerMarkedCompleteAt
          ? {
              id: `request-worker-complete-${String(request._id)}`,
              type: "worker_completed",
              title: "Worker marked request complete",
              description: `${workerName} marked ${request.category} as complete.`,
              timestamp: new Date(request.workerMarkedCompleteAt).toISOString(),
              actor: workerName,
            }
          : null,
        request.clientConfirmedCompleteAt
          ? {
              id: `request-client-confirm-${String(request._id)}`,
              type: "client_confirmed",
              title: "Client confirmed completion",
              description: `${clientName} confirmed ${request.category} was finished.`,
              timestamp: new Date(
                request.clientConfirmedCompleteAt,
              ).toISOString(),
              actor: clientName,
            }
          : null,
      ].filter(isRecentActivityItem);
    }),
    ...reports.map((report) => {
      const reporterName =
        typeof report.reporterUserId === "object" &&
        report.reporterUserId &&
        "fullName" in report.reporterUserId
          ? String(
              (report.reporterUserId as { fullName?: unknown }).fullName ??
                "Client",
            )
          : "Client";
      const reportedName =
        typeof report.reportedUserId === "object" &&
        report.reportedUserId &&
        "fullName" in report.reportedUserId
          ? String(
              (report.reportedUserId as { fullName?: unknown }).fullName ??
                "Worker",
            )
          : "Worker";

      return {
        id: `report-${String(report._id)}`,
        type: "report_created",
        title: "Client submitted a report",
        description: `${reporterName} reported ${reportedName} for ${report.type}.`,
        timestamp: new Date(report.createdAt).toISOString(),
        actor: reporterName,
      };
    }),
    ...reviews.map((review) => {
      const clientName =
        typeof review.clientId === "object" &&
        review.clientId &&
        "fullName" in review.clientId
          ? String(
              (review.clientId as { fullName?: unknown }).fullName ?? "Client",
            )
          : "Client";
      const workerName =
        typeof review.workerId === "object" &&
        review.workerId &&
        "fullName" in review.workerId
          ? String(
              (review.workerId as { fullName?: unknown }).fullName ?? "Worker",
            )
          : "Worker";

      return {
        id: `review-${String(review._id)}`,
        type: "review_created",
        title: "Client rated a worker",
        description: `${clientName} rated ${workerName} ${review.rating}/5 for request feedback.`,
        timestamp: new Date(review.createdAt).toISOString(),
        actor: clientName,
      };
    }),
  ];

  return activity
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() -
        new Date(left.timestamp).getTime(),
    )
    .slice(0, 12);
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const [users, reportCounts] = await Promise.all([
      User.find()
        .select("fullName role status phone area createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Report.aggregate([
        {
          $group: {
            _id: "$reportedUserId",
            reportCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const reportsByUser = new Map<string, number>(
      reportCounts.map((entry) => [
        String(entry._id),
        Number(entry.reportCount ?? 0),
      ]),
    );

    const normalizedUsers = users.map((user) => ({
      id: String(user._id),
      name: user.fullName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      area: user.area,
      createdAt: user.createdAt,
      reportCount: reportsByUser.get(String(user._id)) ?? 0,
    }));

    return res.json({
      total: normalizedUsers.length,
      users: normalizedUsers,
      source: "mongodb",
    });
  } catch (error) {
    console.error("[admin] Failed to fetch users from MongoDB", error);
    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

export const getReports = async (_req: Request, res: Response) => {
  try {
    const reports = await Report.find()
      .populate("reportedUserId", "fullName phone")
      .populate("reporterUserId", "fullName phone")
      .populate("resolvedBy", "fullName")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ reports });
  } catch (error) {
    console.error("[admin] Failed to fetch reports", error);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const adminUserId = (req as { userId?: string }).userId;
    const status =
      req.body.status === "pending" ||
      req.body.status === "investigating" ||
      req.body.status === "resolved" ||
      req.body.status === "dismissed"
        ? req.body.status
        : "resolved";
    const resolutionAction =
      req.body.resolutionAction === "warning" ||
      req.body.resolutionAction === "none" ||
      req.body.resolutionAction === "resolved" ||
      req.body.resolutionAction === "suspend_worker"
        ? req.body.resolutionAction
        : "warning";
    const feedback =
      typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";
    const isDangerous = Boolean(req.body.isDangerous);
    const notifyParties = Boolean(req.body.notifyParties);
    const shouldSuspendWorker =
      Boolean(req.body.suspendWorker) ||
      isDangerous ||
      resolutionAction === "suspend_worker";

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.status = status;
    report.adminFeedback = feedback;
    report.resolutionAction = resolutionAction;
    report.isDangerous = isDangerous;
    report.resolvedAt = new Date();
    report.resolvedBy =
      typeof adminUserId === "string" && Types.ObjectId.isValid(adminUserId)
        ? new Types.ObjectId(adminUserId)
        : null;
    await report.save();

    let workerSuspended = false;
    if (shouldSuspendWorker) {
      await User.findByIdAndUpdate(report.reportedUserId, {
        $set: { status: "suspended" },
      });
      await WorkerProfile.findOneAndUpdate(
        { userId: report.reportedUserId },
        { $set: { isActive: false } },
      );
      workerSuspended = true;
    }

    let notificationSent = false;
    if (notifyParties) {
      const request = await ServiceRequest.findById(report.requestId)
        .select("_id category area")
        .lean();

      if (request && typeof adminUserId === "string" && adminUserId) {
        const notificationText = [
          `Admin reviewed a ${report.type} report.`,
          `Resolution: ${status}.`,
          feedback ? `Note: ${feedback}` : null,
        ]
          .filter((part): part is string => Boolean(part))
          .join(" ");

        await Message.create({
          requestId: request._id,
          senderId: new Types.ObjectId(adminUserId),
          text: notificationText,
          isRead: false,
        });

        notificationSent = true;
      }
    }

    const populatedReport = await Report.findById(report._id)
      .populate("reportedUserId", "fullName phone")
      .populate("reporterUserId", "fullName phone")
      .populate("resolvedBy", "fullName")
      .lean();

    return res.json({
      report: populatedReport,
      workerSuspended,
      notificationSent,
    });
  } catch (error) {
    console.error("[admin] Failed to update report", error);
    return res.status(500).json({ error: "Failed to update report" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id)
      .select("fullName role status phone area isVerified createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [workerProfile, reportCount, reportedAgainstCount] =
      await Promise.all([
        user.role === "worker"
          ? WorkerProfile.findOne({ userId: user._id }).lean()
          : Promise.resolve(null),
        Report.countDocuments({ reporterUserId: user._id }),
        Report.countDocuments({ reportedUserId: user._id }),
      ]);

    return res.json({
      user: {
        id: String(user._id),
        name: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        area: user.area,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        reportCount,
        reportedAgainstCount,
        workerProfile,
      },
    });
  } catch (error) {
    console.error("[admin] Failed to fetch user detail", error);
    return res.status(500).json({ error: "Failed to fetch user detail" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const payload: {
      fullName?: string;
      phone?: string;
      area?: string;
      status?: "active" | "suspended";
    } = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (typeof payload.fullName === "string" && payload.fullName.trim()) {
      update.fullName = payload.fullName.trim();
    }
    if (typeof payload.phone === "string" && payload.phone.trim()) {
      update.phone = payload.phone.trim();
    }
    if (typeof payload.area === "string") {
      update.area = payload.area.trim();
    }
    if (payload.status === "active" || payload.status === "suspended") {
      update.status = payload.status;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    )
      .select("fullName role status phone area isVerified createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "worker") {
      await WorkerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set:
            user.status === "suspended"
              ? { isActive: false }
              : { isActive: true },
        },
      );
    }

    return res.json({
      user: {
        id: String(user._id),
        name: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        area: user.area,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[admin] Failed to update user", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const nextStatus =
      req.body?.status === "active" || req.body?.status === "suspended"
        ? req.body.status
        : null;

    if (!nextStatus) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: nextStatus } },
      { new: true },
    )
      .select("fullName role status phone area isVerified createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "worker") {
      await WorkerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set:
            nextStatus === "suspended"
              ? { isActive: false }
              : { isActive: true },
        },
      );
    }

    return res.json({
      user: {
        id: String(user._id),
        name: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        area: user.area,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[admin] Failed to update user status", error);
    return res.status(500).json({ error: "Failed to update user status" });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const [categories, workers] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      WorkerProfile.find().select("skills title").lean(),
    ]);

    const normalizedWorkers = workers.map((worker) => ({
      title: String(worker.title ?? "").toLowerCase(),
      skills: Array.isArray(worker.skills)
        ? worker.skills.map((skill) => String(skill).toLowerCase())
        : [],
    }));

    return res.json({
      categories: categories.map((category) => {
        const categoryKey = String(category.name).toLowerCase();
        const workerCount = normalizedWorkers.filter(
          (worker) =>
            worker.skills.some((skill) => skill.includes(categoryKey)) ||
            worker.title.includes(categoryKey),
        ).length;

        return {
          ...category,
          workerCount,
        };
      }),
    });
  } catch (error) {
    console.error("[admin] Failed to fetch categories", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    const category = new Category({ name, description, icon });
    await category.save();
    return res.status(201).json({ category });
  } catch (error) {
    console.error("[admin] Failed to create category", error);
    return res.status(500).json({ error: "Failed to create category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    const icon =
      typeof req.body?.icon === "string" && req.body.icon.trim()
        ? req.body.icon.trim()
        : "category";

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          description,
          icon,
        },
      },
      { new: true },
    ).lean();

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ category });
  } catch (error) {
    console.error("[admin] Failed to update category", error);
    return res.status(500).json({ error: "Failed to update category" });
  }
};

export const updateCategoryStatus = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const isActive = Boolean(req.body?.isActive);

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true },
    ).lean();

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ category });
  } catch (error) {
    console.error("[admin] Failed to update category status", error);
    return res.status(500).json({ error: "Failed to update category status" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (
      typeof req.params.id !== "string" ||
      !Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await Category.findByIdAndDelete(req.params.id).lean();

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("[admin] Failed to delete category", error);
    return res.status(500).json({ error: "Failed to delete category" });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      totalRequests,
      pendingReports,
      totalWorkers,
      requestTrend,
      userGrowth,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      ServiceRequest.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      WorkerProfile.countDocuments(),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              month: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
              role: "$role",
            },
            value: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),
      buildRecentActivity(),
    ]);

    const dayLabels = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);
      return formatDayKey(date);
    });

    const requestTrendMap = new Map<string, number>(
      requestTrend.map((entry) => [
        String(entry._id),
        Number(entry.value ?? 0),
      ]),
    );

    const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return formatMonthKey(date);
    });

    const userGrowthMap = new Map<
      string,
      { clients: number; workers: number }
    >();
    for (const month of monthlyBuckets) {
      userGrowthMap.set(month, { clients: 0, workers: 0 });
    }

    for (const entry of userGrowth as Array<{
      _id: { month: string; role: string };
      value: number;
    }>) {
      const bucket = userGrowthMap.get(entry._id.month) ?? {
        clients: 0,
        workers: 0,
      };

      if (entry._id.role === "worker") {
        bucket.workers = Number(entry.value ?? 0);
      } else if (entry._id.role === "client") {
        bucket.clients = Number(entry.value ?? 0);
      }

      userGrowthMap.set(entry._id.month, bucket);
    }

    return res.json({
      totalUsers,
      totalRequests,
      pendingReports,
      totalWorkers,
      requestTrend: dayLabels.map((day) => ({
        day,
        value: requestTrendMap.get(day) ?? 0,
      })),
      userGrowth: monthlyBuckets.map((month) => {
        const bucket = userGrowthMap.get(month) ?? { clients: 0, workers: 0 };
        return {
          month: getMonthLabel(month),
          clients: bucket.clients,
          workers: bucket.workers,
        };
      }),
      recentActivity,
    });
  } catch (error) {
    console.error("[admin] Failed to fetch stats", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};
