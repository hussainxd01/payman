import mongoose from "mongoose";

const BankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Bank || mongoose.model("Bank", BankSchema);
