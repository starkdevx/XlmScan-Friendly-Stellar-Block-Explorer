import mongoose, { Schema } from "mongoose";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 1 },
  expiresAt: { type: Date, required: true },
});

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel =
  mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
