import type { Context } from "hono";
import { success, deleted } from "@/lib";
import { productService } from "@/services";

export async function getProducts(c: Context) {
  const products = await productService.getProducts();
  return success(c, products, "Products fetched");
}

export async function getProduct(c: Context) {
  const { id } = c.req.param();
  const product = await productService.getProduct(id);
  return success(c, product, "Product fetched");
}

export async function createProduct(c: Context) {
  const body = c.get("validatedBody") as Record<string, unknown>;
  const product = await productService.createProduct(body);
  return success(c, product, "Product created", 201);
}

export async function updateProduct(c: Context) {
  const { id } = c.req.param();
  const body = c.get("validatedBody") as Record<string, unknown>;
  const product = await productService.updateProduct(id, body);
  return success(c, product, "Product updated");
}

export async function deleteProduct(c: Context) {
  const { id } = c.req.param();
  await productService.deleteProduct(id);
  return deleted(c, "Product deleted");
}
