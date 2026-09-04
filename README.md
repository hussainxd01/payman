# Payment & Voucher Tracker

A full-stack daily voucher/payment tracking app. Next.js App Router, plain
JavaScript/JSX (no TypeScript), Tailwind CSS, MongoDB via Mongoose.

MongoDB is the single source of truth for voucher data. Reports, totals,
outstanding amounts, and bank breakdowns are always calculated on the fly
from the current voucher documents — nothing is stored as a duplicate,
stale snapshot.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set MONGODB_URI / MONGODB_DB
npm run dev
```

Open http://localhost:3000.

You need a MongoDB instance (local `mongod`, Docker, or a free Atlas
cluster) reachable at the `MONGODB_URI` you set in `.env.local`.

## Workflow

1. **Paste today's voucher data** on the home screen. The paste box
   accepts a spreadsheet-style table with a header row —
   `Date  Vch/Bill No  Account  Total Amount` — and pulls out only the
   voucher number, party name, and amount (the Date column, and any
   other column, is recognized and ignored). Older `Voucher No: / Party:
   / Amount:` and simple `voucher, party, amount` formats still work too.
2. Review the **import preview** — duplicate voucher numbers and rows
   with problems are flagged before anything is written to MongoDB.
3. Work through the **voucher list**, opening each voucher and recording
   just **Cash** and any number of **bank payments** — pick a bank from
   the dropdown (or add a new one on the spot; it's saved for next time),
   enter the amount, repeat for as many banks as needed. A **Balance
   Remaining** figure sits right at the top of the editor and updates
   live as you type, so you never need to scroll to see what's left on
   a voucher. **Save & Next** advances to the next voucher.
4. If a voucher won't be fully paid today, use **Mark as Outstanding**
   instead — it saves whatever's been entered and tags the voucher so it
   always shows up in the Outstanding list with its true remaining
   balance.
5. After the last voucher, the **report** is generated — a compact,
   single-page summary (vouchers, total amount, cash, bank total with
   a per-bank breakdown, total paid, outstanding, expenses, net).
6. **Outstanding vouchers** get their own dedicated page (linked from
   the report) with the full list and amounts; the report itself just
   shows the count and total so it stays short.
7. From the report, open **All Vouchers** at any time, **Edit** any
   voucher (same editor, "Save Changes" instead of "Save & Next"), and
   the report recalculates immediately — no re-pasting needed.
8. **+ Add More** is available from the voucher list, all-vouchers view,
   and the report — paste additional rows in the same table format at
   any point and they're appended to the same batch (duplicate voucher
   numbers are still rejected).
9. **Expenses** are tracked separately (category, description, amount,
   payment method) and combined with voucher totals only at the final
   Net line of the report.
10. **Start New Day** clears the active working session and returns to
    the paste screen; existing records stay in MongoDB under their
    batch. **Delete All** (on the home screen) permanently removes every
    voucher in the current batch after confirmation, if you'd rather
    start completely clean instead.

## Project layout

```
app/
  page.jsx                 client-side workflow orchestrator
  api/batches/...           REST route handlers (see below)
components/
  home/                     paste screen (+ delete-all)
  vouchers/                 list, editor, add-more, search, progress, import preview
  report/                   compact report + dedicated outstanding page
  expenses/                 expense list + form
  ui/                       Button, Modal, ConfirmModal, Input, NumberInput, Textarea
lib/
  mongodb.js                cached connection helper
  models/                   Batch, Voucher, Expense, Bank (Mongoose)
  parsers/voucherParser.js  raw-text -> structured voucher parsing
                             (table / labeled-block / delimited formats)
  calculations/             voucher.js, report.js, expenses.js — all
                             totals/statuses are derived here and nowhere
                             else
  apiClient.js               thin fetch wrapper used by the frontend
```

## API

```
GET/POST   /api/batches
GET/PATCH/DELETE  /api/batches/:batchId

GET/POST/DELETE  /api/batches/:batchId/vouchers   (search, bulk import, bulk delete)
GET/PATCH/DELETE  /api/batches/:batchId/vouchers/:voucherId

GET        /api/batches/:batchId/report          (always recalculated)

GET/POST   /api/batches/:batchId/expenses
PATCH/DELETE  /api/batches/:batchId/expenses/:expenseId

GET/POST   /api/banks                            (add banks without code changes)
```

## Notes

- Voucher `status` (Paid / Partial / Outstanding) is never stored as the
  primary source of truth — it's derived from
  `totalAmount - discount - goodsReturn - (cash + banks)` via
  `getVoucherStatus()` in `lib/calculations/voucher.js`. The one
  exception is the manual `markedOutstanding` flag set by the "Mark as
  Outstanding" button, which forces OUTSTANDING as long as a balance
  remains — the *amount* shown is still always the live derived figure.
- A voucher can hold payments to an unlimited number of banks
  (`payments.banks: [{ bankName, amount }]`), selected via dropdown. The
  bank list lives in MongoDB (`Bank` model) and grows as users add new
  banks from the editor — no code changes needed.
- Amount fields use a custom `NumberInput` (plain text field, not
  `type="number"`) so scrolling the mouse wheel over a focused field
  never changes its value, and typing never produces a stray leading
  zero — the field just clears itself when it's showing 0 and you start
  typing.
- Voucher number and total amount are read-only in the editor to protect
  imported source data. UPI/cheque/other payment types and free-text
  notes were intentionally removed to keep the entry screen to Cash +
  Bank(s) + Discount + Goods Return, with no scrolling for a typical
  entry.
- "Start New Day" only marks the current batch `closed`; it never
  deletes data. "Delete All" (home screen) and the hard-delete batch
  endpoint are the two genuinely destructive actions, both gated behind
  an explicit confirmation.
