import mongoose, { Schema } from "mongoose";

const QueryCacheSchema = new Schema(
  {
    cacheKey: { type: String, required: true, unique: true },
    network: { type: String, required: true },
    intent: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

QueryCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const QueryCacheModel =
  mongoose.models.QueryCache ||
  mongoose.model("QueryCache", QueryCacheSchema);
