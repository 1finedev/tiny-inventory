import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function success<T>(c: Context, data: T, message: string, status: ContentfulStatusCode = 200) {
  return c.json({ status: "success", data, message }, status);
}

export function paginated<T>(
  c: Context,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message: string
) {
  return c.json({
    status: "success",
    data,
    pagination: {
      ...pagination,
      pages: Math.ceil(pagination.total / pagination.limit) || 1,
    },
    message,
  });
}

export function deleted(c: Context, message: string) {
  return c.json({ status: "success", message });
}
