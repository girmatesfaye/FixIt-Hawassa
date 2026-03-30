import { Router } from "express";
import { getDatabaseStatus } from "../config/db";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "fixit-backend",
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  });
});

export default healthRouter;
