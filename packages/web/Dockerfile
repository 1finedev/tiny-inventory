FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lockb* ./

# Copy workspace package.json files
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY packages/web ./packages/web
COPY packages/shared ./packages/shared

# Build the web app
WORKDIR /app/packages/web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Production image
FROM oven/bun:1-alpine

WORKDIR /app

# Install serve to run the production build
RUN bun add -g serve

# Copy built assets from builder stage
COPY --from=builder /app/packages/web/dist ./dist

# Copy package.json for reference
COPY --from=builder /app/packages/web/package.json ./package.json

EXPOSE 3000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
