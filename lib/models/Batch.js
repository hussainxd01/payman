import mongoose from "mongoose";

const BatchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    name: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    // Total units sold for the day, entered once rather than per voucher.
    totalQuantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Batch || mongoose.model("Batch", BatchSchema);
