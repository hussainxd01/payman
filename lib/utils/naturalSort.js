/**
 * Natural ordering for voucher numbers like "A1", "B1", "F10", "1001".
 * Splits a voucher number into its leading letters and trailing digits
 * so "F2" sorts before "F10" (unlike plain string sort), and letter
 * prefixes sort alphabetically before their numeric part is compared.
 */
function parseVoucherNumber(voucherNumber) {
  const str = String(voucherNumber || "").trim();
  const match = str.match(/^([A-Za-z]*)0*(\d*)(.*)$/);
  const letters = (match?.[1] || "").toUpperCase();
  const digits = match?.[2] ? parseInt(match[2], 10) : NaN;
  const rest = match?.[3] || "";
  return { letters, digits, rest, raw: str };
}

export function compareVoucherNumbers(a, b) {
  const pa = parseVoucherNumber(a);
  const pb = parseVoucherNumber(b);

  if (pa.letters !== pb.letters) {
    return pa.letters.localeCompare(pb.letters);
  }

  const aHasNum = !Number.isNaN(pa.digits);
  const bHasNum = !Number.isNaN(pb.digits);
  if (aHasNum && bHasNum && pa.digits !== pb.digits) {
    return pa.digits - pb.digits;
  }
  if (aHasNum !== bHasNum) {
    return aHasNum ? -1 : 1;
  }

  if (pa.rest !== pb.rest) return pa.rest.localeCompare(pb.rest);
  return pa.raw.localeCompare(pb.raw);
}

export function sortVouchersNatural(vouchers) {
  return [...vouchers].sort((a, b) =>
    compareVoucherNumbers(a.voucherNumber, b.voucherNumber)
  );
}

export default sortVouchersNatural;
