"use client";

import Button from "@/components/ui/Button";
import { formatCurrency } from "@/components/ui/Shared";

export default function ImportPreview({ parsed, importing, onImport, onCancel }) {
  const { vouchers, errors, duplicates } = parsed;
  const hasIssues = errors.length > 0 || duplicates.length > 0;

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-3">
          Review Before Import
        </p>
        <h1 className="text-2xl font-medium tracking-tight mb-8">
          {vouchers.length} Voucher{vouchers.length === 1 ? "" : "s"} Found
        </h1>

        {duplicates.length > 0 && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium mb-1">Duplicate voucher detected</p>
            <p>{duplicates.join(", ")} appear{duplicates.length === 1 ? "s" : ""} more than once. Please review before continuing.</p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium mb-1">
              {errors.length} row{errors.length === 1 ? "" : "s"} need attention
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {errors.slice(0, 8).map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
              {errors.length > 8 && <li>and {errors.length - 8} more...</li>}
            </ul>
          </div>
        )}

        {vouchers.length > 0 ? (
          <div className="border border-line">
            <div className="max-h-96 overflow-y-auto divide-y divide-line">
              {vouchers.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-muted w-14 shrink-0">{v.voucherNumber}</span>
                    <span className="truncate">{v.partyName}</span>
                  </div>
                  <span className="tabular-nums shrink-0">
                    {formatCurrency(v.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No valid vouchers to import.</p>
        )}

        <div className="mt-10 flex justify-center gap-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={vouchers.length === 0 || importing}
          >
            {importing ? "Importing..." : `Import ${vouchers.length} Voucher${vouchers.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
