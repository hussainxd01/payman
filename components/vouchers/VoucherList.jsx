"use client";

import { useMemo, useState } from "react";
import VoucherSearch from "@/components/vouchers/VoucherSearch";
import VoucherRow from "@/components/vouchers/VoucherRow";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Shared";
import { getVoucherStatus } from "@/lib/calculations/voucher";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "OUTSTANDING", label: "Outstanding" },
];

const SORT_OPTIONS = [
  { value: "voucherAsc", label: "Voucher No (A→Z)" },
  { value: "voucherDesc", label: "Voucher No (Z→A)" },
  { value: "partyAsc", label: "Party Name (A→Z)" },
  { value: "partyDesc", label: "Party Name (Z→A)" },
  { value: "amountHigh", label: "Amount (High→Low)" },
  { value: "amountLow", label: "Amount (Low→High)" },
];

function sortVouchers(list, sortBy) {
  const arr = [...list];
  switch (sortBy) {
    case "voucherDesc":
      // The list already arrives naturally sorted ascending by voucher
      // number from the API - reversing it is enough for Z→A.
      return arr.reverse();
    case "partyAsc":
      return arr.sort((a, b) => a.partyName.localeCompare(b.partyName));
    case "partyDesc":
      return arr.sort((a, b) => b.partyName.localeCompare(a.partyName));
    case "amountHigh":
      return arr.sort((a, b) => b.totalAmount - a.totalAmount);
    case "amountLow":
      return arr.sort((a, b) => a.totalAmount - b.totalAmount);
    case "voucherAsc":
    default:
      return arr;
  }
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("voucherAsc");

  const filtered = useMemo(() => {
    let result = vouchers;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.voucherNumber.toLowerCase().includes(q) ||
          v.partyName.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((v) => getVoucherStatus(v) === statusFilter);
    }

    return sortVouchers(result, sortBy);
  }, [vouchers, search, statusFilter, sortBy]);

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

        <div className="mt-3 flex flex-wrap gap-2">
          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <SelectField
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>

        <div className="mt-2">
          {filtered.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={
                  search || statusFilter !== "all"
                    ? "No matching vouchers"
                    : "No vouchers yet"
                }
                description={
                  search || statusFilter !== "all"
                    ? "Try a different search or filter."
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
