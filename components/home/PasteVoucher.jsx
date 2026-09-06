"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

export default function PasteVoucher({
  voucherCount,
  onParse,
  onResetAll,
  onViewVouchers,
}) {
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-muted mb-3">
          Daily Workspace
        </p>
        <h1 className="text-center text-3xl md:text-4xl font-medium tracking-tight text-ink mb-10">
          Payment Tracker
        </h1>

        <p className="text-center text-sm text-muted mb-6">
          Paste today&rsquo;s voucher data
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Date\tVch/Bill No\tAccount\tTotal Amount\n01-09-2026\tF1\tNEHA TRADERS (ODISHA)\t59,750.00\n01-09-2026\tF2\tLOOK ME (MURSHIDABAD)\t32,980.00`}
          rows={12}
          className="text-sm"
        />

        <div className="mt-8 flex justify-center">
          <Button onClick={handleParse} disabled={!text.trim() || parsing}>
            {parsing ? "Processing..." : "Start Processing"}
          </Button>
        </div>

        {voucherCount > 0 && onViewVouchers && (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={onViewVouchers}>
              View {voucherCount} Voucher{voucherCount === 1 ? "" : "s"}
            </Button>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-4">
          <p className="text-center text-xs text-muted uppercase tracking-widest">
            Today&rsquo;s vouchers: {voucherCount}
          </p>
          {voucherCount > 0 && onResetAll && (
            <button
              onClick={onResetAll}
              className="text-xs uppercase tracking-widest text-red-700 hover:text-red-900 transition-colors"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
