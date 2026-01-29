import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { Hono } from "hono";
import { setupTestDatabase, teardownTestDatabase, clearCollections } from "./setup";
import { storeRoutes, productRoutes, inventoryRoutes } from "@/routes";
import { Store, Inventory, Product } from "@/models";

// Create test app
const app = new Hono();
app.route("/api/v1/stores", storeRoutes);
app.route("/api/v1/products", productRoutes);
app.route("/api/v1/inventory", inventoryRoutes);

describe("API Integration Tests", () => {
  let testStore: any;
  let testProduct: any;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearCollections();
    
    testStore = await Store.create({
      name: "Test Store",
      slug: "test-store",
    });

    testProduct = await Product.create({
      sku: "TEST-001",
      name: "Test Product",
      category: "Electronics",
      price: 99.99,
    });
  });

  describe("Stores API", () => {
    it("GET /api/v1/stores should return all stores", async () => {
      const res = await app.request("/api/v1/stores");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("POST /api/v1/stores should create a store", async () => {
      const res = await app.request("/api/v1/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Store",
          slug: "new-store",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.name).toBe("New Store");
    });

    it("GET /api/v1/stores/:id should return a store", async () => {
      const res = await app.request(`/api/v1/stores/${testStore._id}`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.name).toBe("Test Store");
    });

    it("PATCH /api/v1/stores/:id should update a store", async () => {
      const res = await app.request(`/api/v1/stores/${testStore._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Store Name",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.name).toBe("Updated Store Name");
    });

    it("DELETE /api/v1/stores/:id should soft delete a store", async () => {
      const res = await app.request(`/api/v1/stores/${testStore._id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("success");
    });
  });

  describe("Products API", () => {
    it("GET /api/v1/products should return all products", async () => {
      const res = await app.request("/api/v1/products");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("POST /api/v1/products should create a product", async () => {
      const res = await app.request("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: "NEW-001",
          name: "New Product",
          category: "Test",
          price: 49.99,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.sku).toBe("NEW-001");
    });

    it("GET /api/v1/products/:id should return a product", async () => {
      const res = await app.request(`/api/v1/products/${testProduct._id}`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.sku).toBe("TEST-001");
    });
  });

  describe("Inventory API", () => {
    beforeEach(async () => {
      await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
        lowStockThreshold: 5,
      });
    });

    it("GET /api/v1/inventory should return inventory with pagination", async () => {
      const res = await app.request("/api/v1/inventory?page=1&limit=25");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(25);
    });

    it("GET /api/v1/inventory should filter by storeId", async () => {
      const res = await app.request(`/api/v1/inventory?storeId=${testStore._id}`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.length).toBeGreaterThan(0);
    });

    it("GET /api/v1/inventory should filter by search", async () => {
      const res = await app.request("/api/v1/inventory?search=Test");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
    });

    it("GET /api/v1/inventory should filter by category", async () => {
      const res = await app.request("/api/v1/inventory?category=Electronics");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
    });

    it("GET /api/v1/inventory should filter by price range", async () => {
      const res = await app.request("/api/v1/inventory?minPrice=50&maxPrice=150");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
    });

    it("GET /api/v1/inventory should filter low stock items", async () => {
      // Create a low stock item
      const product2 = await Product.create({
        sku: "LOW-001",
        name: "Low Stock Product",
        category: "Test",
        price: 10,
      });

      await Inventory.create({
        storeId: testStore._id,
        productId: product2._id,
        quantity: 3,
        lowStockThreshold: 5,
      });

      const res = await app.request("/api/v1/inventory?lowStockOnly=true");
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
    });

    it("GET /api/v1/inventory/:id should return single inventory item", async () => {
      const inventory = await Inventory.findOne({
        storeId: testStore._id,
        productId: testProduct._id,
      });

      const res = await app.request(`/api/v1/inventory/${inventory?._id}`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data).toBeDefined();
    });
  });

  describe("Store Metrics API", () => {
    beforeEach(async () => {
      await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
        lowStockThreshold: 5,
      });
    });

    it("GET /api/v1/stores/:id/metrics should return store metrics", async () => {
      const res = await app.request(`/api/v1/stores/${testStore._id}/metrics`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.data.totalStock).toBeDefined();
      expect(data.data.totalValue).toBeDefined();
      expect(data.data.lowStockCount).toBeDefined();
    });
  });
});
