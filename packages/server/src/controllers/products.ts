import type { Context } from "hono";
import { AppError, success, deleted } from "@/lib";
import { Product } from "@/models";
import mongoose from "mongoose";

export async function getProducts(c: Context) {
  const products = await Product.find().sort({ name: 1 }).lean();
  return success(c, products, "Products fetched");
}

export async function getProduct(c: Context) {
  const { id } = c.req.param();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400);
  }

  const product = await Product.findOne({ _id: id }).lean();
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return success(c, product, "Product fetched");
}

export async function createProduct(c: Context) {
  const body = await c.req.json();
  const product = await Product.create(body);
  return success(c, product, "Product created", 201);
}

export async function updateProduct(c: Context) {
  const { id } = c.req.param();
  const body = await c.req.json();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400);
  }

  const product = await Product.findOneAndUpdate(
    { _id: id },
    body,
    { new: true, runValidators: true }
  ).lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return success(c, product, "Product updated");
}

export async function deleteProduct(c: Context) {
  const { id } = c.req.param();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400);
  }

  const product = await Product.findOneAndUpdate(
    { _id: id },
    { deletedAt: new Date() },
    { new: true }
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return deleted(c, "Product deleted");
}
