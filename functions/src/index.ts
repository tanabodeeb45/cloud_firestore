import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import teacherRoutes from "./routes/teacher.routes";
import studentRoutes from "./routes/student.routes";
import internalRoutes from "./routes/internal.routes";
import { HealthStatus } from "./types/enums";
import { globalErrorHandler } from "./middlewares/error.middleware";

if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/v1/health/ready", (req, res) => {
  res
    .status(200)
    .json({ status: HealthStatus.OK, service: "blhs-classroom-function" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/teacher", teacherRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/internal", internalRoutes);

// Global Error Handler must be the last middleware
app.use(globalErrorHandler);

export const api = onRequest(
  {
    region: "asia-southeast1",
    memory: "512MiB",
    concurrency: 80,
  },
  app,
);
