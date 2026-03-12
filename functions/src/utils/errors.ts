export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any) => {
  if (err instanceof AppError) {
    return {
      status: err.statusCode,
      body: { error: err.message },
    };
  }

  // Fallback for unhandled errors
  console.error("UNHANDLED ERROR:", err);
  return {
    status: 500,
    body: { error: "Internal Server Error" },
  };
};
