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

const app = express();
const port = env.port;

app.use(cors());
app.use(express.json());

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

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  },
);

const bootstrap = async () => {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`FixIt backend listening on http://localhost:${port}`);
  });
};

void bootstrap();
