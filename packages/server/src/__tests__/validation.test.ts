import { describe, it, expect } from "bun:test";
import {
  storeCreateSchema,
  productCreateSchema,
  inventoryQuerySchema,
  inventoryUpdateSchema,
} from "@/validation/schemas";

describe("Validation Schemas", () => {
  describe("Store Schema", () => {
    it("should validate valid store data", () => {
      const result = storeCreateSchema.safeParse({
        name: "Test Store",
        slug: "test-store",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = storeCreateSchema.safeParse({
        name: "",
        slug: "test-store",
      });

      expect(result.success).toBe(false);
    });

    it("should reject name that is too long", () => {
      const result = storeCreateSchema.safeParse({
        name: "a".repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it("should trim whitespace from name", () => {
      const result = storeCreateSchema.parse({
        name: "  Test Store  ",
      });

      expect(result.name).toBe("Test Store");
    });
  });

  describe("Product Schema", () => {
    it("should validate valid product data", () => {
      const result = productCreateSchema.safeParse({
        sku: "TEST-001",
        name: "Test Product",
        category: "Electronics",
        price: 99.99,
      });

      expect(result.success).toBe(true);
    });

    it("should reject negative price", () => {
      const result = productCreateSchema.safeParse({
        sku: "TEST-001",
        name: "Test Product",
        category: "Test",
        price: -10,
      });

      expect(result.success).toBe(false);
    });

    it("should uppercase and trim SKU", () => {
      const result = productCreateSchema.parse({
        sku: "  test-sku  ",
        name: "Test Product",
        category: "Test",
        price: 10,
      });

      expect(result.sku).toBe("TEST-SKU");
    });

    it("should trim category", () => {
      const result = productCreateSchema.parse({
        sku: "TEST-001",
        name: "Test Product",
        category: "  Electronics  ",
        price: 10,
      });

      expect(result.category).toBe("Electronics");
    });
  });

  describe("Inventory Query Schema", () => {
    it("should validate valid query parameters", () => {
      const result = inventoryQuerySchema.safeParse({
        storeId: "507f1f77bcf86cd799439011",
        search: "test",
        category: "Electronics",
        minPrice: 10,
        maxPrice: 100,
        page: 1,
        limit: 25,
      });

      expect(result.success).toBe(true);
    });

    it("should coerce string numbers to numbers", () => {
      const result = inventoryQuerySchema.parse({
        minPrice: "10",
        maxPrice: "100",
        page: "2",
        limit: "10",
      });

      expect(typeof result.minPrice).toBe("number");
      expect(typeof result.maxPrice).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.limit).toBe("number");
    });

    it("should trim search string", () => {
      const result = inventoryQuerySchema.parse({
        search: "  test search  ",
      });

      expect(result.search).toBe("test search");
    });

    it("should enforce max limit", () => {
      const result = inventoryQuerySchema.parse({
        limit: 100,
      });

      expect(result.limit).toBe(25);
    });
  });

  describe("Inventory Update Schema", () => {
    it("should validate update with quantity", () => {
      const result = inventoryUpdateSchema.safeParse({
        quantity: 10,
      });

      expect(result.success).toBe(true);
    });

    it("should validate update with threshold", () => {
      const result = inventoryUpdateSchema.safeParse({
        lowStockThreshold: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should reject update with neither field", () => {
      const result = inventoryUpdateSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = inventoryUpdateSchema.safeParse({
        quantity: -5,
      });

      expect(result.success).toBe(false);
    });
  });
});
