/**
 * Feature parity tests: Add Product page (own page) vs former modal,
 * and Edit Inventory / Product Detail page behavior.
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Dashboard } from "@/pages/Dashboard";

const mockStore = {
  _id: "store-1",
  name: "Test Store",
  slug: "test-store",
  productCount: 0,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

const storesResponse = {
  status: "success",
  data: [mockStore],
  message: "",
};

const inventoryListResponse = {
  status: "success",
  data: [],
  pagination: { page: 1, limit: 12, total: 0, pages: 0 },
  message: "",
};

function renderDashboardAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/dashboard/product/:storeId/:productId"
            element={<Dashboard />} />
          <Route path="/dashboard/add-product" element={<Dashboard />} />
          <Route path="/dashboard/stores" element={<Dashboard />} />
        </Routes>
      </ErrorBoundary>
    </MemoryRouter>
  );
}

describe("Feature parity: Add Product page", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/v1/stores") && !url.includes("/api/v1/stores/")) {
        return {
          ok: true,
          json: () => Promise.resolve(storesResponse),
        } as Response;
      }
      if (url.includes("/api/v1/inventory?")) {
        return {
          ok: true,
          json: () => Promise.resolve(inventoryListResponse),
        } as Response;
      }
      return originalFetch(input);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows Add Product page at /dashboard/add-product with same form fields as former modal", async () => {
    renderDashboardAt("/dashboard/add-product");

    await screen.findByRole("heading", { name: /add product/i });
    expect(screen.getByText(/back to inventory/i)).toBeInTheDocument();

    // Form fields that were in the modal (feature parity)
    expect(screen.getByLabelText(/^SKU$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/store/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/low threshold/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /add product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("add-product page has Store dropdown with options (same as modal)", async () => {
    renderDashboardAt("/dashboard/add-product");

    await screen.findByRole("heading", { name: /add product/i });
    const storeSelect = screen.getByLabelText(/store/i);
    expect(storeSelect).toBeInTheDocument();
    const options = within(storeSelect).getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(1); // "Select store..." + at least one store
    expect(options.some((o) => o.textContent?.includes("Test Store"))).toBe(true);
  });
});

describe("Feature parity: Dashboard list and Add Product entry point", () => {
  beforeEach(() => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/v1/stores") && !url.includes("/api/v1/stores/")) {
        return {
          ok: true,
          json: () => Promise.resolve(storesResponse),
        } as Response;
      }
      if (url.includes("/api/v1/inventory?")) {
        return {
          ok: true,
          json: () => Promise.resolve(inventoryListResponse),
        } as Response;
      }
      return (globalThis as unknown as { __originalFetch?: typeof fetch }).__originalFetch?.(input) ?? { ok: false };
    }) as typeof fetch;
  });

  it("dashboard list shows + Add Product button that navigates to add-product page", async () => {
    const user = userEvent.setup();
    renderDashboardAt("/dashboard");

    await screen.findByRole("heading", { name: /inventory/i });
    const addButton = screen.getByRole("button", { name: /\+ add product/i });
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);

    await screen.findByRole("heading", { name: /add product/i });
    expect(screen.getByLabelText(/^SKU$/i)).toBeInTheDocument();
  });
});

describe("Feature parity: Edit inventory (product detail) page", () => {
  const product = {
    _id: "prod-1",
    sku: "SKU-001",
    name: "Test Product",
    category: "Electronics",
    price: 99.99,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  const inventoryItem = {
    _id: "inv-1",
    storeId: "store-1",
    productId: "prod-1",
    quantity: 10,
    lowStockThreshold: 5,
    storeName: "Test Store",
    product,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/v1/stores") && !url.includes("/api/v1/stores/")) {
        return {
          ok: true,
          json: () => Promise.resolve(storesResponse),
        } as Response;
      }
      if (url.includes("/api/v1/inventory?")) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              status: "success",
              data: [inventoryItem],
              pagination: { page: 1, limit: 25, total: 1, pages: 1 },
              message: "",
            }),
        } as Response;
      }
      if (url.includes("/api/v1/products/prod-1")) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              status: "success",
              data: product,
              message: "",
            }),
        } as Response;
      }
      return { ok: false };
    }) as typeof fetch;
  });

  it("product detail page shows Edit inventory with quantity and low stock threshold", async () => {
    renderDashboardAt("/dashboard/product/store-1/prod-1");

    await screen.findByRole("heading", { name: /test product/i });
    expect(screen.getByText(/back to inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/edit inventory/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/quantity in stock/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/low stock threshold/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
