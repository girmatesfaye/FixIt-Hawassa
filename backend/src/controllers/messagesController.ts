import { Request, Response } from "express";
import { Message, ServiceRequest } from "../models";
import { io } from "../socket";

type AuthenticatedRequest = Request & { userId?: string };

export const getMessagesByRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = (req as AuthenticatedRequest).userId;

    const request = await ServiceRequest.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }

    if (
      String(request.clientUserId) !== userId &&
      String(request.assignedWorkerId) !== userId
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not part of this request" });
    }

    if (request.status !== "IN_PROGRESS" && request.status !== "COMPLETED") {
      return res.status(403).json({ 
        error: "Forbidden: Chat is only available for accepted or completed requests" 
      });
    }

    const messages = await Message.find({ requestId })
      .populate("senderId", "fullName role")
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ messages });
  } catch (error) {
    console.error("[messages] Failed to fetch messages", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
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

    if (
      String(request.clientUserId) !== userId &&
      String(request.assignedWorkerId) !== userId
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not part of this request" });
    }

    if (request.status !== "IN_PROGRESS" && request.status !== "COMPLETED") {
      return res.status(403).json({ 
        error: "Forbidden: Chat is only available for accepted or completed requests" 
      });
    }

    const newMessage = new Message({
      requestId,
      senderId: userId,
      text,
    });
    await newMessage.save();

    // Populate sender info for the socket event
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName role")
      .lean();

    if (io) {
      io.to(requestId).emit("new_message", populatedMessage);
    }

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("[messages] Failed to send message", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};
