"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  id: string;
  label: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}: {
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1); // -1 = placeholder row
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // All items: placeholder + options
  const allItems = [{ id: "__placeholder__", label: placeholder }, ...options];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset focus when opening
  useEffect(() => {
    if (open) {
      const idx = value ? allItems.findIndex((o) => o.id === value) : 0;
      setFocused(idx >= 0 ? idx : 0);
    }
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[focused] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [focused, open]);

  const select = useCallback((id: string) => {
    onChange(id === "__placeholder__" ? null : id);
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocused((f) => Math.min(f + 1, allItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocused((f) => Math.max(f - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focused >= 0 && focused < allItems.length) select(allItems[focused].id);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Home":
        e.preventDefault();
        setFocused(0);
        break;
      case "End":
        e.preventDefault();
        setFocused(allItems.length - 1);
        break;
      default:
        // Type-ahead: jump to first option starting with pressed key
        if (e.key.length === 1) {
          const idx = allItems.findIndex((o, i) => i > 0 && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
          if (idx >= 0) setFocused(idx);
        }
    }
  }, [open, focused, allItems, select]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label ?? placeholder}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm transition-colors ${
          open
            ? "border-[color:var(--accent)]/50 bg-[color:var(--surface)]"
            : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--border-soft-strong)]"
        }`}
      >
        <span className={selected ? "text-foreground" : "text-foreground/30"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className={`text-foreground/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-activedescendant={focused >= 0 ? `opt-${allItems[focused].id}` : undefined}
          onKeyDown={handleKeyDown}
          className="absolute top-full left-0 z-50 mt-1 w-full min-w-[160px] rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] py-1"
        >
          {allItems.map((opt, idx) => {
            const isPlaceholder = opt.id === "__placeholder__";
            const isSelected = isPlaceholder ? !value : value === opt.id;
            const isFocused = idx === focused;
            return (
              <button
                key={opt.id}
                id={`opt-${opt.id}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => select(opt.id)}
                onMouseEnter={() => setFocused(idx)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isFocused ? "bg-[color:var(--default)]" : ""
                } ${isSelected ? "text-[color:var(--accent)]" : "text-foreground/70"}`}
              >
                {isSelected ? <Check size={12} /> : <span className="w-3" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
