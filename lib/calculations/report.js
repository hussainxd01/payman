import {
  calculateVoucherOutstanding,
  getVoucherStatus,
} from "./voucher.js";

/**
 * Aggregates payment totals (cash / bank) plus a per-bank breakdown
 * across a list of vouchers. Nothing here is stored - it is always
 * recomputed from the current voucher documents.
 */
export function calculatePaymentTotals(vouchers) {
  let cash = 0;
  const bankBreakdown = {};

  vouchers.forEach((voucher) => {
    const payments = voucher.payments || {};
    cash += Number(payments.cash) || 0;

    (payments.banks || []).forEach((b) => {
      const name = b.bankName || "Unnamed Bank";
      bankBreakdown[name] = (bankBreakdown[name] || 0) + (Number(b.amount) || 0);
    });
  });

  const totalBank = Object.values(bankBreakdown).reduce((s, v) => s + v, 0);

  return {
    cash,
    totalBank,
    bankBreakdown,
  };
}

export function calculateOutstandingVouchers(vouchers) {
  return vouchers
    .map((v) => ({
      voucher: v,
      outstanding: calculateVoucherOutstanding(v),
      status: getVoucherStatus(v),
    }))
    .filter((entry) => entry.outstanding > 0 || !!entry.voucher.markedOutstanding);
}

/**
 * Full batch summary. This is the single function report UI and API
 * routes should call - it is the "current truth" derived from vouchers.
 */
export function calculateBatchSummary(vouchers) {
  const totals = calculatePaymentTotals(vouchers);

  let totalAmount = 0;
  let totalDiscount = 0;
  let totalGoodsReturn = 0;
  let totalOutstanding = 0;
  let paidCount = 0;
  let partialCount = 0;
  let outstandingCount = 0;

  vouchers.forEach((v) => {
    totalAmount += Number(v.totalAmount) || 0;
    totalDiscount += Number(v.discount) || 0;
    totalGoodsReturn += Number(v.goodsReturn) || 0;

    const outstanding = calculateVoucherOutstanding(v);
    totalOutstanding += outstanding;

    const status = getVoucherStatus(v);
    if (status === "PAID") paidCount += 1;
    else if (status === "PARTIAL") partialCount += 1;
    else outstandingCount += 1;
  });

  const totalPaid = totals.cash + totals.totalBank;

  const outstandingVouchers = calculateOutstandingVouchers(vouchers).map((e) => ({
    _id: e.voucher._id,
    voucherNumber: e.voucher.voucherNumber,
    partyName: e.voucher.partyName,
    totalAmount: e.voucher.totalAmount,
    outstanding: e.outstanding,
    status: e.status,
  }));

  return {
    totalVouchers: vouchers.length,
    totalAmount,
    totalPaid,
    totalOutstanding,
    totalDiscount,
    totalGoodsReturn,
    cash: totals.cash,
    totalBank: totals.totalBank,
    bankBreakdown: totals.bankBreakdown,
    statusCounts: {
      paid: paidCount,
      partial: partialCount,
      outstanding: outstandingCount,
    },
    outstandingVouchers,
    outstandingCount: outstandingVouchers.length,
  };
}

export default {
  calculatePaymentTotals,
  calculateOutstandingVouchers,
  calculateBatchSummary,
};
