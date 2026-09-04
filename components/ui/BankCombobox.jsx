"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A searchable bank picker. Type to filter, arrow keys to browse,
 * Enter commits the highlighted match (or creates a new bank name if
 * there's no match) and hands control back to the parent via onCommit
 * so it can move focus to the next field in the entry flow.
 *
 * Each suggestion also has a small delete (x) button so a bank created
 * by mistake or with a typo can be removed from the shared list right
 * from here, without needing a separate "manage banks" screen.
 */
const BankCombobox = forwardRef(function BankCombobox(
  {
    banks,
    onCommit,
    onDeleteBank,
    onBackspaceEmpty,
    placeholder = "Search or add a bank...",
    className = "",
  },
  ref,
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);

  const filtered = (banks || []).filter((b) =>
    b.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commit = (name) => {
    const trimmed = (name ?? query).trim();
    setQuery("");
    setOpen(false);
    onCommit(trimmed); // empty string means "skip, no bank chosen"
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // Only auto-pick a highlighted match when the user actually typed
      // something to search for - an empty query "matches" every bank,
      // which would otherwise silently select the first one in the list.
      if (
        query.trim() &&
        open &&
        filtered.length > 0 &&
        filtered[highlighted]
      ) {
        commit(filtered[highlighted].name);
      } else {
        commit(query);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && e.target.value === "" && onBackspaceEmpty) {
      // Field is already empty - Backspace here means "go back to the
      // previous field" rather than deleting nothing. Checking the DOM
      // value directly (not the query state) so this can never fall out
      // of sync with what's actually on screen.
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={ref}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`w-full border border-line bg-white px-4 py-3 text-sm text-ink focus:outline-none focus:border-ink transition-colors ${className}`}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-line bg-white shadow-sm">
          {filtered.map((b, i) => (
            <div
              key={b._id}
              className={`flex items-center justify-between transition-colors ${
                i === highlighted ? "bg-paper" : "hover:bg-paper"
              }`}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(b.name);
                }}
                className="flex-1 text-left px-4 py-2 text-sm"
              >
                {b.name}
              </button>
              {onDeleteBank && (
                <button
                  type="button"
                  aria-label={`Delete ${b.name}`}
                  title={`Delete ${b.name}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteBank(b);
                  }}
                  className="px-3 py-2 text-muted hover:text-red-700 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full border border-line bg-white shadow-sm px-4 py-2 text-sm text-muted">
          Press Enter to add &ldquo;{query.trim()}&rdquo; as a new bank
        </div>
      )}
    </div>
  );
});

export default BankCombobox;
