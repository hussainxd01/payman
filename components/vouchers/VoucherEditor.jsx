"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  AlertTriangle,
  ChevronLeft,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Percent,
} from "lucide-react";
import Button from "@/components/ui/Button";
import NumberInput from "@/components/ui/NumberInput";
import BankCombobox from "@/components/ui/BankCombobox";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { formatCurrency } from "@/components/ui/Shared";
import {
  calculateVoucherPaidTotal,
  calculateVoucherOutstanding,
} from "@/lib/calculations/voucher";

function buildFormState(voucher) {
  return {
    cash: voucher?.payments?.cash || 0,
    banks: (voucher?.payments?.banks || []).map((b) => ({ ...b })),
    discount: voucher?.discount || 0,
    goodsReturn: voucher?.goodsReturn || 0,
  };
}

/**
 * Keyboard flow: Cash -> (Enter) -> new bank amount -> (Enter) ->
 * searchable bank name -> (Enter, commits the row) -> Discount ->
 * (Enter) -> Goods Return -> (Enter) triggers Save & Next / Save Changes.
 * Leaving the amount/bank fields empty and pressing Enter just skips
 * straight to Discount, so a no-bank voucher flows through cleanly.
 * Backspace on an empty field moves back to the previous field instead
 * of doing nothing, so the whole chain works in both directions.
 * Pressing "o" anywhere except the bank search field marks the voucher
 * as Outstanding, same as clicking the button.
 *
 * mode: "process" - sequential entry flow, primary action is Save & Next
 *       "edit"    - editing an already-reported voucher, primary action is Save Changes
 */
