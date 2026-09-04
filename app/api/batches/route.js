import { connectToDatabase } from "@/lib/mongodb";
import Batch from "@/lib/models/Batch";
import { jsonOk, jsonError, serializeMany, serialize } from "@/lib/apiHelpers";

export async function GET() {
  try {
    await connectToDatabase();
    const batches = await Batch.find().sort({ createdAt: -1 }).lean();
    return jsonOk({ batches: serializeMany(batches) });
  } catch (err) {
    return jsonError(err.message || "Failed to load batches.", 500);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const batch = await Batch.create({
      date: body.date ? new Date(body.date) : new Date(),
      name: body.name || "",
      status: "active",
    });
    return jsonOk({ batch: serialize(batch) }, { status: 201 });
  } catch (err) {
    return jsonError(err.message || "Failed to create batch.", 500);
  }
}
