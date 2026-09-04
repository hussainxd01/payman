"use client";

import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md bg-white border border-line focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {title && (
            <h2 className="text-lg font-medium tracking-tight mb-4">{title}</h2>
          )}
          <div className="text-sm text-muted">{children}</div>
        </div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-line px-8 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
