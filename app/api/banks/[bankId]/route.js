import { connectToDatabase } from "@/lib/mongodb";
import Bank from "@/lib/models/Bank";
import { jsonOk, jsonError } from "@/lib/apiHelpers";

// Removes a bank from the shared bank list (e.g. one created by mistake
// or a typo). This only removes it from the picker going forward -
// any voucher that already recorded a payment under that bank name
// keeps its own copy of the name and is completely unaffected, since
// payments.banks stores the name directly rather than a reference.
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const result = await Bank.findByIdAndDelete(params.bankId);
    if (!result) return jsonError("Bank not found.", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err.message || "Failed to delete bank.", 500);
  }
}
