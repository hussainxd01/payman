import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    category: { type: String, default: "Miscellaneous", trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "Cash", trim: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
