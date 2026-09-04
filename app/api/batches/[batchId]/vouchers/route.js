import { connectToDatabase } from "@/lib/mongodb";
import Voucher from "@/lib/models/Voucher";
import { jsonOk, jsonError, serializeMany } from "@/lib/apiHelpers";
import { validateVoucherPayments } from "@/lib/calculations/voucher";
import { sortVouchersNatural } from "@/lib/utils/naturalSort";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    const query = { batchId: params.batchId };
    if (search) {
      query.$or = [
        { voucherNumber: { $regex: search, $options: "i" } },
        { partyName: { $regex: search, $options: "i" } },
      ];
    }

    const vouchers = await Voucher.find(query).lean();
    return jsonOk({ vouchers: sortVouchersNatural(serializeMany(vouchers)) });
  } catch (err) {
    return jsonError(err.message || "Failed to load vouchers.", 500);
  }
}

// Bulk import parsed vouchers into this batch.
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body.vouchers) ? body.vouchers : [];

    if (incoming.length === 0) {
      return jsonError("No vouchers were provided to import.", 400);
    }

    // Guard against duplicate voucher numbers within this batch,
    // both against existing records and within the incoming payload.
    const existing = await Voucher.find({ batchId: params.batchId })
      .select("voucherNumber")
      .lean();
    const existingNumbers = new Set(
      existing.map((v) => v.voucherNumber.trim().toLowerCase())
    );

    const seenInPayload = new Set();
    const rejected = [];
    const toInsert = [];

    for (const v of incoming) {
      const key = String(v.voucherNumber || "").trim().toLowerCase();
      if (!key) {
        rejected.push({ voucherNumber: v.voucherNumber, reason: "missing voucher number" });
        continue;
      }
      if (existingNumbers.has(key) || seenInPayload.has(key)) {
        rejected.push({ voucherNumber: v.voucherNumber, reason: "duplicate voucher number" });
        continue;
      }

      const draft = {
        totalAmount: v.totalAmount,
        discount: v.discount || 0,
        goodsReturn: v.goodsReturn || 0,
        payments: { cash: 0, banks: [] },
      };
      const validationErrors = validateVoucherPayments(draft);
      if (validationErrors.length > 0) {
        rejected.push({ voucherNumber: v.voucherNumber, reason: validationErrors.join("; ") });
        continue;
      }

      seenInPayload.add(key);
      toInsert.push({
        batchId: params.batchId,
        voucherNumber: v.voucherNumber,
        partyName: v.partyName,
        totalAmount: v.totalAmount,
        discount: v.discount || 0,
        goodsReturn: v.goodsReturn || 0,
        payments: { cash: 0, banks: [] },
        isProcessed: false,
      });
    }

    let inserted = [];
    if (toInsert.length > 0) {
      inserted = await Voucher.insertMany(toInsert);
    }

    return jsonOk({
      imported: inserted.length,
      rejected,
      vouchers: serializeMany(inserted),
    }, { status: 201 });
  } catch (err) {
    return jsonError(err.message || "Failed to import vouchers.", 500);
  }
}

// Bulk-delete every voucher in this batch - used by "Reset / Delete All
// Vouchers" on the home screen. Deletes voucher records only; the batch
// itself and any expenses are left untouched.
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const result = await Voucher.deleteMany({ batchId: params.batchId });
    return jsonOk({ deleted: result.deletedCount || 0 });
  } catch (err) {
    return jsonError(err.message || "Failed to delete vouchers.", 500);
  }
}
