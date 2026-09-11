"use client";

import { formatCurrency, StatusBadge } from "@/components/ui/Shared";
import { getVoucherStatus } from "@/lib/calculations/voucher";

export default function VoucherRow({
  voucher,
  onOpen,
  onEdit,
  showStatus = true,
}) {
  const status = getVoucherStatus(voucher);

  return (
    <div className="w-full flex items-stretch gap-2 border-b border-line">
      <button
        onClick={() => onOpen(voucher)}
        className="flex-1 min-w-0 flex items-center justify-between gap-4 px-1 py-4 text-left hover:bg-paper transition-colors"
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

      {onEdit && (
        <button
          onClick={() => onEdit(voucher)}
          className="shrink-0 px-3 text-[11px] uppercase tracking-widest text-muted hover:text-ink hover:bg-paper transition-colors border-l border-line"
        >
          Edit
        </button>
      )}
    </div>
  );
}
