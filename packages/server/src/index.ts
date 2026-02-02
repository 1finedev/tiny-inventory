import { join } from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { requestId } from "hono/request-id";
import { connectDatabase, seedDatabase } from "@/config";
import { errorHandler, rateLimit } from "@/middleware";
import { inventoryRoutes, storeRoutes, productRoutes } from "@/routes";

// Load root .env when running via turbo (cwd is packages/server)
const rootEnv = join(process.cwd(), "../../.env");
try {
  const text = await Bun.file(rootEnv).text();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !(key in process.env)) process.env[key] = value;
      }
    }
  }
} catch {
  // no root .env or not running from monorepo
}

const app = new Hono();

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

if (Bun.env.NODE_ENV !== "development") {
  app.use("*", logger());
}

app.get("/api/v1/alive", (c) =>
  c.json({ status: "success", message: "Server is running" }),
);

app.route("/api/v1/inventory", inventoryRoutes);
app.route("/api/v1/stores", storeRoutes);
app.route("/api/v1/products", productRoutes);

app.notFound((c) =>
  c.json(
    { status: "error", message: `Not found: ${c.req.method} ${c.req.path}` },
    404,
  ),
);
app.onError(errorHandler);

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

async function main() {
  validateEnv();

  const PORT = parseInt(Bun.env.PORT || "4000", 10);

  await connectDatabase();
  await seedDatabase();

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
