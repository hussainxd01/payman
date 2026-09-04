import mongoose from "mongoose";

const BankPaymentSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    amount: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const PaymentsSchema = new mongoose.Schema(
  {
    cash: { type: Number, default: 0, min: 0 },
    banks: { type: [BankPaymentSchema], default: [] },
  },
  { _id: false }
);

const VoucherSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    voucherNumber: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    partyName: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },

    payments: { type: PaymentsSchema, default: () => ({}) },

    discount: { type: Number, default: 0, min: 0 },
    goodsReturn: { type: Number, default: 0, min: 0 },

    // isProcessed tracks whether the user has stepped through this voucher
    // in the sequential entry flow. It is workflow state, not financial
    // status -- paid/partial/outstanding is always derived, never stored.
    isProcessed: { type: Boolean, default: false },

    // A manual tag so a voucher can be pinned into the Outstanding view
    // even if further edits later change its computed balance. The
    // outstanding *amount* shown is still always derived from the
    // voucher's actual figures, never stored separately.
    markedOutstanding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

VoucherSchema.index({ batchId: 1, voucherNumber: 1 });

export default mongoose.models.Voucher ||
  mongoose.model("Voucher", VoucherSchema);
