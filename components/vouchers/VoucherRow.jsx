"use client";

import { formatCurrency, StatusBadge } from "@/components/ui/Shared";
import { getVoucherStatus } from "@/lib/calculations/voucher";

export default function VoucherRow({ voucher, onOpen, showStatus = true }) {
  const status = getVoucherStatus(voucher);

  return (
    <button
      onClick={() => onOpen(voucher)}
      className="w-full flex items-center justify-between gap-4 px-1 py-4 text-left hover:bg-paper transition-colors border-b border-line"
    >
      <div className="flex items-center gap-6 min-w-0">
        <span className="text-sm text-muted w-14 shrink-0 tabular-nums">
          {voucher.voucherNumber}
        </span>
        <span className="text-sm text-ink truncate">{voucher.partyName}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {showStatus && <StatusBadge status={status} />}
        <span className="text-sm tabular-nums w-24 text-right">
          {formatCurrency(voucher.totalAmount)}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-muted">
          Open
        </span>
      </div>
    </button>
  );
}
