import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "@/lib";
import { Error as MongooseError } from "mongoose";

type MongoError = { code: number; keyValue: Record<string, unknown> };

export function errorHandler(err: unknown, c: Context) {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof MongooseError.CastError) {
    error = new AppError(`Invalid ${err.path} value "${err.value}"`, 400);
  } else if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(`Validation failed: ${messages.join(", ")}`, 400);
  } else if ((err as MongoError)?.code === 11000) {
    const field = Object.keys((err as MongoError).keyValue)[0];
    const value = (err as MongoError).keyValue[field];
    error = new AppError(`${field} "${value}" already exists`, 409);
  } else {
    const message = err instanceof Error ? err.message : "Internal server error";
    error = new AppError(message, 500);
  }

  const body: Record<string, unknown> = {
    status: error.status,
    message: error.message,
  };

  if (error.data) {
    body.error = error.data;
  }

  return c.json(body, error.statusCode as ContentfulStatusCode);
}
