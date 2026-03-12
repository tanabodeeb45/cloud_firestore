import { Request, Response, NextFunction } from "express";
import { getValidAccessToken } from "../services/auth.service";
import { AppError } from "../utils/errors";

export interface AuthenticatedRequest extends Request {
  blhsUserId?: string;
  accessToken?: string;
}

export const classroomAuthGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blhsUserId = req.header("X-BLHS-User-Id");

    if (!blhsUserId) {
      throw new AppError("Missing X-BLHS-User-Id header", 401);
    }

    const accessToken = await getValidAccessToken(blhsUserId);

    req.blhsUserId = blhsUserId;
    req.accessToken = accessToken;

    next();
  } catch (error: any) {
    console.error("Auth Guard Error:", error.message);
    next(
      new AppError(
        error.message || "Unauthorized or Classroom disconnected",
        401,
      ),
    );
  }
};
