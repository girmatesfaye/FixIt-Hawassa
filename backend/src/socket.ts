import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        process.env.FRONTEND_URL || "",
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on("join_room", (requestId: string) => {
      socket.join(requestId);
      console.log(`[Socket] User ${socket.id} joined room: ${requestId}`);
    });

    socket.on("leave_room", (requestId: string) => {
      socket.leave(requestId);
      console.log(`[Socket] User ${socket.id} left room: ${requestId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};
