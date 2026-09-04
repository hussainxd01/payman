"use client";

import { formatCurrency, StatusBadge, EmptyState } from "@/components/ui/Shared";

export default function OutstandingPage({ vouchers, onBack, onOpenVoucher }) {
  const total = (vouchers || []).reduce((s, v) => s + (Number(v.outstanding) || 0), 0);

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          ← Report
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">
              Outstanding
            </p>
            <h1 className="text-2xl font-medium tracking-tight">
              {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"}
            </h1>
          </div>
          <span className="text-lg tabular-nums">{formatCurrency(total)}</span>
        </div>

        {vouchers.length === 0 ? (
          <EmptyState
            title="Nothing outstanding"
            description="Every voucher is fully paid."
          />
        ) : (
          <div className="border border-line divide-y divide-line">
            {vouchers.map((v) => (
              <button
                key={v._id}
                onClick={() => onOpenVoucher?.(v)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-paper transition-colors"
              >
                <div className="flex items-center gap-6 min-w-0">
                  <span className="text-sm text-muted w-14 shrink-0">{v.voucherNumber}</span>
                  <span className="text-sm truncate">{v.partyName}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={v.status} />
                  <span className="text-sm tabular-nums w-24 text-right">
                    {formatCurrency(v.outstanding)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
