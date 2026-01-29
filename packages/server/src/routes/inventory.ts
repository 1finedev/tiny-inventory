import { Hono } from "hono";
import { getAllInventory, getInventoryItem } from "@/controllers";
import { inventoryQuerySchema, objectIdParamSchema } from "@/validation/schemas";
import { validate } from "@/middleware";

export const inventoryRoutes = new Hono();

inventoryRoutes.get("/", validate(inventoryQuerySchema), getAllInventory);
inventoryRoutes.get("/:id", validate(objectIdParamSchema), getInventoryItem);
