import mongoose from "mongoose";

const creditLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // positive for add/refill/refund, negative for spend
    },
    bucket: {
      type: String,
      enum: ["daily", "bonus"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "daily_refill",
        "spend",
        "refund",
        "referral",
        "share",
        "rating",
        "onboarding",
        "streak",
        "migration",
      ],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

creditLedgerSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("CreditLedger", creditLedgerSchema);
