import { Router, Request, Response, NextFunction } from "express";
import * as internalController from "../controllers/internal.controller";
import { asyncHandler } from "../utils/async-wrapper";
import { AppError } from "../utils/errors";
import { validateRequest } from "../middlewares/validation.middleware";
import { internalStudentContentSchema } from "../validations/schema";

const router = Router();

const apiKeyGuard = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header("X-API-Key");
  const validKey = process.env.INTERNAL_API_KEY || "mock-secret-key-for-dev";

  if (!apiKey || apiKey !== validKey) {
    throw new AppError("Forbidden: Invalid API Key", 403);
  }
  next();
};

router.get(
  "/student-content/:userId",
  apiKeyGuard,
  internalStudentContentSchema,
  validateRequest,
  asyncHandler(internalController.getStudentContent)
);

export default router;
