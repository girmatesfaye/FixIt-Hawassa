/// <reference types="jest" />

import request from "supertest";
import express from "express";
import healthRouter from "../routes/health";

const app = express();
app.use("/health", healthRouter);

describe("GET /health", () => {
  it("should return health metadata", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("fixit-backend");
    expect(typeof res.body.timestamp).toBe("string");
    expect(typeof res.body.database.connected).toBe("boolean");
    expect(res.body.database.mode).toMatch(/mongodb|mock/);
    expect(res.body.database.provider).toBe("mongodb");
  });
});
