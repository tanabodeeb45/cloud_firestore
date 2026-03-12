import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-wrapper";
import { validateRequest } from "../middlewares/validation.middleware";
import { authGoogleSchema, authCallbackSchema } from "../validations/schema";

const router = Router();

router.get(
  "/google", 
  authGoogleSchema, 
  validateRequest, 
  authController.googleAuth
);

router.get(
  "/google/callback", 
  authCallbackSchema, 
  validateRequest, 
  asyncHandler(authController.googleAuthCallback)
);

router.get(
  "/status", 
  asyncHandler(authController.getAuthStatus)
);

router.delete(
  "/revoke", 
  asyncHandler(authController.revokeAuth)
);

export default router;
