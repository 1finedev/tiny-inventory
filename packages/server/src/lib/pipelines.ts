import mongoose from "mongoose";

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export const productLookupMatch: Record<string, unknown> = {
  $expr: { $and: [{ $eq: ["$_id", "$$productId"] }, { $eq: ["$deletedAt", null] }] },
};

export function buildInventoryPipeline(
  matchStage: Record<string, unknown> = {},
  productMatch: Record<string, unknown> = {}
): mongoose.PipelineStage[] {
  const productMatchStage = Object.keys(productMatch).length
    ? { $match: productMatch }
    : null;

  return [
    { $match: { deletedAt: null, ...matchStage } },
    {
      $lookup: {
        from: "stores",
        let: { storeId: "$storeId" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$_id", "$$storeId"] }, { $eq: ["$deletedAt", null] }] } } },
        ],
        as: "store",
      },
    },
    { $unwind: { path: "$store", preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: "products",
        let: { productId: "$productId" },
        pipeline: [{ $match: productLookupMatch }, ...(productMatchStage ? [productMatchStage] : [])],
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
  ];
}

export const inventoryProjection = {
  $project: {
    _id: { $toString: "$_id" },
    storeId: { $toString: "$storeId" },
    storeName: "$store.name",
    storeSlug: "$store.slug",
    productId: { $toString: "$productId" },
    quantity: 1,
    lowStockThreshold: { $ifNull: ["$lowStockThreshold", DEFAULT_LOW_STOCK_THRESHOLD] },
    createdAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
    updatedAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
    product: {
      _id: { $toString: "$product._id" },
      sku: "$product.sku",
      name: "$product.name",
      category: "$product.category",
      price: "$product.price",
      createdAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$product.createdAt" } },
      updatedAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$product.updatedAt" } },
    },
  },
};