export default function VoucherEditor({
  voucher,
  index,
  total,
  mode = "process",
  banks,
  onAddBank,
  onDeleteBank,
  onSave,
  onPrevious,
  onBack,
  saving,
  error,
}) {
  const [form, setForm] = useState(() => buildFormState(voucher));
  const [addAmount, setAddAmount] = useState(0);
  const [bankPendingDelete, setBankPendingDelete] = useState(null);
  const [deletingBank, setDeletingBank] = useState(false);

  const cashRef = useRef(null);
  const addAmountRef = useRef(null);
  const addBankNameRef = useRef(null);
  const discountRef = useRef(null);
  const goodsReturnRef = useRef(null);

  useEffect(() => {
    setForm(buildFormState(voucher));
    setAddAmount(0);
    // Land the cursor on Cash every time a new voucher loads.
    cashRef.current?.focus();
  }, [voucher?._id]);

  const updateBankAmount = (i, amount) => {
    setForm((f) => {
      const nextBanks = [...f.banks];
      nextBanks[i] = { ...nextBanks[i], amount };
      return { ...f, banks: nextBanks };
    });
  };

  const removeBank = (i) => {
    setForm((f) => ({ ...f, banks: f.banks.filter((_, idx) => idx !== i) }));
  };

  // Called when the searchable bank field commits (Enter or a click).
  // An empty name means the user left it blank - skip adding a bank.
  const handleBankCommit = async (name) => {
    if (!name) {
      discountRef.current?.focus();
      return;
    }

    const existing = (banks || []).find(
      (b) => b.name.toLowerCase() === name.toLowerCase(),
    );
    const finalName = existing ? existing.name : name;
    if (!existing) {
      await onAddBank(name);
    }

    setForm((f) => {
      const idx = f.banks.findIndex(
        (b) => b.bankName.toLowerCase() === finalName.toLowerCase(),
      );
      if (idx >= 0) {
        const next = [...f.banks];
        next[idx] = {
          ...next[idx],
          amount: (Number(next[idx].amount) || 0) + (addAmount || 0),
        };
        return { ...f, banks: next };
      }
      return {
        ...f,
        banks: [...f.banks, { bankName: finalName, amount: addAmount || 0 }],
      };
    });

    setAddAmount(0);
    discountRef.current?.focus();
  };

  // The bank picker's x button doesn't delete immediately - it asks the
  // parent to confirm first, since this removes the bank from the shared
  // list for everyone, not just from this voucher.
  const handleRequestDeleteBank = (bank) => {
    setBankPendingDelete(bank);
  };

  const handleConfirmDeleteBank = async () => {
    if (!bankPendingDelete) return;
    setDeletingBank(true);
    try {
      await onDeleteBank(bankPendingDelete);
      setBankPendingDelete(null);
    } finally {
      setDeletingBank(false);
    }
  };

  const handleFieldKeyDown = (nextRef, prevRef) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    } else if (e.key === "Backspace" && e.target.value === "" && prevRef) {
      // Field is already empty - Backspace here means "go back to the
      // previous field" rather than deleting nothing.
      e.preventDefault();
      prevRef.current?.focus();
    }
  };

  const previewVoucher = {
    totalAmount: voucher.totalAmount,
    discount: form.discount,
    goodsReturn: form.goodsReturn,
    payments: { cash: form.cash, banks: form.banks },
  };
  const paidTotal = calculateVoucherPaidTotal(previewVoucher);
  // Outstanding (never negative - what's still owed, or 0). Used for the
  // Mark as Outstanding button/shortcut, which only makes sense while
  // something is still owed.
  const outstanding = calculateVoucherOutstanding(previewVoucher);
  // Raw balance (can go negative) - what the balance box shows, so
  // overpaying a voucher is visible as a negative number instead of
  // silently flooring at 0.
  const rawBalance =
    (Number(voucher.totalAmount) || 0) -
    (Number(form.discount) || 0) -
    (Number(form.goodsReturn) || 0) -
    paidTotal;

  const isOverpaid = rawBalance < 0;
  const isFullyPaid = rawBalance === 0;
  const balanceBoxClass = isOverpaid
    ? "bg-red-50 border-red-200"
    : isFullyPaid
      ? "bg-emerald-50 border-emerald-200"
      : "bg-slate-50 border-line";
  const balanceTextClass = isOverpaid
    ? "text-red-700"
    : isFullyPaid
      ? "text-emerald-700"
      : "text-ink";
  const BalanceIcon = isOverpaid
    ? AlertCircle
    : isFullyPaid
      ? CheckCircle2
      : Wallet;
  const balanceLabel = isOverpaid
    ? "Overpaid"
    : isFullyPaid
      ? "Fully Paid"
      : "Remaining";

  const buildSaveData = (extra) => ({
    payments: { cash: form.cash, banks: form.banks },
    discount: form.discount,
    goodsReturn: form.goodsReturn,
    isProcessed: true,
    markedOutstanding: false,
    ...extra,
  });

  const handleSave = async () => {
    await onSave(buildSaveData(), { advance: mode === "process" });
  };

  const handleMarkOutstanding = async () => {
    if (outstanding <= 0) return;
    await onSave(buildSaveData({ markedOutstanding: true }), {
      advance: mode === "process",
    });
  };

  const handleGoodsReturnKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Backspace" && e.target.value === "") {
      e.preventDefault();
      discountRef.current?.focus();
    }
  };

  // "o" anywhere in the editor marks the voucher as outstanding, except
  // while typing in the bank search field (where "o" is a normal letter
  // you might be searching for, e.g. "Bank of India").
  useEffect(() => {
    const handleWindowKeyDown = (e) => {
      if (e.key.toLowerCase() !== "o") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.activeElement === addBankNameRef.current) return;
      if (saving || outstanding <= 0) return;
      e.preventDefault();
      handleMarkOutstanding();
    };
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saving, outstanding]);

  const progressPct = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-6">
      <div className="w-full max-w-md">
        {/* Top bar: back link + step counter */}
        <div className="flex items-center justify-between mb-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={14} />
              {mode === "edit" ? "All Vouchers" : "Vouchers"}
            </button>
          ) : (
            <span />
          )}
          {mode === "process" && total > 0 && (
            <span className="text-[11px] font-medium text-muted tabular-nums">
              {index + 1} / {total}
            </span>
          )}
        </div>

        {mode === "process" && total > 0 && (
          <div className="h-1.5 w-full bg-line rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-line rounded-2xl shadow-sm p-5">
          {/* Voucher header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">
                {mode === "edit" ? "Editing Voucher" : "Voucher"}
              </p>
              <h1 className="text-lg font-semibold text-ink truncate leading-tight">
                {voucher.partyName}
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {voucher.voucherNumber}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">
                Amount
              </p>
              <p className="text-base font-semibold text-ink tabular-nums">
                {formatCurrency(voucher.totalAmount)}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Live balance */}
          <div
            className={`mb-4 rounded-xl border px-4 py-3 flex items-center justify-between transition-colors ${balanceBoxClass}`}
          >
            <span
              className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${balanceTextClass}`}
            >
              <BalanceIcon size={14} />
              {balanceLabel}
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${balanceTextClass}`}
            >
              {formatCurrency(rawBalance)}
            </span>
          </div>

          {/* Payment section */}
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <Banknote size={12} />
            Payment
          </div>
          <div className="space-y-2.5 pb-4 mb-4 border-b border-line">
            <NumberInput
              ref={cashRef}
              label="Cash"
              value={form.cash}
              onChange={(v) => setForm((f) => ({ ...f, cash: v }))}
              onKeyDown={handleFieldKeyDown(addAmountRef, null)}
            />

            {form.banks.length > 0 && (
              <div className="space-y-2">
                {form.banks.map((b, i) => (
                  <div key={b.bankName} className="flex items-end gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] text-muted mb-1">
                        {b.bankName}
                      </p>
                      <NumberInput
                        value={b.amount}
                        onChange={(v) => updateBankAmount(i, v)}
                        onKeyDown={handleFieldKeyDown(addAmountRef, cashRef)}
                      />
                    </div>
                    <button
                      onClick={() => removeBank(i)}
                      aria-label={`Remove ${b.bankName} from this voucher`}
                      title={`Remove ${b.bankName} from this voucher`}
                      className="mb-2.5 text-muted hover:text-red-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="w-24 shrink-0">
                <NumberInput
                  ref={addAmountRef}
                  label="+ Bank"
                  value={addAmount}
                  onChange={setAddAmount}
                  onKeyDown={handleFieldKeyDown(addBankNameRef, cashRef)}
                  placeholder="Amount"
                />
              </div>
              <div className="flex-1">
                <BankCombobox
                  ref={addBankNameRef}
                  banks={banks}
                  onCommit={handleBankCommit}
                  onDeleteBank={handleRequestDeleteBank}
                  onBackspaceEmpty={() => addAmountRef.current?.focus()}
                />
              </div>
            </div>
          </div>

          {/* Adjustments section */}
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <Percent size={12} />
            Adjustments
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <NumberInput
              ref={discountRef}
              label="Discount"
              value={form.discount}
              onChange={(v) => setForm((f) => ({ ...f, discount: v }))}
              onKeyDown={handleFieldKeyDown(goodsReturnRef, addBankNameRef)}
            />
            <NumberInput
              ref={goodsReturnRef}
              label="Goods Return"
              value={form.goodsReturn}
              onChange={(v) => setForm((f) => ({ ...f, goodsReturn: v }))}
              onKeyDown={handleGoodsReturnKeyDown}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted mb-4">
            <span>Paid so far</span>
            <span className="font-medium text-ink tabular-nums">
              {formatCurrency(paidTotal)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {mode === "process" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={onPrevious}
                  disabled={index === 0 || saving}
                >
                  Previous
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Saving..." : "Save & Next"}
                </Button>
              </>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>

          <button
            onClick={handleMarkOutstanding}
            disabled={saving || outstanding <= 0}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium uppercase tracking-wide text-amber-700 hover:text-amber-900 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <AlertTriangle size={14} />
            Mark Outstanding ({formatCurrency(outstanding)}) &middot; press
            &ldquo;o&rdquo;
          </button>
        </div>
      </div>

      <ConfirmModal
        open={!!bankPendingDelete}
        onClose={() => setBankPendingDelete(null)}
        onConfirm={handleConfirmDeleteBank}
        confirming={deletingBank}
        title="Delete this bank?"
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        danger
      >
        &ldquo;{bankPendingDelete?.name}&rdquo; will be removed from the bank
        list, so it won&rsquo;t show up as a search suggestion anymore. Vouchers
        that already have a payment recorded against it are not affected.
      </ConfirmModal>
    </div>
  );
}
