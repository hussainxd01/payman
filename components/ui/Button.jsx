export default function Button({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-ink text-white hover:bg-black",
    secondary: "bg-white text-ink border border-ink hover:bg-paper",
    ghost: "bg-transparent text-ink hover:bg-paper",
    danger: "bg-white text-red-700 border border-red-700 hover:bg-red-50",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
