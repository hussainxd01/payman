import { connectToDatabase } from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";
import { jsonOk, jsonError, serializeMany, serialize } from "@/lib/apiHelpers";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    const query = { batchId: params.batchId };
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(query).sort({ createdAt: -1 }).lean();
    return jsonOk({ expenses: serializeMany(expenses) });
  } catch (err) {
    return jsonError(err.message || "Failed to load expenses.", 500);
  }
}

export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    if (!body.amount || Number(body.amount) <= 0) {
      return jsonError("Expense amount must be greater than zero.", 422);
    }

    const expense = await Expense.create({
      batchId: params.batchId,
      date: body.date ? new Date(body.date) : new Date(),
      category: body.category || "Miscellaneous",
      description: body.description || "",
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod || "Cash",
      notes: body.notes || "",
    });

    return jsonOk({ expense: serialize(expense) }, { status: 201 });
  } catch (err) {
    return jsonError(err.message || "Failed to add expense.", 500);
  }
}
