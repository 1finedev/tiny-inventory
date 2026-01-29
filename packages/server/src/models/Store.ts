import mongoose, { Schema, Types } from "mongoose";
import { Inventory } from "./Inventory";
import { applySoftDeletePlugin } from "./plugins/soft-delete";

export interface IStore {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [100, "Store name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
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

StoreSchema.index({ slug: 1 }, { unique: true, sparse: true });
StoreSchema.index({ name: 1 });
StoreSchema.index({ deletedAt: 1 });

StoreSchema.plugin(applySoftDeletePlugin);

StoreSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

const getDeletedAtUpdate = (update: unknown) => {
  if (!update || typeof update !== "object") return undefined;
  const updateDoc = update as Record<string, unknown>;
  const $set = (updateDoc.$set ?? {}) as Record<string, unknown>;
  return updateDoc.deletedAt ?? $set.deletedAt;
};

StoreSchema.post("findOneAndUpdate", async function (doc) {
  const deletedAt = getDeletedAtUpdate(this.getUpdate());
  if (!doc || !deletedAt) return;

  const session = this.getOptions().session;
  await Inventory.updateMany(
    { storeId: doc._id },
    { deletedAt },
    session ? { session } : undefined
  );
});

export const Store = mongoose.model<IStore>("Store", StoreSchema);
