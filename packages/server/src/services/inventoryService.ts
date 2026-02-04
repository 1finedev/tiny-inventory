import type { IProduct, IStore } from "@/models";
import { AppError, buildInventoryPipeline, inventoryProjection, DEFAULT_LOW_STOCK_THRESHOLD, productLookupMatch } from "@/lib";
import { Inventory, Product, Store } from "@/models";
import mongoose from "mongoose";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface GetAllInventoryParams {
  storeId?: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export class InventoryService {
  async getAllInventory(params: GetAllInventoryParams) {
    const storeId = params.storeId?.trim();
    const search = params.search?.trim();
    const category = params.category?.trim();
    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const lowStockOnly = params.lowStockOnly ?? false;
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 25), 25);
    const skip = (page - 1) * limit;

    const matchStage: Record<string, unknown> = {};
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      matchStage.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (search) {
      const normalizedSearch = search.trim();
      const [productMatches, storeMatches] = await Promise.all([
        Product.find(
          { $or: [{ $text: { $search: normalizedSearch } }, { sku: normalizedSearch.toUpperCase() }] },
          { _id: 1 }
        ).lean(),
        Store.find(
          { name: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
          { _id: 1 }
        ).lean(),
      ]);

      const productIds = productMatches.map((product) => product._id);
      const storeIds = storeMatches.map((store) => store._id);
      const searchOr: Record<string, unknown>[] = [];
      if (productIds.length) searchOr.push({ productId: { $in: productIds } });
      if (storeIds.length) searchOr.push({ storeId: { $in: storeIds } });

      if (!searchOr.length) {
        return { data: [], page, limit, total: 0 };
      }

      matchStage.$or = searchOr;
    }

    const productMatch: Record<string, unknown> = {};
    if (category) {
      productMatch.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceMatch: Record<string, number> = {};
      if (minPrice !== undefined) priceMatch.$gte = minPrice;
      if (maxPrice !== undefined) priceMatch.$lte = maxPrice;
      productMatch.price = priceMatch;
    }

    const pipeline = buildInventoryPipeline(matchStage, productMatch);

    if (lowStockOnly) {
      pipeline.push({
        $match: {
          $expr: { $lt: ["$quantity", { $ifNull: ["$lowStockThreshold", DEFAULT_LOW_STOCK_THRESHOLD] }] },
        },
      });
    }

    const results = await Inventory.aggregate([
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { "store.name": 1, "product.name": 1 } },
            { $skip: skip },
            { $limit: limit },
            inventoryProjection,
          ],
        },
      },
    ]);

    const total = results[0]?.metadata[0]?.total ?? 0;
    const data = results[0]?.data ?? [];

    return { data, page, limit, total };
  }

  async getInventoryItem(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid inventory ID", 400);
    }

    const results = await Inventory.aggregate([
      ...buildInventoryPipeline({ _id: new mongoose.Types.ObjectId(id) }),
      inventoryProjection,
    ]);

    if (!results.length) {
      throw new AppError("Inventory item not found", 404);
    }

    return results[0];
  }

  async getStoreMetrics(storeIdOrSlug: string) {
    const storeQuery = mongoose.Types.ObjectId.isValid(storeIdOrSlug)
      ? { _id: storeIdOrSlug }
      : { slug: storeIdOrSlug };

    const store = await Store.findOne(storeQuery).lean();
    if (!store) throw new AppError("Store not found", 404);

    const results = await Inventory.aggregate([
      { $match: { storeId: store._id } },
      {
        $lookup: {
          from: "products",
          let: { productId: "$productId" },
          pipeline: [{ $match: productLookupMatch }],
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lt: ["$quantity", { $ifNull: ["$lowStockThreshold", DEFAULT_LOW_STOCK_THRESHOLD] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    const metrics = results[0] || { totalStock: 0, totalValue: 0, lowStockCount: 0 };
    return { ...metrics, lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD };
  }

  async updateInventory(
    storeIdOrSlug: string,
    productId: string,
    body: { quantity?: number; lowStockThreshold?: number }
  ) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError("Invalid product ID", 400);
    }

    const storeQuery = mongoose.Types.ObjectId.isValid(storeIdOrSlug)
      ? { _id: new mongoose.Types.ObjectId(storeIdOrSlug) }
      : { slug: storeIdOrSlug };

    const [store, product] = await Promise.all([
      Store.findOne(storeQuery).lean<IStore>().exec(),
      Product.findOne({ _id: productId }).lean<IProduct>().exec(),
    ]);

    if (!store) throw new AppError("Store not found", 404);
    if (!product) throw new AppError("Product not found", 404);

    const updateData: { quantity?: number; lowStockThreshold?: number; deletedAt?: null } = { deletedAt: null };
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold;

    const inventory = await Inventory.findOneAndUpdate(
      { storeId: store._id, productId: product._id },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    return inventory;
  }
}

export const inventoryService = new InventoryService();
