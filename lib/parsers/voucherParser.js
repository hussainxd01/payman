/**
 * Parses raw pasted voucher text into structured voucher objects.
 *
 * Supports three formats, tried in this order:
 *
 * 1. Table format with a header row (tab or multi-space separated),
 *    e.g. copied straight out of a spreadsheet or accounting software:
 *
 *      Date          Vch/Bill No   Account                    Total Amount
 *      01-09-2026    F1            NEHA TRADERS (ODISHA)       59,750.00
 *      01-09-2026    F2            LOOK ME (MURSHIDABAD)       32,980.00
 *
 *    Only the voucher number, account/party name, and amount columns are
 *    used - a Date column (or any other column) is recognized and ignored.
 *
 * 2. Labeled block format:
 *    Voucher No: 1001
 *    Party: ABC Traders
 *    Amount: 25000
 *
 * 3. Simple delimited single-line format (comma / tab / pipe separated):
 *    1001, ABC Traders, 25000
 */

const LABEL_PATTERNS = {
  voucherNumber: /^(voucher\s*(no\.?|number)?|v\.?no\.?|vch\s*no\.?)\s*[:\-]\s*(.+)$/i,
  partyName: /^(party(\s*name)?|customer|name|vendor)\s*[:\-]\s*(.+)$/i,
  totalAmount: /^(amount|total(\s*amount)?|value)\s*[:\-]\s*(.+)$/i,
  discount: /^(discount)\s*[:\-]\s*(.+)$/i,
  goodsReturn: /^(goods\s*return|return)\s*[:\-]\s*(.+)$/i,
};

// Column header matchers for the table format. Order doesn't matter -
// each column in the header row is tested against these until one hits.
// Matching is done loosely (does the header contain these words) since
// real-world headers vary a lot: "Vch/Bill No", "Vch No.", "Bill No", etc.
const COLUMN_MATCHERS = [
  {
    field: "voucherNumber",
    test: (col) => /vch|voucher|bill/i.test(col) && /no\.?$|number$/i.test(col),
  },
  {
    field: "partyName",
    test: (col) => /^(account|party(\s*name)?|customer(\s*name)?|name|vendor)$/i.test(col),
  },
  {
    field: "totalAmount",
    test: (col) => /amount|value/i.test(col),
  },
  {
    field: "ignore",
    test: (col) => /^date$/i.test(col),
  },
];

function parseNumber(value) {
  if (value === undefined || value === null) return 0;
  const cleaned = String(value).replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function splitColumns(line) {
  // Prefer real tabs (spreadsheet paste). Fall back to runs of 2+ spaces
  // for plain-text tables that were aligned with spaces.
  if (line.includes("\t")) {
    return line.split("\t").map((c) => c.trim());
  }
  return line.split(/\s{2,}/).map((c) => c.trim());
}

function detectTableHeader(lines) {
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const columns = splitColumns(lines[i]);
    if (columns.length < 3) continue;

    const map = {};
    columns.forEach((col, idx) => {
      const found = COLUMN_MATCHERS.find((m) => m.test(col));
      if (found && found.field !== "ignore" && map[found.field] === undefined) {
        map[found.field] = idx;
      }
    });

    if (map.voucherNumber !== undefined && map.partyName !== undefined && map.totalAmount !== undefined) {
      return { headerIndex: i, columnMap: map };
    }
  }
  return null;
}

function parseTableFormat(text, errors) {
  const lines = text.split("\n").filter((l) => l.trim());
  const header = detectTableHeader(lines);
  if (!header) return null;

  const { headerIndex, columnMap } = header;
  const vouchers = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const columns = splitColumns(line);
    if (columns.length < 2) continue;

    const voucherNumber = (columns[columnMap.voucherNumber] || "").trim();
    const partyName = (columns[columnMap.partyName] || "").trim();
    const totalAmount = parseNumber(columns[columnMap.totalAmount]);

    const rowErrors = [];
    if (!voucherNumber) rowErrors.push("missing voucher number");
    if (!partyName) rowErrors.push("missing party name");
    if (!totalAmount || totalAmount <= 0) rowErrors.push("missing or invalid amount");

    if (rowErrors.length > 0) {
      errors.push({
        row: i + 1,
        raw: line,
        message: `Row ${i - headerIndex}: ${rowErrors.join(", ")}`,
      });
      continue;
    }

    vouchers.push({
      voucherNumber,
      partyName,
      totalAmount,
      discount: 0,
      goodsReturn: 0,
    });
  }

  return vouchers;
}

