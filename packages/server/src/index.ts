import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { requestId } from "hono/request-id";
import { connectDatabase } from "@/config";
import { errorHandler, rateLimit } from "@/middleware";
import { inventoryRoutes, storeRoutes, productRoutes } from "@/routes";

const app = new Hono();

// Security middleware
app.use("*", secureHeaders());
app.use("*", requestId());
app.use("*", timeout(30000));
app.use(
  "*",
  rateLimit({
    windowMs: parseInt(Bun.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(Bun.env.RATE_LIMIT_MAX || "120", 10),
  }),
);

// CORS: CORS_ORIGIN, or SERVICE_URL_WEB (e.g. Coolify), or localhost
const corsOrigins = Bun.env.CORS_ORIGIN
  ? Bun.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : Bun.env.SERVICE_URL_WEB
    ? [Bun.env.SERVICE_URL_WEB]
    : ["http://localhost:3000"];
app.use(
  "*",
  cors({
    origin: corsOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// Request logging (skip in dev)
if (Bun.env.NODE_ENV !== "development") {
  app.use("*", logger());
}

// Health check
app.get("/api/v1/alive", (c) =>
  c.json({ status: "success", message: "Server is running" }),
);

// API routes
app.route("/api/v1/inventory", inventoryRoutes);
app.route("/api/v1/stores", storeRoutes);
app.route("/api/v1/products", productRoutes);

// Error handling
app.notFound((c) =>
  c.json(
    { status: "error", message: `Not found: ${c.req.method} ${c.req.path}` },
    404,
  ),
);
app.onError(errorHandler);

// Validate required environment variables
function validateEnv() {
  const required = ["MONGODB_URI"];
  const missing = required.filter((key) => !Bun.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error(`   Set these in .env or as environment variables`);
    console.error(`   See .env.example for reference`);
    process.exit(1);
  }
}

// Start server
async function main() {
  validateEnv();

  const PORT = parseInt(Bun.env.PORT || "4000", 10);

  await connectDatabase();

  const server = Bun.serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  });
  console.log(`=> Server listening on 0.0.0.0:${PORT}`);

  const shutdown = () => {
    console.log("=> Shutting down...");
    server.stop();
    process.exit(0);
  };

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown();
  });

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
