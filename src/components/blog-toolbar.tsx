"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { SORT_OPTIONS, type BlogSort } from "@/lib/blog-data";

export function BlogToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") || "";
  const currentSort = (searchParams.get("sort") as BlogSort) || "newest";

  const [query, setQuery] = useState(currentQ);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Push URL params
  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // always reset page on filter change
      params.delete("page");
      for (const [k, v] of Object.entries(overrides)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      const qs = params.toString();
      router.push(`/blog${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pushParams({ q: value || null });
      }, 300);
    },
    [pushParams],
  );

  const clearSearch = () => {
    setQuery("");
    pushParams({ q: null });
  };

  const handleSort = (sort: BlogSort) => {
    setSortOpen(false);
    pushParams({ sort: sort === "newest" ? null : sort });
  };

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync query state if URL changes externally
  useEffect(() => {
    setQuery(currentQ);
  }, [currentQ]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === currentSort);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search articles..."
          className="h-9 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] pl-9 pr-8 text-xs text-foreground placeholder:text-foreground/20 focus:border-[color:var(--accent)] focus:outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground/50"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs transition-colors ${
            sortOpen
              ? "border-[color:var(--accent)]/50 bg-[color:var(--surface)]"
              : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--accent)]/30"
          }`}
        >
          <SlidersHorizontal size={13} className="text-foreground/25" />
          <span className="text-foreground/50">{activeSort?.label}</span>
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] py-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSort(opt.value)}
                className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors ${
                  currentSort === opt.value
                    ? "bg-[color:var(--default)] text-[color:var(--accent)]"
                    : "text-foreground/50 hover:bg-foreground/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
