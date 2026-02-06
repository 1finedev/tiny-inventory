import type { Context, Next } from "hono";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "@/lib";

export function validate(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const params = c.req.param();

      let body: Record<string, unknown> = {};
      const contentType = c.req.header("content-type");
      
      if (contentType?.includes("application/json")) {
        try {
          body = (await c.req.json()) as Record<string, unknown>;
        } catch {
          /* invalid JSON → empty body */
        }
      }

      const merged = { ...query, ...params, ...body };
      const parsed = await schema.parseAsync(merged);
      c.set("validatedBody", parsed as Record<string, unknown>);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.join(".");
          return path ? `${path}: ${e.message}` : e.message;
        });
        throw new AppError(messages.join(", "), 400);
      }
      throw error;
    }
  };
}
