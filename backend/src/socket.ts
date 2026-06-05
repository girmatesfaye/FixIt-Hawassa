import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export let io: Server;

const getAllowedOrigins = (): string[] => {
  return [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
};

export const initSocket = (server: HttpServer) => {
  const allowedOrigins = getAllowedOrigins();
  const hasExplicitAllowedOrigins = allowedOrigins.length > 0;

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          !hasExplicitAllowedOrigins ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
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
