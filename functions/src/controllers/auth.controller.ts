import { Request, Response } from "express";
import {
  getAuthUrl,
  handleCallback,
  checkAuthStatus,
  revokeTokens,
} from "../services/auth.service";
import { AuthQueryDTO, AuthCallbackQueryDTO } from "../types/dtos";
import { AppError } from "../utils/errors";

export const googleAuth = (req: Request, res: Response) => {
  const { role, blhs_user_id: blhsUserId } =
    req.query as unknown as AuthQueryDTO;

  if (!role || !blhsUserId) {
    throw new AppError(
      "Missing 'role' or 'blhs_user_id' in query parameters",
      400,
    );
  }

  const url = getAuthUrl(role, blhsUserId);
  res.redirect(url);
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query as unknown as AuthCallbackQueryDTO;

  if (!code || !state) {
    throw new AppError("Invalid callback request", 400);
  }

  await handleCallback(code, state);
  const frontendUrl = process.env.FRONTEND_URL;
  res.redirect(`${frontendUrl}?auth=success`);
};

export const getAuthStatus = async (req: Request, res: Response) => {
  const blhsUserId = req.header("X-BLHS-User-Id");
  if (!blhsUserId) {
    throw new AppError("Missing X-BLHS-User-Id header", 401);
  }
  const status = await checkAuthStatus(blhsUserId);
  res.status(200).json(status);
};

export const revokeAuth = async (req: Request, res: Response) => {
  const blhsUserId = req.header("X-BLHS-User-Id");
  if (!blhsUserId) {
    throw new AppError("Missing X-BLHS-User-Id header", 401);
  }
  await revokeTokens(blhsUserId);
  res
    .status(200)
    .json({ message: "Successfully revoked tokens and disconnected" });
};
