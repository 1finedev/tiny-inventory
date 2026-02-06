import type { Context } from "hono";
import { success, deleted } from "@/lib";
import { storeService } from "@/services";

export async function getStores(c: Context) {
  const stores = await storeService.getStores();
  return success(c, stores, "Stores fetched");
}

export async function getStore(c: Context) {
  const { id } = c.req.param();
  const store = await storeService.getStore(id);
  return success(c, store, "Store fetched");
}

export async function createStore(c: Context) {
  const body = c.get("validatedBody") as Record<string, unknown>;
  const store = await storeService.createStore(body);
  return success(c, store, "Store created", 201);
}

export async function updateStore(c: Context) {
  const { id } = c.req.param();
  const body = c.get("validatedBody") as Record<string, unknown>;
  const store = await storeService.updateStore(id, body);
  return success(c, store, "Store updated");
}

export async function deleteStore(c: Context) {
  const { id } = c.req.param();
  await storeService.deleteStore(id);
  return deleted(c, "Store deleted");
}
