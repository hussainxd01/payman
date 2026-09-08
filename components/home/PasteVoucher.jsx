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
    <div className="min-h-screen bg-[#f8f8f7] text-ink">
      {" "}
      {/* App header */}{" "}
      <header className="h-14 border-b border-black/[0.08] bg-white">
        {" "}
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-7 w-7 items-center justify-center border border-black/[0.12] bg-ink text-[9px] font-semibold tracking-tight text-white">
              {" "}
              PT{" "}
            </div>{" "}
            <span className="text-[13px] font-medium tracking-[-0.01em]">
              {" "}
              Payment Tracker{" "}
            </span>{" "}
          </div>{" "}
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.14em] text-muted">
            {" "}
            <span>Daily Workspace</span>{" "}
            <span className="h-3.5 w-px bg-black/[0.1]" />{" "}
            <span> {String(voucherCount).padStart(2, "0")} Entries </span>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      {/* Main */}{" "}
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        {" "}
        {/* Heading */}{" "}
        <div className="mb-7 flex items-end justify-between border-b border-black/[0.08] pb-5">
          {" "}
          <div>
            {" "}
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-muted">
              {" "}
              Voucher Entry{" "}
            </p>{" "}
            <h1 className="text-[25px] font-medium tracking-[-0.035em]">
              {" "}
              Daily Vouchers{" "}
            </h1>{" "}
          </div>{" "}
          <div className="hidden text-right sm:block">
            {" "}
            <p className="text-[9px] uppercase tracking-[0.16em] text-muted">
              {" "}
              Entries Today{" "}
            </p>{" "}
            <p className="mt-1 font-mono text-sm tabular-nums">
              {" "}
              {String(voucherCount).padStart(2, "0")}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Entry workspace */}{" "}
        <section className="border border-black/[0.1] bg-white">
          {" "}
          {/* Toolbar */}{" "}
          <div className="flex min-h-12 items-center justify-between border-b border-black/[0.08] px-4 sm:px-5">
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <span className="font-mono text-[9px] text-muted"> 01 </span>{" "}
              <span className="h-3 w-px bg-black/[0.1]" />{" "}
              <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                {" "}
                Voucher Data{" "}
              </span>{" "}
            </div>{" "}
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {" "}
              Tab separated{" "}
            </span>{" "}
          </div>{" "}
          {/* Input */}{" "}
          <div className="p-1">
            {" "}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Date\tVch/Bill No\tAccount\tTotal Amount 01-09-2026\tF1\tNEHA TRADERS (ODISHA)\t59,750.00 01-09-2026\tF2\tLOOK ME (MURSHIDABAD)\t32,980.00`}
              rows={13}
              className="min-h-[300px] rounded-none border-0 bg-transparent px-4 py-4 text-[13px] leading-6 shadow-none focus:ring-0"
            />{" "}
          </div>{" "}
          {/* Bottom toolbar */}{" "}
          <div className="flex min-h-[58px] flex-col gap-4 border-t border-black/[0.08] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            {" "}
            <div className="flex items-center gap-2 text-[10px] text-muted">
              {" "}
              <span
                className={`h-1.5 w-1.5 rounded-full ${text.trim() ? "bg-emerald-500" : "bg-black/20"}`}
              />{" "}
              <span>
                {" "}
                {text.trim()
                  ? "Data ready"
                  : "Paste voucher data to begin"}{" "}
              </span>{" "}
            </div>{" "}
            <Button onClick={handleParse} disabled={!text.trim() || parsing}>
              {" "}
              {parsing ? "Processing..." : "Start Processing"}{" "}
            </Button>{" "}
          </div>{" "}
        </section>{" "}
        {/* Existing data */}{" "}
        <div className="mt-5 flex flex-col border-y border-black/[0.08] sm:flex-row sm:items-center sm:justify-between">
          {" "}
          <div className="flex items-center gap-5 px-1 py-4">
            {" "}
            <div>
              {" "}
              <p className="text-[9px] uppercase tracking-[0.15em] text-muted">
                {" "}
                Current Entries{" "}
              </p>{" "}
              <p className="mt-1 text-sm">
                {" "}
                {voucherCount} voucher {voucherCount === 1 ? "" : "s"}{" "}
              </p>{" "}
            </div>{" "}
            <span className="h-7 w-px bg-black/[0.08]" />{" "}
            <div>
              {" "}
              <p className="text-[9px] uppercase tracking-[0.15em] text-muted">
                {" "}
                Status{" "}
              </p>{" "}
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                {" "}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                Active{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {voucherCount > 0 && onViewVouchers && (
            <button
              onClick={onViewVouchers}
              className="flex items-center justify-between border-t border-black/[0.08] px-1 py-4 text-left text-[11px] font-medium transition-opacity hover:opacity-60 sm:border-t-0"
            >
              {" "}
              <span>
                {" "}
                View {voucherCount} Voucher {voucherCount === 1 ? "" : "s"}{" "}
              </span>{" "}
              <span className="ml-5 text-base leading-none"> → </span>{" "}
            </button>
          )}{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="mt-7 flex flex-col gap-3 text-[9px] uppercase tracking-[0.15em] text-muted sm:flex-row sm:items-center sm:justify-between">
          {" "}
          <span>Payment Tracker</span>{" "}
          {voucherCount > 0 && onResetAll ? (
            <button
              onClick={onResetAll}
              className="text-red-700 transition-opacity hover:opacity-60"
            >
              {" "}
              Delete All Vouchers{" "}
            </button>
          ) : (
            <span>Ready for today's entries</span>
          )}{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
