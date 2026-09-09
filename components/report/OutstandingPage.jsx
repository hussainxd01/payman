"use client";

import { useMemo, useState } from "react";
import VoucherSearch from "@/components/vouchers/VoucherSearch";
import { formatCurrency, EmptyState } from "@/components/ui/Shared";

export default function OutstandingPage({ vouchers, onBack, onOpenVoucher }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return vouchers;
    const q = search.trim().toLowerCase();
    return (vouchers || []).filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(q) ||
        v.partyName.toLowerCase().includes(q),
    );
  }, [vouchers, search]);

  const total = (filtered || []).reduce(
    (s, v) => s + (Number(v.outstanding) || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-paper px-6 py-10 font-mono">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-6 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          ← Report
        </button>

        <div className="bg-white border border-line rounded-md shadow-sm p-8 md:p-10">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold uppercase tracking-widest text-ink">
              Outstanding Summary
            </h1>
            <p className="text-[13px] text-ink mt-1">
              {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="border-t-2 border-ink mb-4" />

          {vouchers.length > 0 && (
            <div className="mb-4 not-italic font-sans">
              <VoucherSearch
                value={search}
                onChange={setSearch}
                placeholder="Search vouchers..."
                autoFocus
              />
            </div>
          )}

          {vouchers.length === 0 ? (
            <div className="py-6">
              <EmptyState
                title="Nothing outstanding"
                description="Every voucher is fully paid."
              />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-[13px] text-muted italic text-center">
              No matching vouchers.
            </p>
          ) : (
            <div>
              {filtered.map((v) => (
                <button
                  key={v._id}
                  onClick={() => onOpenVoucher?.(v)}
                  className="w-full flex items-center justify-between gap-4 py-1.5 border-b border-line text-[13px] text-ink text-left hover:bg-paper transition-colors"
                >
                  <span className="truncate">
                    {v.voucherNumber} — {v.partyName}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {formatCurrency(v.outstanding)}
                  </span>
                </button>
              ))}

              <div className="flex items-center justify-between gap-4 py-2 border-b-2 border-ink text-[13px] font-bold text-ink mt-1">
                <span>Total Outstanding</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
