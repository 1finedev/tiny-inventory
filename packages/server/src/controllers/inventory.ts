import type { Context } from "hono";
import type { IProduct, IStore } from "@/models";
import { AppError, success, paginated, buildInventoryPipeline, inventoryProjection, DEFAULT_LOW_STOCK_THRESHOLD, productLookupMatch } from "@/lib";
import { Inventory, Product, Store } from "@/models";
import mongoose from "mongoose";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getAllInventory(c: Context) {
  const query = c.req.query();
  const storeId = query.storeId?.trim();
  const search = query.search?.trim();
  const category = query.category?.trim();
  const minPrice = query.minPrice ? parseFloat(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : undefined;
  const lowStockOnly = query.lowStockOnly === "true";
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(Math.max(1, parseInt(query.limit || "25", 10)), 25);
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
      return paginated(c, [], { page, limit, total: 0 }, "Inventory fetched");
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

  return paginated(c, data, { page, limit, total }, "Inventory fetched");
}

export async function getInventoryItem(c: Context) {
  const { id } = c.req.param();

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

  return success(c, results[0], "Inventory item fetched");
}

export async function getStoreMetrics(c: Context) {
  const { storeIdOrSlug } = c.req.param();

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
  return success(c, { ...metrics, lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD }, "Store metrics fetched");
}

export async function updateInventory(c: Context) {
  const { storeIdOrSlug, productId } = c.req.param();
  const body = await c.req.json();

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

  return success(c, inventory, "Inventory updated");
}
