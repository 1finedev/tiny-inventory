import type { Aggregate, Query, Schema } from "mongoose";

type SoftDeleteOptions = {
  deletedAtField?: string;
};

const DEFAULT_FIELD = "deletedAt";

function hasDeletedAtFilter(filter: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(filter, field);
}

export function applySoftDeletePlugin(schema: Schema, options: SoftDeleteOptions = {}) {
  const field = options.deletedAtField ?? DEFAULT_FIELD;

  const addNotDeletedFilter = function (this: Query<unknown, unknown>) {
    const opts = this.getOptions ? this.getOptions() : {};
    if (opts?.withDeleted) return;

    const filter = this.getFilter() || {};
    if (hasDeletedAtFilter(filter, field)) return;

    this.setQuery({ ...filter, [field]: null });
  };

  schema.pre(["find", "findOne", "findOneAndUpdate", "updateOne", "updateMany", "countDocuments"], addNotDeletedFilter);

  schema.pre("aggregate", function (this: Aggregate<unknown[]>) {
    const opts = this.options ?? {};
    if (opts?.withDeleted) return;

    const pipeline = this.pipeline();
    const hasMatch = pipeline.some(
      (stage) => "$match" in stage && typeof stage.$match === "object" && stage.$match !== null && field in stage.$match
    );

    if (!hasMatch) {
      pipeline.unshift({ $match: { [field]: null } });
    }
  });
}
