import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, clearCollections } from "./setup";
import { Product } from "@/models";

describe("Products API", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe("Product Creation", () => {
    it("should create a product with valid data", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Electronics",
        price: 99.99,
      });

      expect(product).toBeDefined();
      expect(product.sku).toBe("TEST-001");
      expect(product.name).toBe("Test Product");
      expect(product.category).toBe("Electronics");
      expect(product.price).toBe(99.99);
    });

    it("should enforce unique SKU", async () => {
      await Product.create({
        sku: "DUPLICATE-001",
        name: "First Product",
        category: "Test",
        price: 10,
      });

      try {
        await Product.create({
          sku: "DUPLICATE-001",
          name: "Second Product",
          category: "Test",
          price: 20,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        const code = error.code ?? error.writeErrors?.[0]?.code;
        const isDuplicateKey = code === 11000 || /E11000|duplicate key/i.test(String(error.message ?? ""));
        expect(isDuplicateKey).toBe(true);
      }
    });

    it("should reject negative price", async () => {
      try {
        await Product.create({
          sku: "TEST-002",
          name: "Test Product",
          category: "Test",
          price: -10,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should reject empty SKU", async () => {
      try {
        await Product.create({
          sku: "",
          name: "Test Product",
          category: "Test",
          price: 10,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should trim and uppercase SKU", async () => {
      const product = await Product.create({
        sku: "  test-sku  ",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      expect(product.sku).toBe("TEST-SKU");
    });
  });

  describe("Product Retrieval", () => {
    it("should retrieve all products", async () => {
      await Product.create({
        sku: "PROD-001",
        name: "Product 1",
        category: "Test",
        price: 10,
      });
      await Product.create({
        sku: "PROD-002",
        name: "Product 2",
        category: "Test",
        price: 20,
      });

      const products = await Product.find();
      expect(products.length).toBe(2);
    });

    it("should retrieve product by ID", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      const found = await Product.findOne({ _id: product._id });
      expect(found).toBeDefined();
      expect(found?.sku).toBe("TEST-001");
    });

    it("should not retrieve soft-deleted products", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      await Product.findByIdAndUpdate(product._id, { deletedAt: new Date() });
      const found = await Product.findOne({ _id: product._id });
      expect(found).toBeNull();
    });
  });

  describe("Product Update", () => {
    it("should update product name", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Original Name",
        category: "Test",
        price: 10,
      });

      const updated = await Product.findByIdAndUpdate(
        product._id,
        { name: "Updated Name" },
        { new: true }
      );

      expect(updated?.name).toBe("Updated Name");
    });

    it("should update product price", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      const updated = await Product.findByIdAndUpdate(
        product._id,
        { price: 25.99 },
        { new: true }
      );

      expect(updated?.price).toBe(25.99);
    });
  });

  describe("Product Deletion (Soft Delete)", () => {
    it("should soft delete a product", async () => {
      const product = await Product.create({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      await Product.findByIdAndUpdate(product._id, { deletedAt: new Date() });
      const deleted = await Product.findById(product._id).setOptions({ withDeleted: true });
      
      expect(deleted?.deletedAt).toBeDefined();
    });
  });
});
