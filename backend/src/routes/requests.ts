import { Router } from "express";
import {
  assignWorker,
  clientConfirmCompletion,
  createRequest,
  getMyReports,
  getMyRequests,
  workerComplete,
  workerResponse,
  withdrawInvitation,
} from "../controllers/requestsController";
import { getCategories } from "../controllers/adminController";
import { requireAuth, requireRole } from "../middleware/auth";

const requestsRouter = Router();

requestsRouter.get("/categories", getCategories);
requestsRouter.get("/mine", requireAuth, getMyRequests);
requestsRouter.get("/reports", requireAuth, getMyReports);
requestsRouter.post("/", requireRole("client"), createRequest);
requestsRouter.patch("/:requestId/assign", requireRole("client"), assignWorker);
requestsRouter.patch("/:requestId/withdraw", requireRole("client"), withdrawInvitation);
requestsRouter.patch(
  "/:requestId/worker-response",
  requireRole("worker"),
  workerResponse,
);
requestsRouter.patch(
  "/:requestId/worker-complete",
  requireRole("worker"),
  workerComplete,
);
requestsRouter.patch(
  "/:requestId/client-confirm-completion",
  requireRole("client"),
  clientConfirmCompletion,
);

export default requestsRouter;
