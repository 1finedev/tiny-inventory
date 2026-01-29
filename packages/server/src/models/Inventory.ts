import mongoose, { Schema, Types } from "mongoose";
import { applySoftDeletePlugin } from "./plugins/soft-delete";

export interface IInventory {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  lowStockThreshold: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: [0, "Threshold cannot be negative"],
      default: 10,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        if (ret._id) ret._id = String(ret._id);
        if (ret.storeId) ret.storeId = String(ret.storeId);
        if (ret.productId) ret.productId = String(ret.productId);
        if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
        if (ret.deletedAt instanceof Date) ret.deletedAt = ret.deletedAt.toISOString();
        return ret;
      },
    },
  }
);

InventorySchema.index({ storeId: 1, productId: 1 }, { unique: true });
InventorySchema.index({ storeId: 1 });
InventorySchema.index({ productId: 1 });
InventorySchema.index({ deletedAt: 1 });
InventorySchema.index({ storeId: 1, deletedAt: 1 });
InventorySchema.index({ productId: 1, deletedAt: 1 });

InventorySchema.plugin(applySoftDeletePlugin);

export const Inventory = mongoose.model<IInventory>("Inventory", InventorySchema);
