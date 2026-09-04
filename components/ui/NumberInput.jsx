"use client";

import { forwardRef, useEffect, useState } from "react";

/**
 * A numeric input backed by a plain text field (not type="number").
 * This avoids two native browser quirks that type="number" has:
 *  - scrolling the mouse wheel over a focused number input silently
 *    changes its value
 *  - a value of 0 combined with fast typing can produce "05", "010" etc.
 * Typing is restricted to digits and a single decimal point, and the
 * field clears itself on focus when it's showing 0 so the user can just
 * start typing the real amount.
 *
 * Forwards its ref to the underlying <input> so parents can call
 * .focus() on it directly - used for the Enter-to-advance keyboard
 * flow in the voucher editor.
 */
const NumberInput = forwardRef(function NumberInput(
  { label, value, onChange, className = "", onKeyDown, ...props },
  ref,
) {
  const [text, setText] = useState(value ? String(value) : "");

  useEffect(() => {
    const numeric = parseFloat(text);
    const current = isNaN(numeric) ? 0 : numeric;
    if (Number(value) !== current) {
      setText(value ? String(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^0-9.]/g, "");
    // collapse multiple decimal points to one
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw =
        raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    // strip leading zeros ("00", "05" -> "0", "5") unless it's "0." in progress
    if (/^0+\d/.test(raw)) {
      raw = raw.replace(/^0+/, "");
    }
    setText(raw);
    const num = parseFloat(raw);
    onChange(isNaN(num) ? 0 : num);
  };

  const handleFocus = (e) => {
    if (text === "0" || text === "") {
      setText("");
    }
    e.target.select();
  };

  const handleBlur = () => {
    if (text === "" || text === ".") {
      setText("");
      onChange(0);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] uppercase tracking-widest text-muted mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        placeholder="0"
        className={`w-full border border-line bg-white px-4 py-3 text-sm text-ink tabular-nums focus:outline-none focus:border-ink transition-colors ${className}`}
        {...props}
      />
    </div>
  );
});

export default NumberInput;
