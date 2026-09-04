"use client";

export default function VoucherSearch({ value, onChange, placeholder = "Search vouchers..." }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border-b border-line bg-transparent px-1 py-3 text-sm text-ink focus:outline-none focus:border-ink transition-colors"
    />
  );
}
