import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema(
  {
    network: { type: String, required: true },
    hash: { type: String, required: true },
    ledger: Number,
    closedAt: Date,
    status: { type: String, required: true },
    sourceAccount: String,
    feeChargedStroops: String,
    feeChargedXlm: String,
    memo: Schema.Types.Mixed,
    operations: [Schema.Types.Mixed],
    events: [Schema.Types.Mixed],
    humanized: Schema.Types.Mixed,
    coverage: Schema.Types.Mixed,
    envelopeXdr: String,
    decoderVersion: { type: Number, default: 1 },
    humanizerVersion: { type: Number, default: 1 },
    provider: String,
    fetchedAt: Date,
  },
  { timestamps: true }
);

TransactionSchema.index({ network: 1, hash: 1 }, { unique: true });
TransactionSchema.index({ sourceAccount: 1, closedAt: -1 });

export const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
