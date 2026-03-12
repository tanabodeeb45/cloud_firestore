import { Request, Response, NextFunction } from "express";
import { handleError } from "../utils/errors";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { status, body } = handleError(err);
  res.status(status).json(body);
};
