export default function VoucherProgress({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted mb-2">
        <span>Voucher {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-px w-full bg-line">
        <div
          className="h-px bg-ink transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
