import { z } from "zod";

export const storeSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  productCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productSchema = z.object({
  _id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const inventorySchema = z.object({
  _id: z.string(),
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  lowStockThreshold: z.number().default(10),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const storeProductSchema = z.object({
  _id: z.string(),
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  lowStockThreshold: z.number().default(10),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  product: productSchema,
});

export const inventoryItemSchema = storeProductSchema.extend({
  storeName: z.string(),
  storeSlug: z.string().optional(),
});

export const storeMetricsSchema = z.object({
  totalStock: z.number(),
  totalValue: z.number(),
  lowStockCount: z.number(),
  lowStockThreshold: z.number(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.string(),
    data: dataSchema,
    message: z.string(),
    responseCode: z.number().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.string(),
    data: z.array(dataSchema),
    pagination: paginationSchema,
    message: z.string(),
    responseCode: z.number().optional(),
  });

export const deleteResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const storesResponseSchema = apiResponseSchema(z.array(storeSchema));
export const storeResponseSchema = apiResponseSchema(storeSchema);
export const productsResponseSchema = apiResponseSchema(z.array(productSchema));
export const productResponseSchema = apiResponseSchema(productSchema);
export const storeMetricsResponseSchema = apiResponseSchema(storeMetricsSchema);
export const inventoryResponseSchema = apiResponseSchema(inventorySchema);
export const inventoryItemResponseSchema = apiResponseSchema(inventoryItemSchema);
export const inventoryListResponseSchema = paginatedResponseSchema(inventoryItemSchema);

export type Store = z.infer<typeof storeSchema>;
export type Product = z.infer<typeof productSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type StoreProduct = z.infer<typeof storeProductSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type StoreMetrics = z.infer<typeof storeMetricsSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type GlobalInventoryItem = InventoryItem;
