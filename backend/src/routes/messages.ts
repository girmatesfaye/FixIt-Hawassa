import { Router } from "express";
import {
  getMessagesByRequest,
  sendMessage,
} from "../controllers/messagesController";
import { requireAuth } from "../middleware/auth";

const messagesRouter = Router();

messagesRouter.get("/:requestId", requireAuth, getMessagesByRequest);
messagesRouter.post("/:requestId", requireAuth, sendMessage);

export default messagesRouter;
