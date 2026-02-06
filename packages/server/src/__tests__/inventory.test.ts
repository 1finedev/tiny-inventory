import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, clearCollections } from "./setup";
import { Store, Inventory, Product } from "@/models";

describe("Inventory API", () => {
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

  describe("Inventory Creation", () => {
    it("should create inventory item", async () => {
      const inventory = await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
        lowStockThreshold: 5,
      });

      expect(inventory).toBeDefined();
      expect(inventory.quantity).toBe(10);
      expect(inventory.lowStockThreshold).toBe(5);
    });

    it("should enforce unique store-product pair", async () => {
      await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
      });

      try {
        await Inventory.create({
          storeId: testStore._id,
          productId: testProduct._id,
          quantity: 20,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        const code = error.code ?? error.writeErrors?.[0]?.code;
        const isDuplicateKey = code === 11000 || /E11000|duplicate key/i.test(String(error.message ?? ""));
        expect(isDuplicateKey).toBe(true);
      }
    });

    it("should reject negative quantity", async () => {
      try {
        await Inventory.create({
          storeId: testStore._id,
          productId: testProduct._id,
          quantity: -5,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Inventory Update", () => {
    it("should update inventory quantity", async () => {
      const inventory = await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
      });

      const updated = await Inventory.findByIdAndUpdate(
        inventory._id,
        { quantity: 25 },
        { new: true }
      );

      expect(updated?.quantity).toBe(25);
    });

    it("should update low stock threshold", async () => {
      const inventory = await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
        lowStockThreshold: 5,
      });

      const updated = await Inventory.findByIdAndUpdate(
        inventory._id,
        { lowStockThreshold: 10 },
        { new: true }
      );

      expect(updated?.lowStockThreshold).toBe(10);
    });
  });

  describe("Low Stock Detection", () => {
    it("should identify low stock items", async () => {
      await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 3,
        lowStockThreshold: 5,
      });

      const lowStockItems = await Inventory.find({
        storeId: testStore._id,
        $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
      });

      expect(lowStockItems.length).toBeGreaterThan(0);
    });
  });

  describe("Inventory Aggregation", () => {
    it("should calculate total stock for a store", async () => {
      const product2 = await Product.create({
        sku: "TEST-002",
        name: "Product 2",
        category: "Test",
        price: 50,
      });

      await Inventory.create({
        storeId: testStore._id,
        productId: testProduct._id,
        quantity: 10,
      });

      await Inventory.create({
        storeId: testStore._id,
        productId: product2._id,
        quantity: 5,
      });

      const result = await Inventory.aggregate([
        { $match: { storeId: testStore._id } },
        { $group: { _id: null, totalStock: { $sum: "$quantity" } } },
      ]);

      expect(result[0].totalStock).toBe(15);
    });
  });
});
