import {
  storesResponseSchema,
  storeResponseSchema,
  productsResponseSchema,
  productResponseSchema,
  storeMetricsResponseSchema,
  inventoryResponseSchema,
  inventoryItemResponseSchema,
  inventoryListResponseSchema,
  deleteResponseSchema,
  type Store,
  type Product,
  type StoreMetrics,
  type Inventory,
  type InventoryItem,
} from "@tiny-inventory/shared";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

async function fetchWithValidation<T>(
  url: string,
  schema: { parse: (data: unknown) => T },
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return schema.parse(data);
}

// --- Stores ---

export async function storesList(): Promise<Store[]> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores`,
    storesResponseSchema
  );
  return response.data;
}

export async function storesGet(id: string): Promise<Store> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores/${id}`,
    storeResponseSchema
  );
  return response.data;
}

export async function storesCreate(data: {
  name: string;
  slug?: string;
}): Promise<Store> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores`,
    storeResponseSchema,
    { method: "POST", body: JSON.stringify(data) }
  );
  return response.data;
}

export async function storesUpdate(
  id: string,
  data: Partial<{ name: string; slug?: string }>
): Promise<Store> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores/${id}`,
    storeResponseSchema,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return response.data;
}

export async function storesDelete(id: string): Promise<void> {
  await fetchWithValidation(`${API_BASE}/stores/${id}`, deleteResponseSchema, {
    method: "DELETE",
  });
}

// --- Products ---

export async function productsList(): Promise<Product[]> {
  const response = await fetchWithValidation(
    `${API_BASE}/products`,
    productsResponseSchema
  );
  return response.data;
}

export async function productsGet(id: string): Promise<Product> {
  const response = await fetchWithValidation(
    `${API_BASE}/products/${id}`,
    productResponseSchema
  );
  return response.data;
}

export async function productsCreate(data: {
  sku: string;
  name: string;
  category: string;
  price: number;
}): Promise<Product> {
  const response = await fetchWithValidation(
    `${API_BASE}/products`,
    productResponseSchema,
    { method: "POST", body: JSON.stringify(data) }
  );
  return response.data;
}

export async function productsUpdate(
  id: string,
  data: Partial<{ sku: string; name: string; category: string; price: number }>
): Promise<Product> {
  const response = await fetchWithValidation(
    `${API_BASE}/products/${id}`,
    productResponseSchema,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return response.data;
}

export async function productsDelete(id: string): Promise<void> {
  await fetchWithValidation(`${API_BASE}/products/${id}`, deleteResponseSchema, {
    method: "DELETE",
  });
}

// --- Inventory ---

export type InventoryListParams = {
  storeId?: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStockOnly?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function inventoryList(
  params?: InventoryListParams
): Promise<{
  data: InventoryItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.storeId) searchParams.set("storeId", params.storeId);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.minPrice !== undefined)
    searchParams.set("minPrice", params.minPrice.toString());
  if (params?.maxPrice !== undefined)
    searchParams.set("maxPrice", params.maxPrice.toString());
  if (params?.lowStockOnly) searchParams.set("lowStockOnly", "true");
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetchWithValidation(
    `${API_BASE}/inventory?${searchParams.toString()}`,
    inventoryListResponseSchema
  );
  return { data: response.data, pagination: response.pagination };
}

export async function inventoryGet(id: string): Promise<InventoryItem> {
  const response = await fetchWithValidation(
    `${API_BASE}/inventory/${id}`,
    inventoryItemResponseSchema
  );
  return response.data;
}

export async function inventoryGetMetrics(storeId: string): Promise<StoreMetrics> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores/${storeId}/metrics`,
    storeMetricsResponseSchema
  );
  return response.data;
}

export async function inventoryUpdate(
  storeId: string,
  productId: string,
  data: { quantity?: number; lowStockThreshold?: number }
): Promise<Inventory> {
  const response = await fetchWithValidation(
    `${API_BASE}/stores/${storeId}/inventory/${productId}`,
    inventoryResponseSchema,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return response.data;
}

export async function inventoryRemoveFromStore(
  storeId: string,
  productId: string
): Promise<void> {
  await fetchWithValidation(
    `${API_BASE}/stores/${storeId}/inventory/${productId}`,
    deleteResponseSchema,
    { method: "DELETE" }
  );
}

// Grouped API object for backward-compatible imports (api.stores.list(), etc.)
export const api = {
  stores: {
    list: storesList,
    get: storesGet,
    create: storesCreate,
    update: storesUpdate,
    delete: storesDelete,
  },
  products: {
    list: productsList,
    get: productsGet,
    create: productsCreate,
    update: productsUpdate,
    delete: productsDelete,
  },
  inventory: {
    list: inventoryList,
    get: inventoryGet,
    getMetrics: inventoryGetMetrics,
    update: inventoryUpdate,
    removeFromStore: inventoryRemoveFromStore,
  },
};
