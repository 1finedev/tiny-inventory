export class AppError extends Error {
  readonly statusCode: number;
  readonly status: string;
  readonly data?: unknown;

  constructor(message: string, statusCode = 400, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? "error" : "fail";
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}
