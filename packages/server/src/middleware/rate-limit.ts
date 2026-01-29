import type { Context, Next } from "hono";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const getClientId = (c: Context) =>
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
  c.req.header("x-real-ip") ||
  "unknown";

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max } = options;

  return async (c: Context, next: Next) => {
    const now = Date.now();
    const key = getClientId(c);
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header("Retry-After", retryAfter.toString());
      return c.json(
        { status: "error", message: "Too many requests, please try again later." },
        429
      );
    }

    bucket.count += 1;
    await next();
  };
}
