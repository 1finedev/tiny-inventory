import type { Context } from "hono";
import { success, paginated, deleted } from "@/lib";
import { inventoryService } from "@/services";
import type { z } from "zod";
import type { inventoryQuerySchema } from "@/validation/schemas";

type InventoryQuery = z.infer<typeof inventoryQuerySchema>;

export async function getAllInventory(c: Context) {
  const query = c.get("validatedBody") as InventoryQuery;
  const result = await inventoryService.getAllInventory(query);
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
  const body = c.get("validatedBody") as { quantity?: number; lowStockThreshold?: number };
  const inventory = await inventoryService.updateInventory(storeIdOrSlug, productId, body);
  return success(c, inventory, "Inventory updated");
}

export async function removeProductFromStore(c: Context) {
  const { storeIdOrSlug, productId } = c.req.param();
  await inventoryService.removeProductFromStore(storeIdOrSlug, productId);
  return deleted(c, "Product removed from store");
}
