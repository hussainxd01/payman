"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import NumberInput from "@/components/ui/NumberInput";
import { formatCurrency } from "@/components/ui/Shared";

function formatDate(dateStr) {
  if (!dateStr) return "";

  const d = new Date(dateStr);

  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatTime(date) {
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

function Section({ title, children }) {
  return (
    <div className="paper-section" style={{ breakInside: "avoid" }}>
      <h2 className="paper-section-title">{title}</h2>

      {children}
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className={`paper-row ${strong ? "font-bold" : "font-normal"}`}>
      <span className="paper-row-label">{label}</span>

      <span className="paper-row-value tabular-nums">{value}</span>
    </div>
  );
}

export default function Report({
  report,
  batch,
  expenses,
  onViewOutstanding,
  onViewAllVouchers,
  onViewExpenses,
  onAddMore,
  onResetDay,
  onSaveQuantity,
  savingQuantity,
}) {
  const totalQuantity = batch?.totalQuantity || 0;

  const [quantityDraft, setQuantityDraft] = useState(totalQuantity);
  const [generatedAt] = useState(() => new Date());

  useEffect(() => {
    setQuantityDraft(totalQuantity);
  }, [totalQuantity]);

  if (!report) return null;

  const { vouchers: summary, expenses: expenseTotals, net } = report;

  const bankEntries = Object.entries(summary.bankBreakdown || {});

  const outstanding = summary.outstandingVouchers || [];

  const expenseList = expenses || [];

  const quantityDirty = quantityDraft !== totalQuantity;

  return (
    <div className="min-h-screen px-6 py-10 font-mono report-page">
      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        @page {
          size: A4 landscape;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        /* =====================================================
           SCREEN
        ===================================================== */

        .report-page {
          background: #f3f4f6;
        }

        .report-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;

          background: #ffffff;

          padding: 48px 56px;

          box-sizing: border-box;

          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.08);
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .report-header-title {
          font-size: 24px;
          line-height: 1.2;

          letter-spacing: 0.08em;
        }

        .report-meta {
          font-size: 13px;
          line-height: 1.5;
        }

        .report-divider {
          border-top: 1px solid #222 !important;

          margin-top: 20px;
          margin-bottom: 22px;
        }

        /* =====================================================
           TWO COLUMN REPORT
        ===================================================== */

        .print-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1.35fr)
            minmax(0, 1fr);

          gap: 55px;

          width: 100%;
          align-items: start;
        }

        .print-left,
        .print-right {
          min-width: 0;
        }

        /* =====================================================
           SECTION
        ===================================================== */

        .paper-section {
          margin-bottom: 24px;

          break-inside: avoid;
          page-break-inside: avoid;
        }

        .paper-section-title {
          margin: 0 0 6px 0;

          padding-bottom: 6px;

          border-bottom: 1px solid #222;

          font-size: 14px;

          font-weight: 700;

          text-transform: uppercase;

          letter-spacing: 0.04em;

          line-height: 1.3;
        }

        /* =====================================================
           ROW
        ===================================================== */

        .paper-row {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          min-height: 28px;

          padding: 4px 0;

          border-bottom: 1px solid #b8bec7;

          font-size: 13px;

          line-height: 1.35;

          color: #111;
        }

        .paper-row:last-child {
          border-bottom-color: #222;
        }

        .paper-row-label {
          min-width: 0;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .paper-row-value {
          flex-shrink: 0;

          white-space: nowrap;

          text-align: right;
        }

        /* =====================================================
           EMPTY MESSAGE
        ===================================================== */

        .paper-empty {
          font-size: 13px;

          padding: 8px 0;

          color: #666;
        }

        /* =====================================================
           OUTSTANDING COUNT
        ===================================================== */

        .outstanding-count {
          margin-top: 9px;

          font-size: 13px;

          color: #111;
        }

        /* =====================================================
           PRINT
        ===================================================== */

        @media print {

          html,
          body {
            width: 297mm;

            min-height: 210mm;

            margin: 0 !important;

            padding: 0 !important;

            background: #fff !important;
          }

          body {
            -webkit-print-color-adjust: exact;

            print-color-adjust: exact;
          }

          /* -----------------------------------------------
             PAGE WRAPPER
          ------------------------------------------------ */

          .report-page {
            width: 297mm !important;

            min-height: 210mm !important;

            height: auto !important;

            margin: 0 !important;

            padding: 0 !important;

            background: #fff !important;
          }

          /* -----------------------------------------------
             PAPER
          ------------------------------------------------ */

          .report-container {
            width: 297mm !important;

            max-width: none !important;

            min-height: 210mm !important;

            margin: 0 !important;

            padding: 13mm 15mm !important;

            box-sizing: border-box;

            background: #fff !important;

            box-shadow: none !important;
          }

          /* -----------------------------------------------
             HIDE CONTROLS
          ------------------------------------------------ */

          .no-print {
            display: none !important;
          }

          /* -----------------------------------------------
             HEADER
          ------------------------------------------------ */

          .print-header {
            margin-bottom: 0 !important;

            break-inside: avoid !important;

            page-break-inside: avoid !important;
          }

          .report-header-title {
            font-size: 21px !important;

            line-height: 1.25 !important;

            letter-spacing: 0.08em !important;
          }

          .report-meta {
            font-size: 12px !important;

            line-height: 1.4 !important;
          }

          .report-divider {
            margin-top: 12px !important;

            margin-bottom: 17px !important;
          }

          /* -----------------------------------------------
             TWO COLUMNS
          ------------------------------------------------ */

          .print-grid {
            display: grid !important;

            grid-template-columns:
              minmax(0, 1.35fr)
              minmax(0, 1fr) !important;

            gap: 12mm !important;

            width: 100% !important;

            align-items: start !important;
          }

          .print-left,
          .print-right {
            display: block !important;

            width: auto !important;

            padding: 0 !important;

            min-width: 0 !important;
          }

          /* -----------------------------------------------
             SECTIONS
          ------------------------------------------------ */

          .paper-section {
            margin-bottom: 13px !important;

            break-inside: avoid !important;

            page-break-inside: avoid !important;
          }

          .paper-section-title {
            font-size: 12px !important;

            line-height: 1.3 !important;

            padding-bottom: 4px !important;

            margin-bottom: 3px !important;
          }

          /* -----------------------------------------------
             ROWS
          ------------------------------------------------ */

          .paper-row {
            min-height: 22px !important;

            padding: 2.5px 0 !important;

            font-size: 11.5px !important;

            line-height: 1.3 !important;

            gap: 15px !important;
          }

          .paper-empty {
            font-size: 11.5px !important;

            padding: 6px 0 !important;
          }

          .outstanding-count {
            margin-top: 7px !important;

            font-size: 11.5px !important;
          }

          /* -----------------------------------------------
             PREVENT COLUMNS FROM BEING FORCED APART
          ------------------------------------------------ */

          .print-left,
          .print-right,
          .paper-section {
            break-before: auto !important;

            page-break-before: auto !important;
          }

          /* -----------------------------------------------
             KEEP THE HEADER + MAIN GRID TOGETHER
          ------------------------------------------------ */

          .report-container {
            break-inside: auto !important;

            page-break-inside: auto !important;
          }
        }

      `}</style>

      <div className="mx-auto report-container">
        {/* =================================================
            TOP TOOLBAR
        ================================================= */}

        <div className="flex items-center justify-between mb-6 no-print">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Report
          </p>

          <button
            onClick={() => window.print()}
            className="
              flex
              items-center
              gap-2
              text-xs
              uppercase
              tracking-widest
              text-muted
              hover:text-ink
              transition-colors
            "
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        {/* =================================================
            REPORT HEADER
        ================================================= */}

        <div className="text-center mb-4 print-header">
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink report-header-title">
            Payment Collection Report
          </h1>

          <p className="text-[13px] text-ink mt-1 report-meta">
            Report Date: {formatDate(batch?.date)}
          </p>

          <p className="text-[13px] text-ink report-meta">
            Report Time: {formatTime(generatedAt)}
          </p>
        </div>

        <div className="border-t-2 border-ink mb-4 print-divider report-divider" />

        {/* =================================================
            MAIN REPORT
        ================================================= */}

        <div className="print-grid">
          {/* =================================================
              COLUMN ONE
          ================================================= */}

          <div className="print-left">
            {/* SUMMARY */}

            <Section title="Summary">
              <Row label="Vouchers" value={summary.totalVouchers} />

              <Row
                label="Gross Sale"
                value={formatCurrency(summary.totalAmount)}
              />

              <Row label="Cash Receipts" value={formatCurrency(summary.cash)} />

              <Row
                label="Bank Receipts"
                value={formatCurrency(summary.totalBank)}
              />

              <Row
                label="Total Received"
                value={formatCurrency(summary.totalPaid)}
                strong
              />

              <Row
                label="Goods Return"
                value={formatCurrency(summary.totalGoodsReturn)}
              />

              <Row
                label="Discount Allowed"
                value={formatCurrency(summary.totalDiscount)}
              />

              <Row
                label="Outstanding"
                value={formatCurrency(summary.totalOutstanding)}
                strong
              />

              <Row label="Sales Quantity" value={summary.totalQuantity} />
            </Section>

            {/* BANK ACCOUNT BREAKDOWN */}

            <Section title="Bank Account Breakdown">
              {bankEntries.length === 0 ? (
                <p className="paper-empty italic">No bank payments recorded.</p>
              ) : (
                bankEntries.map(([bank, amount]) => (
                  <Row key={bank} label={bank} value={formatCurrency(amount)} />
                ))
              )}
            </Section>

            {/* EXPENSES */}

            <Section title="Expenses">
              {expenseList.length === 0 ? (
                <p className="paper-empty italic">No expenses recorded.</p>
              ) : (
                expenseList.map((e) => (
                  <Row
                    key={e._id}
                    label={
                      e.category + (e.description ? ` — ${e.description}` : "")
                    }
                    value={formatCurrency(e.amount)}
                  />
                ))
              )}

              <Row
                label="Total Expenses"
                value={formatCurrency(expenseTotals.totalExpenses)}
                strong
              />

              <Row label="Net" value={formatCurrency(net.net)} strong />
            </Section>
          </div>

          {/* =================================================
              COLUMN TWO — OUTSTANDING
          ================================================= */}

          <div className="print-right">
            <Section title="Outstanding Summary">
              {outstanding.length === 0 ? (
                <p className="paper-empty italic">Nothing outstanding.</p>
              ) : (
                outstanding.map((v) => (
                  <Row
                    key={v._id}
                    label={v.partyName}
                    value={formatCurrency(v.outstanding)}
                  />
                ))
              )}

              {outstanding.length > 0 && (
                <p className="outstanding-count">
                  Outstanding Vouchers Count:{" "}
                  <strong>{outstanding.length}</strong>
                </p>
              )}
            </Section>
          </div>
        </div>

        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 mt-8 no-print">
          <Button variant="secondary" onClick={onViewOutstanding}>
            Outstanding
          </Button>

          <Button variant="secondary" onClick={onViewAllVouchers}>
            All Vouchers
          </Button>

          <Button variant="secondary" onClick={onViewExpenses}>
            Expenses
          </Button>

          <Button variant="secondary" onClick={onAddMore}>
            + Add More
          </Button>

          <Button variant="ghost" onClick={onResetDay} className="col-span-2">
            Start New Day
          </Button>
        </div>

        {/* =================================================
            QUANTITY SAVE
        ================================================= */}

        {onSaveQuantity && (
          <div className="mt-6 pt-6 border-t border-line flex items-end gap-3 no-print">
            <div className="flex-1 max-w-[180px]">
              <NumberInput
                label="Total Quantity Sold Today"
                value={quantityDraft}
                onChange={setQuantityDraft}
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => onSaveQuantity(quantityDraft)}
              disabled={!quantityDirty || savingQuantity}
              className="mb-px"
            >
              {savingQuantity ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
