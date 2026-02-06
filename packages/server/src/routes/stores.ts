import { Hono } from "hono";
import { createStore, deleteStore, getStore, getStores, updateStore, getStoreMetrics, updateInventory, removeProductFromStore } from "@/controllers";
import { storeCreateSchema, inventoryUpdateSchema, inventoryUpdateParamsSchema, objectIdParamSchema, idParamSchema } from "@/validation/schemas";
import { validate } from "@/middleware";

export const storeRoutes = new Hono();

storeRoutes.get("/", getStores);
storeRoutes.post("/", validate(storeCreateSchema), createStore);
storeRoutes.get("/:id", validate(idParamSchema), getStore);
storeRoutes.patch("/:id", validate(storeCreateSchema.partial()), updateStore);
storeRoutes.delete("/:id", validate(objectIdParamSchema), deleteStore);

storeRoutes.get("/:storeIdOrSlug/metrics", getStoreMetrics);
storeRoutes.patch("/:storeIdOrSlug/inventory/:productId", validate(inventoryUpdateSchema), updateInventory);
storeRoutes.delete("/:storeIdOrSlug/inventory/:productId", validate(inventoryUpdateParamsSchema), removeProductFromStore);
