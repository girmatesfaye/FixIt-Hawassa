import "dotenv/config";
import cors from "cors";
import express from "express";
import healthRouter from "./src/routes/health";
import authRouter from "./src/routes/auth";
import requestsRouter from "./src/routes/requests";
import recommendationsRouter from "./src/routes/recommendations";
import adminRouter from "./src/routes/admin";
import workersRouter from "./src/routes/workers";
import messagesRouter from "./src/routes/messages";
import uploadRouter from "./src/routes/upload";
import { getPublicCategories } from "./src/controllers/adminController";
import { connectToDatabase } from "./src/config/db";
import { env } from "./src/config/env";
import path from "path";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { initSocket } from "./src/socket";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);
const port = env.port;

// Initialize Socket.io
initSocket(httpServer);

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other domains (Cloudinary)
  }),
);

// 2. CORS - Lock down to production domains
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
  httpServer.listen(port, () => {
    console.log(`FixIt backend listening on http://localhost:${port}`);
  });
};

void bootstrap();
