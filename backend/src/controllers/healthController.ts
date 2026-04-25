import { Request, Response } from "express";
import { getDatabaseStatus } from "../config/db";

export const getHealth = (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "fixit-backend",
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  });
};
