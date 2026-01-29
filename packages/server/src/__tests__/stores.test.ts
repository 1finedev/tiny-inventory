import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, clearCollections } from "./setup";
import { Store, Inventory, Product } from "@/models";

describe("Stores API", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe("Store Creation", () => {
    it("should create a store with valid data", async () => {
      const store = await Store.create({
        name: "Test Store",
        slug: "test-store",
      });

      expect(store).toBeDefined();
      expect(store.name).toBe("Test Store");
      expect(store.slug).toBe("test-store");
      expect(store._id).toBeDefined();
    });

    it("should auto-generate slug if not provided", async () => {
      const store = await Store.create({
        name: "Another Store",
      });

      expect(store.slug).toBeDefined();
      expect(typeof store.slug).toBe("string");
    });

    it("should reject empty name", async () => {
      try {
        await Store.create({ name: "" });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should reject name that is too long", async () => {
      const longName = "a".repeat(101);
      try {
        await Store.create({ name: longName });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Store Retrieval", () => {
    it("should retrieve all stores", async () => {
      await Store.create({ name: "Store 1" });
      await Store.create({ name: "Store 2" });

      const stores = await Store.find();
      expect(stores.length).toBe(2);
    });

    it("should retrieve store by ID", async () => {
      const store = await Store.create({ name: "Test Store" });
      const found = await Store.findOne({ _id: store._id });
      
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Store");
    });

    it("should retrieve store by slug", async () => {
      const store = await Store.create({ name: "Test Store", slug: "test-store" });
      const found = await Store.findOne({ slug: "test-store" });
      
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Store");
    });

    it("should not retrieve soft-deleted stores", async () => {
      const store = await Store.create({ name: "Test Store" });
      await Store.findByIdAndUpdate(store._id, { deletedAt: new Date() });
      
      const found = await Store.findOne({ _id: store._id });
      expect(found).toBeNull();
    });
  });

  describe("Store Update", () => {
    it("should update store name", async () => {
      const store = await Store.create({ name: "Original Name" });
      const updated = await Store.findByIdAndUpdate(
        store._id,
        { name: "Updated Name" },
        { new: true }
      );

      expect(updated?.name).toBe("Updated Name");
    });

    it("should update store slug", async () => {
      const store = await Store.create({ name: "Test Store", slug: "old-slug" });
      const updated = await Store.findByIdAndUpdate(
        store._id,
        { slug: "new-slug" },
        { new: true }
      );

      expect(updated?.slug).toBe("new-slug");
    });
  });

  describe("Store Deletion (Soft Delete)", () => {
    it("should soft delete a store", async () => {
      const store = await Store.create({ name: "Test Store" });
      await Store.findByIdAndUpdate(store._id, { deletedAt: new Date() });

      const deleted = await Store.findById(store._id).setOptions({ withDeleted: true });
      expect(deleted?.deletedAt).toBeDefined();
    });

    it("should cascade soft delete to inventory", async () => {
      const store = await Store.create({ name: "Test Store" });
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      await Inventory.create({
        storeId: store._id,
        productId: product._id,
        quantity: 10,
      });

      // Soft delete store
      await Store.findByIdAndUpdate(store._id, { deletedAt: new Date() });
      
      const inventory = await Inventory.findOne({ storeId: store._id });
      expect(inventory).toBeNull();

      const deletedInventory = await Inventory.findOne({ storeId: store._id }).setOptions({ withDeleted: true });
      expect(deletedInventory?.deletedAt).toBeDefined();
    });
  });
});
