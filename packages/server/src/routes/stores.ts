import { Hono } from "hono";
import { createStore, deleteStore, getStore, getStores, updateStore, getStoreMetrics, updateInventory } from "@/controllers";
import { storeCreateSchema, inventoryUpdateSchema } from "@/validation/schemas";
import { validate } from "@/middleware";

export const storeRoutes = new Hono();

storeRoutes.get("/", getStores);
storeRoutes.post("/", validate(storeCreateSchema), createStore);
storeRoutes.get("/:id", getStore);
storeRoutes.patch("/:id", validate(storeCreateSchema.partial()), updateStore);
storeRoutes.delete("/:id", deleteStore);

storeRoutes.get("/:storeIdOrSlug/metrics", getStoreMetrics);
storeRoutes.patch("/:storeIdOrSlug/inventory/:productId", validate(inventoryUpdateSchema), updateInventory);
