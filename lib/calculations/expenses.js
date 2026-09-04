/**
 * Expense calculations are intentionally independent of voucher
 * calculations. They are combined only at the final reporting layer.
 */

export function calculateExpenseTotals(expenses) {
  let totalExpenses = 0;
  const byCategory = {};
  const byPaymentMethod = {};

  expenses.forEach((e) => {
    const amount = Number(e.amount) || 0;
    totalExpenses += amount;

    const category = e.category || "Miscellaneous";
    byCategory[category] = (byCategory[category] || 0) + amount;

    const method = e.paymentMethod || "Cash";
    byPaymentMethod[method] = (byPaymentMethod[method] || 0) + amount;
  });

  return {
    totalExpenses,
    byCategory,
    byPaymentMethod,
    count: expenses.length,
  };
}

/**
 * Combines a voucher report summary with expense totals into a single
 * net figure, without mixing the two calculation domains upstream.
 */
export function calculateNetSummary(voucherSummary, expenseTotals) {
  const net = (voucherSummary.totalPaid || 0) - (expenseTotals.totalExpenses || 0);
  return {
    totalSales: voucherSummary.totalAmount || 0,
    paymentsReceived: voucherSummary.totalPaid || 0,
    outstanding: voucherSummary.totalOutstanding || 0,
    totalExpenses: expenseTotals.totalExpenses || 0,
    net,
  };
}

export default { calculateExpenseTotals, calculateNetSummary };
