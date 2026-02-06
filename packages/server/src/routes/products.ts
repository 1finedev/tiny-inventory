import { Hono } from "hono";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "@/controllers";
import { productCreateSchema, objectIdParamSchema } from "@/validation/schemas";
import { validate } from "@/middleware";

export const productRoutes = new Hono();

productRoutes.get("/", getProducts);
productRoutes.post("/", validate(productCreateSchema), createProduct);
productRoutes.get("/:id", validate(objectIdParamSchema), getProduct);
productRoutes.patch("/:id", validate(productCreateSchema.partial()), updateProduct);
productRoutes.delete("/:id", validate(objectIdParamSchema), deleteProduct);
