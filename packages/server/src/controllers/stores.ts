import type { Context } from "hono";
import { AppError, success, deleted } from "@/lib";
import { Store } from "@/models";
import mongoose from "mongoose";

export async function getStores(c: Context) {
  const stores = await Store.aggregate([
    {
      $lookup: {
        from: "inventories",
        let: { storeId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$storeId", "$$storeId"] }, { $eq: ["$deletedAt", null] }] } } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ],
        as: "inventory",
      },
    },
    {
      $project: {
        _id: { $toString: "$_id" },
        name: 1,
        slug: 1,
        productCount: { $ifNull: [{ $first: "$inventory.count" }, 0] },
        createdAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
        updatedAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
      },
    },
    { $sort: { productCount: -1, name: 1 } },
  ]);

  return success(c, stores, "Stores fetched");
}

export async function getStore(c: Context) {
  const { id } = c.req.param();

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { slug: id };

  const store = await Store.findOne(query).lean();

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return success(c, store, "Store fetched");
}

export async function createStore(c: Context) {
  const body = await c.req.json();
  const store = await Store.create(body);
  return success(c, store, "Store created", 201);
}

export async function updateStore(c: Context) {
  const { id } = c.req.param();
  const body = await c.req.json();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid store ID", 400);
  }

  const store = await Store.findOneAndUpdate(
    { _id: id },
    body,
    { new: true, runValidators: true }
  ).lean();

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return success(c, store, "Store updated");
}

export async function deleteStore(c: Context) {
  const { id } = c.req.param();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid store ID", 400);
  }

  const store = await Store.findOneAndUpdate(
    { _id: id },
    { deletedAt: new Date() },
    { new: true }
  );

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return deleted(c, "Store deleted");
}