function parseLabeledBlock(block, blockIndex, errors) {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const voucher = {
    voucherNumber: "",
    partyName: "",
    totalAmount: 0,
    discount: 0,
    goodsReturn: 0,
  };

  let matchedAnyLabel = false;

  for (const line of lines) {
    for (const [field, pattern] of Object.entries(LABEL_PATTERNS)) {
      const match = line.match(pattern);
      if (match) {
        const value = match[match.length - 1].trim();
        if (field === "totalAmount" || field === "discount" || field === "goodsReturn") {
          voucher[field] = parseNumber(value);
        } else {
          voucher[field] = value;
        }
        matchedAnyLabel = true;
        break;
      }
    }
  }

  if (!matchedAnyLabel) {
    return null; // not a labeled block at all
  }

  const rowErrors = [];
  if (!voucher.voucherNumber) rowErrors.push("missing voucher number");
  if (!voucher.partyName) rowErrors.push("missing party name");
  if (!voucher.totalAmount || voucher.totalAmount <= 0) rowErrors.push("missing or invalid amount");

  if (rowErrors.length > 0) {
    errors.push({
      row: blockIndex + 1,
      raw: block,
      message: `Voucher ${blockIndex + 1}: ${rowErrors.join(", ")}`,
    });
    return null;
  }

  return voucher;
}

function parseDelimitedLine(line, lineIndex, errors) {
  const parts = line.split(/\t|,|\|/).map((p) => p.trim()).filter((p) => p !== "");

  if (parts.length < 3) {
    errors.push({
      row: lineIndex + 1,
      raw: line,
      message: `Line ${lineIndex + 1}: expected "voucher no, party, amount" - got "${line}"`,
    });
    return null;
  }

  const [voucherNumber, partyName, amountRaw, discountRaw, goodsReturnRaw] = parts;
  const totalAmount = parseNumber(amountRaw);

  const rowErrors = [];
  if (!voucherNumber) rowErrors.push("missing voucher number");
  if (!partyName) rowErrors.push("missing party name");
  if (!totalAmount || totalAmount <= 0) rowErrors.push("missing or invalid amount");

  if (rowErrors.length > 0) {
    errors.push({
      row: lineIndex + 1,
      raw: line,
      message: `Line ${lineIndex + 1}: ${rowErrors.join(", ")}`,
    });
    return null;
  }

  return {
    voucherNumber,
    partyName,
    totalAmount,
    discount: parseNumber(discountRaw),
    goodsReturn: parseNumber(goodsReturnRaw),
  };
}

/**
 * Detect duplicate voucher numbers within a parsed batch and annotate them.
 */
function findDuplicates(vouchers) {
  const seen = new Map();
  const duplicateNumbers = new Set();

  vouchers.forEach((v) => {
    const key = v.voucherNumber.trim().toLowerCase();
    if (seen.has(key)) {
      duplicateNumbers.add(v.voucherNumber);
    } else {
      seen.set(key, true);
    }
  });

  return duplicateNumbers;
}

/**
 * Main entry point. Receives raw pasted text, returns:
 * { vouchers, errors, duplicates }
 */
export function parseVoucherText(rawText) {
  const errors = [];

  if (!rawText || !rawText.trim()) {
    return { vouchers: [], errors: [{ message: "No data was pasted." }], duplicates: [] };
  }

  const text = rawText.replace(/\r\n/g, "\n").trim();

  // 1. Table format (header row with Date / Vch No / Account / Amount columns).
  const tableResult = parseTableFormat(text, errors);
  let vouchers = [];

  if (tableResult !== null) {
    vouchers = tableResult;
  } else {
    // 2. Labeled-block format: split on 2+ newlines.
    const blocks = text.split(/\n\s*\n+/).filter((b) => b.trim());
    const looksLabeled = blocks.some((b) =>
      Object.values(LABEL_PATTERNS).some((pattern) =>
        b.split("\n").some((line) => pattern.test(line.trim()))
      )
    );

    if (looksLabeled) {
      blocks.forEach((block, i) => {
        const v = parseLabeledBlock(block, i, errors);
        if (v) vouchers.push(v);
      });
    } else {
      // 3. Fall back to simple delimited single-line format.
      const lines = text.split("\n").filter((l) => l.trim());
      lines.forEach((line, i) => {
        if (/^(voucher|vch|no)\b/i.test(line) && /party|amount/i.test(line)) {
          return; // obvious header row
        }
        const v = parseDelimitedLine(line, i, errors);
        if (v) vouchers.push(v);
      });
    }
  }

  const duplicates = findDuplicates(vouchers);

  return {
    vouchers,
    errors,
    duplicates: Array.from(duplicates),
  };
}

export default parseVoucherText;
