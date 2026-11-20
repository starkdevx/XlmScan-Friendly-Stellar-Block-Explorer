import mongoose, { Schema } from "mongoose";

const LabelSchema = new Schema(
  {
    network: { type: String, required: true },
    address: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "anchor" },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LabelSchema.index({ network: 1, address: 1 }, { unique: true });

export const LabelModel =
  mongoose.models.Label || mongoose.model("Label", LabelSchema);
