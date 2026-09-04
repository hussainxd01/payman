"use client";

import { useMemo, useState } from "react";
import VoucherSearch from "@/components/vouchers/VoucherSearch";
import VoucherRow from "@/components/vouchers/VoucherRow";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Shared";

export default function VoucherList({
  vouchers,
  onOpenVoucher,
  onBack,
  backLabel = "Back",
  title = "Vouchers",
  showStatus = true,
  onAddMore,
  onViewReport,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return vouchers;
    const q = search.trim().toLowerCase();
    return vouchers.filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(q) ||
        v.partyName.toLowerCase().includes(q),
    );
  }, [vouchers, search]);

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-8 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            ← {backLabel}
          </button>
        )}

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">
              {title}
            </p>
            <h1 className="text-2xl font-medium tracking-tight">
              {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"}
            </h1>
          </div>
          <div className="flex gap-2 shrink-0">
            {onViewReport && (
              <Button variant="secondary" onClick={onViewReport}>
                View Report
              </Button>
            )}
            {onAddMore && (
              <Button variant="secondary" onClick={onAddMore}>
                + Add More
              </Button>
            )}
          </div>
        </div>

        <VoucherSearch value={search} onChange={setSearch} />

        <div className="mt-2">
          {filtered.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={search ? "No matching vouchers" : "No vouchers yet"}
                description={
                  search
                    ? "Try a different voucher number or party name."
                    : "Paste today's voucher data to get started."
                }
              />
            </div>
          ) : (
            filtered.map((v) => (
              <VoucherRow
                key={v._id}
                voucher={v}
                onOpen={onOpenVoucher}
                showStatus={showStatus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
