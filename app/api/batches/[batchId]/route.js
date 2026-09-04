import { connectToDatabase } from "@/lib/mongodb";
import Batch from "@/lib/models/Batch";
import Voucher from "@/lib/models/Voucher";
import Expense from "@/lib/models/Expense";
import { jsonOk, jsonError, serialize } from "@/lib/apiHelpers";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const batch = await Batch.findById(params.batchId).lean();
    if (!batch) return jsonError("Batch not found.", 404);
    return jsonOk({ batch: serialize(batch) });
  } catch (err) {
    return jsonError(err.message || "Failed to load batch.", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const update = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.status !== undefined) update.status = body.status;
    if (body.totalQuantity !== undefined) update.totalQuantity = Number(body.totalQuantity) || 0;

    const batch = await Batch.findByIdAndUpdate(params.batchId, update, {
      new: true,
    }).lean();
    if (!batch) return jsonError("Batch not found.", 404);
    return jsonOk({ batch: serialize(batch) });
  } catch (err) {
    return jsonError(err.message || "Failed to update batch.", 500);
  }
}

// Permanent, destructive deletion of a batch and everything in it.
// Only used for an explicit "delete this day permanently" action -
// the normal "reset day" flow never calls this.
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { batchId } = params;
    await Promise.all([
      Voucher.deleteMany({ batchId }),
      Expense.deleteMany({ batchId }),
      Batch.findByIdAndDelete(batchId),
    ]);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err.message || "Failed to delete batch.", 500);
  }
}
