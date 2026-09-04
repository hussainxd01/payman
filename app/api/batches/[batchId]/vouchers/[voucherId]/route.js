import { connectToDatabase } from "@/lib/mongodb";
import Voucher from "@/lib/models/Voucher";
import { jsonOk, jsonError, serialize } from "@/lib/apiHelpers";
import { validateVoucherPayments } from "@/lib/calculations/voucher";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const voucher = await Voucher.findOne({
      _id: params.voucherId,
      batchId: params.batchId,
    }).lean();
    if (!voucher) return jsonError("Voucher not found.", 404);
    return jsonOk({ voucher: serialize(voucher) });
  } catch (err) {
    return jsonError(err.message || "Failed to load voucher.", 500);
  }
}

// Used both by the sequential processing flow (Save & Next) and by
// editing an already-reported voucher (Save Changes). Same endpoint,
// same validation, same recalculation-on-read guarantee.
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const update = {};
    if (body.payments) {
      update.payments = {
        cash: Number(body.payments.cash) || 0,
        banks: Array.isArray(body.payments.banks)
          ? body.payments.banks
              .filter((b) => b.bankName)
              .map((b) => ({ bankName: b.bankName, amount: Number(b.amount) || 0 }))
          : [],
      };
    }
    if (body.discount !== undefined) update.discount = Number(body.discount) || 0;
    if (body.goodsReturn !== undefined) update.goodsReturn = Number(body.goodsReturn) || 0;
    if (body.partyName !== undefined) update.partyName = body.partyName;
    // totalAmount is protected from casual edits - only applied if explicitly sent.
    if (body.allowTotalAmountEdit && body.totalAmount !== undefined) {
      update.totalAmount = Number(body.totalAmount) || 0;
    }
    if (body.isProcessed !== undefined) update.isProcessed = !!body.isProcessed;
    if (body.markedOutstanding !== undefined) update.markedOutstanding = !!body.markedOutstanding;

    const existing = await Voucher.findOne({
      _id: params.voucherId,
      batchId: params.batchId,
    }).lean();
    if (!existing) return jsonError("Voucher not found.", 404);

    const merged = { ...existing, ...update };
    const validationErrors = validateVoucherPayments(merged);
    if (validationErrors.length > 0) {
      return jsonError(validationErrors.join(" "), 422);
    }

    const voucher = await Voucher.findOneAndUpdate(
      { _id: params.voucherId, batchId: params.batchId },
      update,
      { new: true, runValidators: true }
    ).lean();

    return jsonOk({ voucher: serialize(voucher) });
  } catch (err) {
    return jsonError(err.message || "Failed to save voucher.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const result = await Voucher.findOneAndDelete({
      _id: params.voucherId,
      batchId: params.batchId,
    });
    if (!result) return jsonError("Voucher not found.", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err.message || "Failed to delete voucher.", 500);
  }
}
