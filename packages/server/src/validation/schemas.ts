import { z } from "zod";
import { isObjectIdOrHexString } from "mongoose";

export const objectIdSchema = z.string().refine(isObjectIdOrHexString, "Invalid ID");

export const objectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});

export const storeIdParamSchema = z.object({
  storeId: objectIdSchema,
});

export const productIdParamSchema = z.object({
  productId: objectIdSchema,
});

export const storeCreateSchema = z.object({
  name: z.string().trim().min(1, "Store name is required").max(100, "Store name is too long"),
  slug: z.string().trim().min(1).max(50).toLowerCase().optional(),
});

export const storeUpdateSchema = storeCreateSchema.partial();

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(32, "SKU is too long").toUpperCase(),
  name: z.string().trim().min(1, "Product name is required").max(200, "Product name is too long"),
  category: z.string().trim().min(1, "Category is required").max(50, "Category is too long"),
  price: z.number().min(0, "Price cannot be negative"),
});

export const productUpdateSchema = productCreateSchema.partial();

const inventorySortOptions = ["name", "store", "category", "price-asc", "price-desc", "stock-asc", "stock-desc"] as const;

export const inventoryQuerySchema = z.object({
  storeId: z.string().trim().refine((v) => !v || isObjectIdOrHexString(v), "Invalid Store ID").optional(),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(inventorySortOptions).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(25).catch(25).default(25),
});

export const inventoryUpdateSchema = z
  .object({
    quantity: z.number().min(0, "Quantity cannot be negative").optional(),
    lowStockThreshold: z.number().min(0, "Threshold cannot be negative").optional(),
  })
  .refine((data) => data.quantity !== undefined || data.lowStockThreshold !== undefined, {
    message: "At least one field (quantity or lowStockThreshold) is required",
  });

export const inventoryUpdateParamsSchema = z.object({
  storeIdOrSlug: z.string().trim().min(1),
  productId: objectIdSchema,
});
