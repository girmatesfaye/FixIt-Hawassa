import "dotenv/config";
import cors from "cors";
import express from "express";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import requestsRouter from "./routes/requests";
import recommendationsRouter from "./routes/recommendations";
import adminRouter from "./routes/admin";
import workersRouter from "./routes/workers";
import messagesRouter from "./routes/messages";
import uploadRouter from "./routes/upload";
import { getPublicCategories } from "./controllers/adminController";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";
import path from "path";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { initSocket } from "./socket";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);
const port = env.port;

const getAllowedOrigins = (): string[] => {
  return [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
};

// Initialize Socket.io
initSocket(httpServer);

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other domains (Cloudinary)
  }),
);

// 2. CORS - Lock down to production domains
const allowedOrigins = getAllowedOrigins();
const hasExplicitAllowedOrigins = allowedOrigins.length > 0;

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !hasExplicitAllowedOrigins ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" })); // Prevent large payload attacks

// 3. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 100 requests per windowMs
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 10 login/register attempts per hour
  message: {
    message: "Too many authentication attempts, please try again later",
  },
});

app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
app.use(globalLimiter);

app.get("/", (_req, res) => {
  res.json({ message: "FixIt backend API", docs: "/health" });
});

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/requests", requestsRouter);
app.use("/recommendations", recommendationsRouter);
app.use("/admin", adminRouter);
app.use("/workers", workersRouter);
app.get("/categories", getPublicCategories);
app.use("/messages", messagesRouter);
app.use("/upload", uploadRouter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 4. Global Error Handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const isProd = process.env.NODE_ENV === "production";
    console.error(`[Error] ${err.message}`);

    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      error: isProd ? {} : err.stack,
    });
  },
);

const bootstrap = async () => {
  await connectToDatabase();
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`FixIt backend listening on port ${port}`);
  });
};

void bootstrap();
