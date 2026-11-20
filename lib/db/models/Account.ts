import mongoose, { Schema } from "mongoose";

const AccountSchema = new Schema(
  {
    network: { type: String, required: true },
    address: { type: String, required: true },
    balances: [Schema.Types.Mixed],
    asOfLedger: Number,
    provider: String,
    coverage: Schema.Types.Mixed,
    fetchedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

AccountSchema.index({ network: 1, address: 1 }, { unique: true });
AccountSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AccountModel =
  mongoose.models.Account || mongoose.model("Account", AccountSchema);
