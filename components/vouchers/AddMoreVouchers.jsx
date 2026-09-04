"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

export default function AddMoreVouchers({ onParse, onBack }) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      await onParse(text);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-xl">
        <button
          onClick={onBack}
          className="mb-8 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          ← Back
        </button>

        <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">
          Add More Vouchers
        </p>
        <h1 className="text-2xl font-medium tracking-tight mb-8">
          Paste additional voucher data
        </h1>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Date\tVch/Bill No\tAccount\tTotal Amount\n01-09-2026\tF5\tRAM ENTERPRISES\t12,400.00`}
          rows={12}
          className="text-sm"
        />

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="secondary" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleParse} disabled={!text.trim() || parsing}>
            {parsing ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
