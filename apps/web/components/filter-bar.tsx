"use client";

import { Search } from "lucide-react";
import { CategoryChip } from "./category-chip";

interface FilterBarProps {
  categories: { id: string; label: string }[];
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  modelOptions?: { id: string; name: string }[];
  selectedModel?: string | null;
  onModelChange?: (m: string | null) => void;
}

export function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  modelOptions,
  selectedModel,
  onModelChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-foreground/30"
          />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-control)] border border-[color:var(--border-soft)] bg-[color:var(--field-background)] pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/30 focus:border-[color:var(--accent)] focus:outline-none"
          />
        </div>
        {modelOptions && onModelChange && (
          <select
            value={selectedModel ?? ""}
            onChange={(e) => onModelChange(e.target.value || null)}
            className="h-10 rounded-[var(--radius-control)] border border-[color:var(--border-soft)] bg-[color:var(--field-background)] px-3 text-sm text-foreground focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="">All Models</option>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          category="all"
          label="All"
          selected={selectedCategory === null}
          onClick={() => onCategoryChange(null)}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat.id}
            label={cat.label}
            selected={selectedCategory === cat.id}
            onClick={() =>
              onCategoryChange(selectedCategory === cat.id ? null : cat.id)
            }
          />
        ))}
      </div>
    </div>
  );
}
