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
      className="
        h-9
        rounded-none
        border
        border-black/20
        bg-white
        px-3
        text-[10px]
        font-medium
        uppercase
        tracking-[0.12em]
        text-black
        outline-none
        transition-colors
        hover:border-black/50
        focus:border-black
      "
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
  onEditVoucher,
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
    <div className="min-h-screen bg-[#f3f0e8] text-[#111]">
      {/* Header */}
      <header className="h-14 border-b border-black/15 bg-[#f3f0e8]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Payment Tracker"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="text-[13px] font-black uppercase tracking-[-0.02em]">
                Payment Tracker
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">
                Daily workspace
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.16em] text-black/45">
            <span>Daily Workspace</span>

            <span className="h-3.5 w-px bg-black/15" />

            <span>{String(vouchers.length).padStart(2, "0")} Entries</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Back */}
        {onBack && (
          <button
            onClick={onBack}
            className="
              mb-8
              text-[9px]
              font-medium
              uppercase
              tracking-[0.18em]
              text-black/45
              transition-colors
              hover:text-black
            "
          >
            ← {backLabel}
          </button>
        )}

        {/* Page heading */}
        <div className="mb-7 flex items-end justify-between border-b border-black/15 pb-5">
          <div>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-black/45">
              Voucher Archive
            </p>

            <h1 className="text-[27px] font-medium tracking-[-0.04em]">
              {vouchers.length} voucher
              {vouchers.length === 1 ? "" : "s"}
            </h1>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/40">
              Showing
            </p>

            <p className="mt-1 font-mono text-sm tabular-nums">
              {String(filtered.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Controls */}
        <section className="mb-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <div className="border border-black/15 bg-white">
                <VoucherSearch value={search} onChange={setSearch} />
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
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

            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.15em]
                  text-black/40
                  transition-colors
                  hover:text-black
                "
              >
                Clear filters ×
              </button>
            )}
          </div>
        </section>

        {/* Small section label */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-black/45">
            Entries
          </span>

          <span className="h-px flex-1 bg-black/10" />

          <span className="font-mono text-[9px] text-black/35">
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(vouchers.length).padStart(2, "0")}
          </span>
        </div>

        {/* Voucher list */}
        {filtered.length === 0 ? (
          <div className="border border-black/15 bg-white">
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
          <div className="border-y border-black/15 bg-white">
            {filtered.map((v, index) => (
              <div
                key={v._id}
                className="
                  group
                  border-b
                  border-black/[0.08]
                  last:border-b-0
                  transition-colors
                  hover:bg-[#fffbdc]
                "
              >
                <div className="flex">
                  {/* Index */}
                  <div className="hidden w-12 shrink-0 items-start justify-center border-r border-black/[0.08] pt-5 sm:flex">
                    <span className="font-mono text-[9px] text-black/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Existing row */}
                  <div className="min-w-0 flex-1">
                    <VoucherRow
                      voucher={v}
                      onOpen={onOpenVoucher}
                      onEdit={onEditVoucher}
                      showStatus={showStatus}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-7 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.15em] text-black/40">
            <span>Payment Tracker</span>

            <span className="h-3 w-px bg-black/15" />

            <span>{filtered.length} visible</span>
          </div>

          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-black/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Archive active
          </div>
        </div>
      </main>
    </div>
  );
}
