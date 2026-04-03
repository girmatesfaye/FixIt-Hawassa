import { Router, Request } from "express";
import { Message, ServiceRequest } from "../models";
import { requireAuth } from "../middleware/auth";

type AuthenticatedRequest = Request & { userId?: string };

const messagesRouter = Router();

// Get messages for a service request
messagesRouter.get("/:requestId", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = (req as AuthenticatedRequest).userId;

    // Check if user is part of the service request
    const request = await ServiceRequest.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    if (String(request.clientUserId) !== userId && String(request.assignedWorkerId) !== userId) {
       return res.status(403).json({ error: "Forbidden: You are not part of this request" });
    }

    const messages = await Message.find({ requestId }).sort({ createdAt: 1 }).lean();
    return res.json({ messages });
  } catch (error) {
    console.error("[messages] Failed to fetch messages", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
messagesRouter.post("/:requestId", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = (req as AuthenticatedRequest).userId;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const request = await ServiceRequest.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    if (String(request.clientUserId) !== userId && String(request.assignedWorkerId) !== userId) {
       return res.status(403).json({ error: "Forbidden: You are not part of this request" });
    }

    const newMessage = new Message({
      requestId,
      senderId: userId,
      text
    });
    await newMessage.save();

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("[messages] Failed to send message", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default messagesRouter;
