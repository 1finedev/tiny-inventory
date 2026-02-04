import { AppError } from "@/lib";
import { Store } from "@/models";
import mongoose from "mongoose";

export class StoreService {
  async getStores() {
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

    return stores;
  }

  async getStore(id: string) {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const store = await Store.findOne(query).lean();

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    return store;
  }

  async createStore(body: Record<string, unknown>) {
    const store = await Store.create(body);
    return store;
  }

  async updateStore(id: string, body: Record<string, unknown>) {
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

    return store;
  }

  async deleteStore(id: string) {
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
  }
}

export const storeService = new StoreService();
