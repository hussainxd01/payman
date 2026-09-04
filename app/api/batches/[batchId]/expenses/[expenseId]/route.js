import { connectToDatabase } from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";
import { jsonOk, jsonError, serialize } from "@/lib/apiHelpers";

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const update = {};
    if (body.category !== undefined) update.category = body.category;
    if (body.description !== undefined) update.description = body.description;
    if (body.amount !== undefined) {
      if (Number(body.amount) <= 0) return jsonError("Expense amount must be greater than zero.", 422);
      update.amount = Number(body.amount);
    }
    if (body.paymentMethod !== undefined) update.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.date !== undefined) update.date = new Date(body.date);

    const expense = await Expense.findOneAndUpdate(
      { _id: params.expenseId, batchId: params.batchId },
      update,
      { new: true }
    ).lean();
    if (!expense) return jsonError("Expense not found.", 404);

    return jsonOk({ expense: serialize(expense) });
  } catch (err) {
    return jsonError(err.message || "Failed to update expense.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const result = await Expense.findOneAndDelete({
      _id: params.expenseId,
      batchId: params.batchId,
    });
    if (!result) return jsonError("Expense not found.", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err.message || "Failed to delete expense.", 500);
  }
}
