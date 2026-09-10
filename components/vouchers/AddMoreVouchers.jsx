"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

export default function AddMoreVouchers({ onParse, onBack }) {
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

            <span>Add Entries</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-12">
        {/* Back */}
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
          ← Back
        </button>

        {/* Heading */}
        <div className="mb-7 border-b border-black/15 pb-5">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-black/45">
            Voucher Entry
          </p>

          <div className="flex items-end justify-between gap-5">
            <div>
              <h1 className="text-[28px] font-medium tracking-[-0.045em]">
                Add more vouchers
              </h1>

              <p className="mt-2 max-w-md text-[11px] leading-5 text-black/45">
                Paste additional voucher data below to add it to the current
                workspace.
              </p>
            </div>

            <span className="hidden font-mono text-[9px] text-black/30 sm:block">
              ADD / 01
            </span>
          </div>
        </div>

        {/* Input workspace */}
        <section className="overflow-hidden border border-black/15 bg-white">
          {/* Toolbar */}
          <div className="flex min-h-12 items-center justify-between border-b border-black/10 px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] text-black/35">01</span>

              <span className="h-3.5 w-px bg-black/10" />

              <span className="text-[9px] font-medium uppercase tracking-[0.17em]">
                Voucher Data
              </span>
            </div>

            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-black/30">
              Tab separated
            </span>
          </div>

          {/* Textarea */}
          <div className="p-1">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Date\tVch/Bill No\tAccount\tTotal Amount
01-09-2026\tF5\tRAM ENTERPRISES\t12,400.00`}
              rows={12}
              className="
                min-h-[300px]
                rounded-none
                border-0
                bg-transparent
                px-4
                py-4
                font-mono
                text-[12px]
                leading-6
                shadow-none
                focus:ring-0
              "
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex min-h-[62px] flex-col gap-4 border-t border-black/10 bg-[#f3f0e8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-[9px] text-black/45">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  text.trim() ? "bg-emerald-500" : "bg-black/20"
                }`}
              />

              <span>
                {text.trim() ? "Data ready" : "Paste voucher data to begin"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onBack}>
                Cancel
              </Button>

              <Button onClick={handleParse} disabled={!text.trim() || parsing}>
                {parsing ? "Processing..." : "Continue →"}
              </Button>
            </div>
          </div>
        </section>

        {/* Tiny footer note */}
        <div className="mt-5 flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.16em] text-black/30">
          <span>Payment Tracker</span>

          <span>Additional entries</span>
        </div>
      </main>
    </div>
  );
}
