import type { Context } from "hono";
import { success, paginated } from "@/lib";
import { inventoryService } from "@/services";

export async function getAllInventory(c: Context) {
  const query = c.req.query();
  const storeId = query.storeId?.trim();
  const search = query.search?.trim();
  const category = query.category?.trim();
  const minPrice = query.minPrice ? parseFloat(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : undefined;
  const lowStockOnly = query.lowStockOnly === "true";
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(Math.max(1, parseInt(query.limit || "25", 10)), 25);

  const result = await inventoryService.getAllInventory({
    storeId,
    search,
    category,
    minPrice,
    maxPrice,
    lowStockOnly,
    page,
    limit,
  });

  return paginated(c, result.data, { page: result.page, limit: result.limit, total: result.total }, "Inventory fetched");
}

export async function getInventoryItem(c: Context) {
  const { id } = c.req.param();
  const item = await inventoryService.getInventoryItem(id);
  return success(c, item, "Inventory item fetched");
}

export async function getStoreMetrics(c: Context) {
  const { storeIdOrSlug } = c.req.param();
  const metrics = await inventoryService.getStoreMetrics(storeIdOrSlug);
  return success(c, metrics, "Store metrics fetched");
}

export async function updateInventory(c: Context) {
  const { storeIdOrSlug, productId } = c.req.param();
  const body = await c.req.json();
  const inventory = await inventoryService.updateInventory(storeIdOrSlug, productId, body);
  return success(c, inventory, "Inventory updated");
}
