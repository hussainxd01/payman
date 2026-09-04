import { connectToDatabase } from "@/lib/mongodb";
import Bank from "@/lib/models/Bank";
import { jsonOk, jsonError, serializeMany, serialize } from "@/lib/apiHelpers";

const DEFAULT_BANKS = [
  "HDFC Bank",
  "SBI",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
];

export async function GET() {
  try {
    await connectToDatabase();
    let banks = await Bank.find().sort({ name: 1 }).lean();

    if (banks.length === 0) {
      // Seed with sensible defaults on first use - still fully editable.
      await Bank.insertMany(DEFAULT_BANKS.map((name) => ({ name })));
      banks = await Bank.find().sort({ name: 1 }).lean();
    }

    return jsonOk({ banks: serializeMany(banks) });
  } catch (err) {
    return jsonError(err.message || "Failed to load banks.", 500);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const name = (body.name || "").trim();
    if (!name) return jsonError("Bank name is required.", 422);

    const existing = await Bank.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (existing) return jsonOk({ bank: serialize(existing) });

    const bank = await Bank.create({ name });
    return jsonOk({ bank: serialize(bank) }, { status: 201 });
  } catch (err) {
    return jsonError(err.message || "Failed to add bank.", 500);
  }
}
