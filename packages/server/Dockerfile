# Multi-stage build for production
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy root dependencies
COPY package.json bun.lockb* ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/server ./packages/server
COPY packages/shared ./packages/shared

WORKDIR /app/packages/server

# Build the application
RUN bun run build

# Production runtime stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy package.json files for dependency installation
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/bun.lockb* ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy built application and shared package
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/packages/server

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:4000/api/v1/alive').then(() => process.exit(0)).catch(() => process.exit(1))"

EXPOSE 4000

ENV NODE_ENV=production

# Run the compiled output via start script
CMD ["bun", "run", "start"]
