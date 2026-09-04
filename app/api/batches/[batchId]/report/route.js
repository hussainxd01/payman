import { connectToDatabase } from "@/lib/mongodb";
import Batch from "@/lib/models/Batch";
import Voucher from "@/lib/models/Voucher";
import Expense from "@/lib/models/Expense";
import { jsonOk, jsonError } from "@/lib/apiHelpers";
import { calculateBatchSummary } from "@/lib/calculations/report";
import { calculateExpenseTotals, calculateNetSummary } from "@/lib/calculations/expenses";
import { sortVouchersNatural } from "@/lib/utils/naturalSort";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const [batch, vouchers, expenses] = await Promise.all([
      Batch.findById(params.batchId).lean(),
      Voucher.find({ batchId: params.batchId }).lean(),
      Expense.find({ batchId: params.batchId }).lean(),
    ]);

    const voucherSummary = calculateBatchSummary(sortVouchersNatural(vouchers));
    // Total quantity is entered once per day on the batch itself, not
    // summed from individual vouchers.
    voucherSummary.totalQuantity = batch?.totalQuantity || 0;

    const expenseTotals = calculateExpenseTotals(expenses);
    const net = calculateNetSummary(voucherSummary, expenseTotals);

    return jsonOk({
      report: {
        vouchers: voucherSummary,
        expenses: expenseTotals,
        net,
      },
    });
  } catch (err) {
    return jsonError(err.message || "Failed to generate report.", 500);
  }
}
