"use client";

export default function VoucherSearch({
  value,
  onChange,
  placeholder = "Search vouchers...",
  autoFocus = false,
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full border-b border-line bg-transparent px-1 py-3 text-sm text-ink focus:outline-none focus:border-ink transition-colors"
    />
  );
}
