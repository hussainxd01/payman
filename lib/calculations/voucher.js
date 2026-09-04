/**
 * Centralized, pure calculation helpers for a single voucher.
 * A voucher's financial status is always derived from its stored
 * amounts - never trusted from a stored "status" field.
 */

export function calculateBankTotal(voucher) {
  const banks = voucher?.payments?.banks || [];
  return banks.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
}

export function calculateVoucherPaidTotal(voucher) {
  const payments = voucher?.payments || {};
  const cash = Number(payments.cash) || 0;
  const bank = calculateBankTotal(voucher);
  return cash + bank;
}

export function calculateVoucherOutstanding(voucher) {
  const totalAmount = Number(voucher?.totalAmount) || 0;
  const discount = Number(voucher?.discount) || 0;
  const goodsReturn = Number(voucher?.goodsReturn) || 0;
  const paid = calculateVoucherPaidTotal(voucher);
  const netDue = totalAmount - discount - goodsReturn;
  return Math.max(0, Math.round((netDue - paid) * 100) / 100);
}

/**
 * Returns "PAID" | "PARTIAL" | "OUTSTANDING" derived purely from amounts,
 * unless the voucher has been manually marked outstanding (a deliberate
 * override, e.g. a cheque that's expected to bounce or a promised
 * follow-up payment), in which case it is always treated as OUTSTANDING
 * as long as any balance remains.
 */
export function getVoucherStatus(voucher) {
  const outstanding = calculateVoucherOutstanding(voucher);
  const paid = calculateVoucherPaidTotal(voucher);

  if (voucher?.markedOutstanding && outstanding > 0) return "OUTSTANDING";
  if (outstanding <= 0.01) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "OUTSTANDING";
}

export function validateVoucherPayments(voucher) {
  const errors = [];
  const totalAmount = Number(voucher?.totalAmount) || 0;

  if (totalAmount <= 0) errors.push("Total amount must be greater than zero.");

  const payments = voucher?.payments || {};
  if (Number(payments.cash) < 0) errors.push("Cash cannot be negative.");
  (payments.banks || []).forEach((b, i) => {
    if (Number(b.amount) < 0) errors.push(`Bank payment #${i + 1} cannot be negative.`);
    if (!b.bankName) errors.push(`Bank payment #${i + 1} is missing a bank name.`);
  });

  if (Number(voucher?.discount) < 0) errors.push("Discount cannot be negative.");
  if (Number(voucher?.goodsReturn) < 0) errors.push("Goods return cannot be negative.");

  const paid = calculateVoucherPaidTotal(voucher);
  const discount = Number(voucher?.discount) || 0;
  const goodsReturn = Number(voucher?.goodsReturn) || 0;
  if (paid + discount + goodsReturn > totalAmount + 0.01) {
    errors.push("Payments, discount and goods return exceed the voucher's total amount.");
  }

  return errors;
}

export default {
  calculateBankTotal,
  calculateVoucherPaidTotal,
  calculateVoucherOutstanding,
  getVoucherStatus,
  validateVoucherPayments,
};
