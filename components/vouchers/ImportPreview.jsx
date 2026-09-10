"use client";

import Button from "@/components/ui/Button";
import { formatCurrency } from "@/components/ui/Shared";

export default function ImportPreview({
  parsed,
  importing,
  onImport,
  onCancel,
}) {
  const { vouchers, errors, duplicates } = parsed;
  const hasIssues = errors.length > 0 || duplicates.length > 0;

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

            <span>Import Review</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-12">
        {/* Heading */}
        <div className="mb-7 border-b border-black/15 pb-5">
          <div className="mb-2 flex items-center gap-3">
            <span className="font-mono text-[9px] text-black/35">02</span>

            <span className="h-px w-7 bg-black/20" />

            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-black/45">
              Review Before Import
            </p>
          </div>

          <div className="flex items-end justify-between gap-5">
            <h1 className="text-[28px] font-medium tracking-[-0.045em]">
              {vouchers.length} Voucher
              {vouchers.length === 1 ? "" : "s"} Found
            </h1>

            <span className="hidden font-mono text-[9px] text-black/30 sm:block">
              {hasIssues ? "REVIEW" : "READY"}
            </span>
          </div>
        </div>

        {/* =====================================================
            ISSUES
        ====================================================== */}

        {duplicates.length > 0 && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Duplicate voucher detected
            </div>

            <p className="text-[11px] leading-5 text-red-700/80">
              {duplicates.join(", ")} appear
              {duplicates.length === 1 ? "s" : ""} more than once. Please review
              before continuing.
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-800">
              {errors.length} row
              {errors.length === 1 ? "" : "s"} need attention
            </div>

            <ul className="space-y-1 pl-4 text-[11px] leading-5 text-amber-800/80">
              {errors.slice(0, 8).map((e, i) => (
                <li key={i} className="list-disc">
                  {e.message}
                </li>
              ))}

              {errors.length > 8 && (
                <li className="list-disc">and {errors.length - 8} more...</li>
              )}
            </ul>
          </div>
        )}

        {/* =====================================================
            VOUCHER PREVIEW
        ====================================================== */}

        {vouchers.length > 0 ? (
          <section className="border border-black/15 bg-white">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-[#f3f0e8] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-black/35">01</span>

                <span className="text-[9px] font-medium uppercase tracking-[0.17em]">
                  Import Preview
                </span>
              </div>

              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-black/30">
                {vouchers.length} rows
              </span>
            </div>

            {/* Rows */}
            <div className="max-h-96 overflow-y-auto">
              {vouchers.map((v, i) => (
                <div
                  key={i}
                  className="
                    group
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-b
                    border-black/[0.07]
                    px-4
                    py-3.5
                    transition-colors
                    last:border-b-0
                    hover:bg-[#fffbdc]
                    sm:px-5
                  "
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="hidden w-5 shrink-0 font-mono text-[8px] text-black/25 sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="w-14 shrink-0 font-mono text-[10px] text-black/45">
                      {v.voucherNumber}
                    </span>

                    <span className="truncate text-[12px] font-medium">
                      {v.partyName}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-[11px] tabular-nums">
                    {formatCurrency(v.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="border border-black/15 bg-white px-5 py-8">
            <p className="text-[11px] text-black/45">
              No valid vouchers to import.
            </p>
          </div>
        )}

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-black/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            {hasIssues ? "Review the entries above" : "Everything looks ready"}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>

            <Button
              onClick={onImport}
              disabled={vouchers.length === 0 || importing}
            >
              {importing
                ? "Importing..."
                : `Import ${vouchers.length} Voucher${
                    vouchers.length === 1 ? "" : "s"
                  } →`}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.16em] text-black/30">
          <span>Payment Tracker</span>

          <span>Import review</span>
        </div>
      </main>
    </div>
  );
}
