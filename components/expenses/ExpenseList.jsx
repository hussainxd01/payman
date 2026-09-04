"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import VoucherSearch from "@/components/vouchers/VoucherSearch";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { EmptyState, formatCurrency } from "@/components/ui/Shared";

export default function ExpenseList({
  expenses,
  onBack,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  saving,
}) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleSave = async (data) => {
    if (editing) {
      await onUpdateExpense(editing._id, data);
    } else {
      await onAddExpense(data);
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          ← Report
        </button>

        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Expenses
          </p>
          <span className="text-sm tabular-nums text-muted">
            Total {formatCurrency(total)}
          </span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight mb-6">
          {expenses.length} expense{expenses.length === 1 ? "" : "s"}
        </h1>

        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <VoucherSearch value={search} onChange={setSearch} placeholder="Search expenses..." />
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="shrink-0"
          >
            <Plus size={14} /> Add
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={search ? "No matching expenses" : "No expenses yet"}
              description={search ? "Try a different search." : "Add your first expense for the day."}
            />
          </div>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {filtered.map((e) => (
              <div
                key={e._id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => {
                    setEditing(e);
                    setFormOpen(true);
                  }}
                >
                  <p className="text-sm">
                    {e.category}
                    {e.description ? ` — ${e.description}` : ""}
                  </p>
                  <p className="text-xs text-muted uppercase tracking-widest mt-1">
                    {e.paymentMethod}
                  </p>
                </button>
                <span className="text-sm tabular-nums shrink-0">
                  {formatCurrency(e.amount)}
                </span>
                <button
                  onClick={() => onDeleteExpense(e._id)}
                  aria-label="Delete expense"
                  className="text-muted hover:text-red-700 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
        saving={saving}
      />
    </div>
  );
}
