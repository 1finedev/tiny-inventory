# Tiny Inventory

A full-stack inventory management system for tracking stores and their products across a global network. Built with TypeScript, React, Hono, and MongoDB.

## Quick Start

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000  
- **Backend**: http://localhost:4000/api/v1/alive (liveness only; no DB ping to avoid abuse)


Seed data loads automatically. **25 stores across 6 continents** (NYC, Tokyo, London, São Paulo, Lagos, Sydney...), **86 products** across 8 categories, and drastic store variety (flagship with all 86 products and empty new store with 0).

---

## Features

### Dashboard
- View all inventory across stores or filter by individual store
- **Unified search** across SKU, product name, category, and store name (one search box, multiple fields)
- Sort by name, price, stock level, or category
- Infinite scroll with IntersectionObserver
- **Filtering:** The API supports filtering by category, price range (`minPrice`/`maxPrice`), and low-stock-only; the current UI exposes search, store filter, and sort. Use the API directly for category/price/low-stock filters (e.g. `GET /api/v1/inventory?category=Electronics&lowStockOnly=true`).

### Store Management
- Create, edit, and delete stores
- Stores sorted by product count (busiest stores first)
- Real-time product counts per store

### Product Management  
- Add products with **SKU**, name, category, and price
- Unique SKU per product (auto-uppercase, indexed for fast lookups)
- Assign products to stores with quantity and low stock threshold
- Edit product details and inventory levels inline
- Visual low stock indicators (red/yellow/green badges)

### Metrics (Non-trivial Operation)
- Per-store aggregations: total stock, total value, low stock count
- Computed via MongoDB aggregation pipeline in single query

**List view:** Dashboard (`/dashboard`) — filter by store, search, sort; infinite scroll. **Detail/edit view:** Product detail (`/dashboard/product/:storeId/:productId`) — same layout and styling, edit quantity and low-stock threshold.

---

## Frontend Highlights

| Feature | Implementation |
|---------|----------------|
| **Infinite scroll** | IntersectionObserver triggers loading when sentinel enters viewport. 100px rootMargin for smooth pre-fetching. Appends data, never replaces. |
| **URL-driven state** | Filters and store selection sync to URL. Every view is bookmarkable and shareable. Browser back/forward works. |
| **Debounced search** | 300ms debounce prevents API spam. Searches SKU, name, category, store in one query. Resets scroll on new search. |
| **Derived state** | Total product count computed from store data, zero extra API calls. |
| **Loading states** | Initial load vs. load-more states. Subtle spinner at bottom during infinite scroll. |
| **Error boundaries** | Graceful error handling with recovery options. |
| **Responsive design** | Collapsible sidebar, mobile-friendly layout. |

---

## API Sketch

- **Stores** — `GET/POST/PATCH/DELETE /api/v1/stores`, `GET /api/v1/stores/:id`, `GET /api/v1/stores/:id/metrics`, `PATCH /api/v1/stores/:id/inventory/:productId`
- **Products** — `GET/POST/PATCH/DELETE /api/v1/products`, `GET /api/v1/products/:id`
- **Inventory** — `GET /api/v1/inventory` (filterable: storeId, search, category, minPrice, maxPrice, lowStockOnly; pagination: page, limit max 25), `GET /api/v1/inventory/:id`

---

## Decisions & Trade-offs

### Architecture

| Decision | Rationale |
|----------|-----------|
| **Hono + Bun** | Lightweight HTTP framework with excellent TypeScript support. Faster cold starts than Express, simpler API. Hono's `onError` catches all async errors automatically. No `catchAsync` wrappers needed. |
| **MongoDB** | We chose a document store because we expect production needs (aggregation-heavy analytics, flexible schema evolution, single-query metrics/search/pagination) to align better with this model. Store/product/inventory fit naturally as documents; the non-trivial operation (per-store metrics) is one aggregation in the service layer. Text index + `$lookup`/`$facet` keep list, search, and pagination in one place. |
| **Monorepo (Turborepo)** | Shared types between frontend and backend. Single `bun run dev` starts everything. |
| **Server and web under `packages/`** | Turborepo monorepo: shared types and single `bun run dev`. Docker still builds each app from its own Dockerfile; the deliverable's server/web are present as `packages/server` and `packages/web`. |
| **Service layer** | Controllers parse request and format response; business logic (DB, aggregations) lives in services. |
| **Zod schemas in shared package** | Single source of truth for validation. Backend validates requests, frontend validates responses. Full type safety across the stack. |

### Data Modeling

| Decision | Rationale |
|----------|-----------|
| **Inventory as junction collection** | Stores and Products are independent. Inventory tracks quantity per store-product pair. Enables efficient queries and avoids unbounded arrays. |
| **Indexes on foreign keys** | `storeId`, `productId`, `deletedAt` indexed for fast lookups and aggregation joins. |
| **SKU with unique index** | Products have unique SKU (uppercase). Indexed for O(1) lookup. Text index on `sku + name + category` for search. |
| **toJSON transforms** | Mongoose models auto-serialize `_id` to string and dates to ISO format. No manual transformation in controllers. |

### API Design

| Decision | Rationale |
|----------|-----------|
| **Consolidated inventory endpoint** | Single `/inventory` with query filters instead of nested `/stores/:id/products`. Inspired by Stripe/Shopify APIs. Flatter, easier to cache, simpler client code. |
| **Store-scoped actions remain nested** | Metrics and inventory updates stay under `/stores/:id/...` because they're inherently store-specific operations. |
| **$facet for pagination** | Single aggregation returns both total count and paginated data. Avoids two database round-trips. |
| **Aggregation for store counts** | `GET /stores` returns `productCount` via `$lookup` + `$group` (count), avoiding large inventory arrays. Frontend derives total from this no extra API calls. |

