"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PromptCard } from "@/components/prompt-card";
import { MOCK_PROMPTS } from "@/lib/mock-data";
import { CATEGORIES, MODELS } from "@/lib/constants";
import { EmptyStateView } from "@/components/empty-state-view";
import { TopBar } from "@/components/topbar";
import { CustomSelect } from "@/components/custom-select";
import { CategoryChip } from "@/components/category-chip";

const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
];

const PER_PAGE = 12;

function ExplorePageInner() {
  const searchParams = useSearchParams();
  const authorParam = searchParams.get("author");
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("popular");
  const [page, setPage] = useState(1);
  const [authorFilter, setAuthorFilter] = useState<string | null>(authorParam);

  // Sync category from URL param
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setPage(1);
  }, [categoryParam]);

  // Sync author from URL param
  useEffect(() => {
    setAuthorFilter(authorParam);
    setPage(1);
  }, [authorParam]);

  const filteredPrompts = useMemo(() => {
    let results = MOCK_PROMPTS.filter((prompt) => {
      if (selectedCategory && prompt.category !== selectedCategory) return false;
      if (searchQuery && !prompt.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Author filter from URL or popover
    if (authorFilter) {
      const { EXAMPLE_VIDEOS } = require("@/lib/example-videos");
      const authorVideoIds = new Set(
        EXAMPLE_VIDEOS
          .filter((v: { author: string }) => v.author.replace(/\s*\(@?\w+\)\s*$/, "").includes(authorFilter))
          .map((v: { id: string }) => v.id)
      );
      results = results.filter((p) => authorVideoIds.has(p.id));
    }

    if (sortBy === "popular") results = [...results].sort((a, b) => b.likes - a.likes);
    else if (sortBy === "newest") results = [...results].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sortBy === "oldest") results = [...results].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return results;
  }, [selectedCategory, searchQuery, sortBy, authorFilter]);

  // Reset page when filters change
  const totalPages = Math.ceil(filteredPrompts.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginatedPrompts = filteredPrompts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleFilterChange = (setter: (v: string | null) => void, value: string | null) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <TopBar title="Explore Prompts" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Search + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-foreground/25" />
            <input
              type="text"
              placeholder="Search prompts... (e.g. macro, drone, cyberpunk)"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/25 focus:border-[color:var(--accent)]/50 focus:outline-none"
            />
          </div>
          <CustomSelect
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Sort by"
            className="w-[160px]"
          />
        </div>

        {/* Category Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <CategoryChip category="all" label="All" selected={selectedCategory === null} onClick={() => handleFilterChange(setSelectedCategory, null)} />
          {CATEGORIES.filter((c) => MOCK_PROMPTS.some((p) => p.category === c.id)).map((cat) => (
            <CategoryChip key={cat.id} category={cat.id} label={cat.label} selected={selectedCategory === cat.id}
              onClick={() => handleFilterChange(setSelectedCategory, selectedCategory === cat.id ? null : cat.id)} />
          ))}
        </div>

        {/* Results count */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-foreground/30">
            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 && "s"} found
            {authorFilter && <span className="ml-1">by <span className="text-[color:var(--accent)]">{authorFilter}</span></span>}
            {totalPages > 1 && <span className="ml-1">— page {currentPage} of {totalPages}</span>}
          </p>
          {(selectedCategory || searchQuery || authorFilter) && (
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); setAuthorFilter(null); setPage(1); window.history.replaceState(null, "", "/explore"); }}
              className="text-xs text-[color:var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        {paginatedPrompts.length > 0 ? (
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedPrompts.map((prompt) => (
              <PromptCard key={prompt.id} id={prompt.id} text={prompt.text} category={prompt.category} modelId={prompt.modelId} likes={prompt.likes} tags={prompt.tags} videoUrl={prompt.videoUrl} />
            ))}
          </div>
        ) : (
          <EmptyStateView title="No prompts found" description="Try adjusting your filters or search query." />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="flex size-9 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] text-foreground/40 disabled:opacity-20 hover:text-foreground">
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | "...")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push("...");
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (currentPage < totalPages - 2) pages.push("...");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="flex size-9 items-center justify-center text-xs text-foreground/20">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`flex size-9 items-center justify-center rounded-xl text-xs font-medium transition-colors ${
                      p === currentPage
                        ? "bg-[color:var(--accent)] text-black"
                        : "border border-[color:var(--border-soft)] bg-[color:var(--surface)] text-foreground/40 hover:text-foreground"
                    }`}>
                    {p}
                  </button>
                )
              );
            })()}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="flex size-9 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] text-foreground/40 disabled:opacity-20 hover:text-foreground">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-foreground/30">Loading…</div>}>
      <ExplorePageInner />
    </Suspense>
  );
}
