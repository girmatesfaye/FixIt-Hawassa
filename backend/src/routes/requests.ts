import { Router } from "express";
import {
  assignWorker,
  clientConfirmCompletion,
  createRequest,
  getMyRequests,
  workerComplete,
  workerResponse,
} from "../controllers/requestsController";
import { requireAuth, requireRole } from "../middleware/auth";

const requestsRouter = Router();

requestsRouter.get("/mine", requireAuth, getMyRequests);
requestsRouter.post("/", requireRole("client"), createRequest);
requestsRouter.patch("/:requestId/assign", requireRole("client"), assignWorker);
requestsRouter.patch("/:requestId/worker-response", requireRole("worker"), workerResponse);
requestsRouter.patch("/:requestId/worker-complete", requireRole("worker"), workerComplete);
requestsRouter.patch(
  "/:requestId/client-confirm-completion",
  requireRole("client"),
  clientConfirmCompletion,
);

export default requestsRouter;