### Data Integrity

| Decision | Rationale |
|----------|-----------|
| **Soft deletes** | All models have `deletedAt` timestamp. Deletes set this field rather than removing records. Preserves referential integrity and enables audit trails/recovery. |
| **Cascade soft delete** | Deleting a store/product soft-deletes associated inventory in the same transaction. No orphaned references. |
| **Filtered by default** | All queries filter out `deletedAt != null` records. Deleted data invisible to users but preserved in DB. |

### Error Handling

| Decision | Rationale |
|----------|-----------|
| **Centralized error handler** | Single `onError` middleware transforms all errors to consistent JSON responses. |
| **AppError class** | Custom error class with `statusCode`, `status`, and optional `data`. Controllers throw, middleware catches. |
| **Mongoose error mapping** | `CastError` → 400, `ValidationError` → 400, duplicate key → 409. Clear, actionable messages. |
| **No catchAsync needed** | Hono automatically catches async errors and routes them to `onError`. Clean controller code. |

### Performance

| Decision | Rationale |
|----------|-----------|
| **Max 25 items per page** | Prevents unbounded responses. Frontend handles via pagination. |
| **Lean queries** | `.lean()` on read operations returns plain objects, bypassing Mongoose document overhead. |
| **Reusable pipeline helpers** | Aggregation pipelines extracted to `lib/pipelines.ts`. DRY, testable, consistent. |
| **No Redis** | MongoDB indexes handle current query patterns efficiently. Would add caching layer if read latency becomes an issue at scale. |
| **Rate limiting (in-memory)** | Per-process in-memory store; fine for single instance. For multi-instance production, use a shared store (e.g. Redis) so limits are global. |
| **Inventory search pre-filter** | Search resolves product/store IDs first, then filters inventory by IDs before aggregation to avoid regex scans on joined fields. |

### Search Trade-offs

| Decision | Rationale |
|----------|-----------|
| **Text index for products** | Faster than regex on joined fields; uses `Product` text index for name/category + exact SKU match. Trade-off: token-based search, not arbitrary substring matches. if we were in prod, we could have a search layer  like OpenSearch or Typsense or Atlas |
| **Early empty result** | If no matching product/store IDs are found, API returns empty results without running the aggregation pipeline. |


## Testing Approach

**Test suite in place for critical paths.** Backend and frontend tests cover core functionality.

### Backend Tests (Bun Test Runner)
- **Stores, Products, Inventory**: Unit tests for model validation and basic CRUD  
- **Validation**: Zod schema tests for request validation  
- **API Integration**: Full endpoint tests with Hono test utilities  

**Run tests:**
```bash
cd packages/server && bun test
```

### Frontend Tests  
- **Components**: Button, ErrorBoundary (basic rendering tests)
- **Utilities**: Helper function tests  

**Run tests:**
```bash
cd packages/web && bun test
```

### Coverage Notes  
- Core business logic tested (inventory updates, product creation, soft deletes)
- UI component tests exist but not exhaustive (no E2E, no hook integration tests)
- **Not included**: Rate limiting tests, complex aggregation pipeline validation, infinite scroll edge cases, API error scenarios in all modals

---

## If I Had More Time

- **E2E tests** — Playwright/Cypress for critical flows: create store → add product → update inventory (currently untested at the browser level).
- **Error recovery UI** — Retry buttons for failed API calls, clearer error messages, snackbar/toast separate from modal errors.
- **Aggregation pipeline tests** — Unit tests for `$facet`/`$group` metrics; Redis cache for `/stores` with invalidation on mutations.

---

## Project Structure

```
packages/
├── server/              # Hono + Bun + MongoDB
│   └── src/
│       ├── config/      # Database, seeding
│       ├── controllers/ # Request handlers (thin: parse request, call service, send response)
│       ├── lib/         # Errors, responses, pipelines
│       ├── services/    # Business logic (inventory, products, stores)
│       ├── middleware/  # Validation, error handling
│       ├── models/      # Mongoose schemas with indexes
│       ├── routes/      # Route definitions
│       └── validation/  # Zod request schemas
├── web/                 # React + Vite + TypeScript
│   └── src/
│       ├── components/  # Reusable UI (Button, Card, Table, etc.)
│       ├── hooks/       # useDebounce
│       ├── lib/         # API client, utilities
│       └── pages/       # Dashboard (list), DashboardProductDetail (detail/edit)
└── shared/              # Zod schemas, TypeScript types
```

---

## Local Development

```bash
# Prerequisites: Bun, Docker

bun install                    # Install dependencies
docker compose up mongodb -d  # Start MongoDB
bun run dev                    # Start server + web (Turborepo)
```

**Without Docker**:
```bash
# Ensure MongoDB running on localhost:27017 (or start only mongodb: docker compose up mongodb -d)
# Copy .env.example to .env at repo root; server loads root .env when running bun run dev
bun run dev
```
**Environment Variables**: Copy `.env.example` to `.env` at the repo root and configure as needed. The server loads this file when started via `bun run dev`. **Seed data** runs only when `NODE_ENV !== "production"` or when `RUN_SEED=true`; in production the database is not auto-seeded.

**Production Build**:
```bash
docker compose -f docker-compose.yml build
```
---