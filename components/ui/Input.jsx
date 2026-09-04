export default function Input({ label, className = "", id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] uppercase tracking-widest text-muted mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border border-line bg-white px-4 py-3 text-sm text-ink focus:outline-none focus:border-ink transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
