import mongoose, { Schema, Types } from "mongoose";
import { Inventory } from "./Inventory";
import { applySoftDeletePlugin } from "./plugins/soft-delete";

export interface IProduct {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  category: string;
  price: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [32, "SKU cannot exceed 32 characters"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
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
        if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
        if (ret.deletedAt instanceof Date) ret.deletedAt = ret.deletedAt.toISOString();
        return ret;
      },
    },
  }
);

ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ deletedAt: 1 });
ProductSchema.index({ sku: "text", name: "text", category: "text" });

ProductSchema.plugin(applySoftDeletePlugin);

const getDeletedAtUpdate = (update: unknown) => {
  if (!update || typeof update !== "object") return undefined;
  const updateDoc = update as Record<string, unknown>;
  const $set = (updateDoc.$set ?? {}) as Record<string, unknown>;
  return updateDoc.deletedAt ?? $set.deletedAt;
};

ProductSchema.post("findOneAndUpdate", async function (doc) {
  const deletedAt = getDeletedAtUpdate(this.getUpdate());
  if (!doc || !deletedAt) return;

  const session = this.getOptions().session;
  await Inventory.updateMany(
    { productId: doc._id },
    { deletedAt },
    session ? { session } : undefined
  );
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
