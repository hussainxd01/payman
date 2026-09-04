export function StatusBadge({ status }) {
  const styles = {
    PAID: "text-green-700 border-green-700",
    PARTIAL: "text-amber-700 border-amber-700",
    OUTSTANDING: "text-red-700 border-red-700",
  };
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
        styles[status] || "text-muted border-line"
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="border border-dashed border-line py-16 text-center">
      <p className="text-sm font-medium tracking-tight text-ink">{title}</p>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="py-16 text-center text-sm text-muted uppercase tracking-widest">
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs uppercase tracking-widest underline shrink-0"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  const sign = num < 0 ? "-" : "";
  return `${sign}₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
