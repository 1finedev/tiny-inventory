import { AppError } from "@/lib";
import { Product } from "@/models";
import mongoose from "mongoose";

export class ProductService {
  async getProducts() {
    const products = await Product.find().sort({ name: 1 }).lean();
    return products;
  }

  async getProduct(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400);
    }

    const product = await Product.findOne({ _id: id }).lean();
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  async createProduct(body: Record<string, unknown>) {
    const product = await Product.create(body);
    return product;
  }

  async updateProduct(id: string, body: Record<string, unknown>) {
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

    return product;
  }

  async deleteProduct(id: string) {
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
  }
}

export const productService = new ProductService();
