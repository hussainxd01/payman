"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import NumberInput from "@/components/ui/NumberInput";
import Modal from "@/components/ui/Modal";

const CATEGORIES = ["Transport", "Tea/Food", "Office", "Miscellaneous"];
const METHODS = ["Cash", "Bank", "UPI", "Other"];

export default function ExpenseForm({ open, onClose, onSave, initial, saving }) {
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || METHODS[0]);

  const reset = () => {
    setCategory(CATEGORIES[0]);
    setDescription("");
    setAmount(0);
    setPaymentMethod(METHODS[0]);
  };

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return;
    await onSave({ category, description, amount: Number(amount), paymentMethod });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Expense" : "Add Expense"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !amount}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`border px-3 py-1.5 text-xs transition-colors ${
                  category === c ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. auto fare to bank"
        />

        <NumberInput
          label="Amount"
          value={amount}
          onChange={setAmount}
        />

        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">
            Payment Method
          </p>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`border px-3 py-1.5 text-xs transition-colors ${
                  paymentMethod === m ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
