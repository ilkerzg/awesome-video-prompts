import type { Metadata } from "next";
import { Suspense } from "react";
import { TopBar } from "@/components/topbar";
import {
  BLOG_CATEGORIES,
  getFilteredPosts,
  sortPosts,
  getPaginatedPosts,
  type BlogSort,
} from "@/lib/blog-data";
import { BlogToolbar } from "@/components/blog-toolbar";
import { getThumbnailUrl } from "@/lib/media-url";
import Link from "next/link";
import { Clock, ArrowRight, User, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── SEO ────────────────────────────────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string; sort?: string }>;
}): Promise<Metadata> {
  const { category, page, q } = await searchParams;
  const pageNum = page ? parseInt(page) : 1;
  const catLabel = category ? ` — ${category}` : "";
  const pageLabel = pageNum > 1 ? ` — Page ${pageNum}` : "";
  const searchLabel = q ? ` — "${q}"` : "";

  return {
    title: `Blog${catLabel}${searchLabel}${pageLabel} | fal Awesome Prompts`,
    description:
      "Guides, tutorials, and deep dives on AI video generation — prompts, models, workflows, and more.",
    openGraph: {
      title: `Blog${catLabel}${pageLabel} | fal Awesome Prompts`,
      description: "Guides, tutorials, and deep dives on AI video generation.",
      type: "website",
    },
    robots: q ? { index: false } : undefined,
  };
}

// ─── Helpers ────────────────────────────────────────────────
function buildHref(opts: {
  category?: string | null;
  page?: number;
  q?: string | null;
  sort?: string | null;
}) {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.q) params.set("q", opts.q);
  if (opts.sort && opts.sort !== "newest") params.set("sort", opts.sort);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

// ─── Page ───────────────────────────────────────────────────
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string; sort?: string }>;
}) {
  const { category, page, q, sort } = await searchParams;
  const currentCategory = category || null;
  const currentSort = (sort as BlogSort) || "newest";
  const currentQuery = q || null;
  const pageNum = page ? parseInt(page) : 1;

  // Filter → sort → paginate (featured stays in the list — no separate hero)
  const allFiltered = getFilteredPosts(currentCategory, currentQuery);
  const sorted = sortPosts(allFiltered, currentSort);
  const { posts, totalPages, currentPage } = getPaginatedPosts(sorted, pageNum);

  const totalResults = allFiltered.length;
  const hasActiveFilters = !!(currentCategory || currentQuery || (sort && sort !== "newest"));

  // First post on page 1 gets hero treatment
  const heroPost = currentPage === 1 && posts.length > 0 ? posts[0] : null;
  const gridPosts = heroPost ? posts.slice(1) : posts;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Blog${currentCategory ? ` — ${currentCategory}` : ""}`,
    description: "Guides, tutorials, and deep dives on AI video generation.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: (currentPage - 1) * 6 + i + 1,
        url: `/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <>
      <TopBar title="Blog" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Blog
          </h1>
          <p className="mt-2 text-base text-foreground/35">
            Guides, deep dives, and insights on AI video generation.
          </p>
        </header>

        {/* Search + Sort Toolbar */}
        <Suspense>
          <BlogToolbar />
        </Suspense>

        {/* Category Filters */}
        <nav aria-label="Blog categories" className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href={buildHref({ q: currentQuery, sort })}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              !currentCategory
                ? "bg-foreground text-background"
                : "bg-[color:var(--default)] text-foreground/40 hover:text-foreground"
            }`}
          >
            All
          </Link>
          {BLOG_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={buildHref({
                category: cat === currentCategory ? null : cat,
                q: currentQuery,
                sort,
              })}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                currentCategory === cat
                  ? "bg-foreground text-background"
                  : "bg-[color:var(--default)] text-foreground/40 hover:text-foreground"
              }`}
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Result count + clear */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-foreground/30">
          <span>
            {totalResults} {totalResults === 1 ? "article" : "articles"}
            {currentCategory ? ` in ${currentCategory}` : ""}
            {currentQuery ? ` matching "${currentQuery}"` : ""}
          </span>
          {hasActiveFilters && (
            <Link
              href="/blog"
              className="ml-1 flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <X size={10} />
              Clear filters
            </Link>
          )}
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-5">
            {/* Hero: first post as full-width card */}
            {heroPost && (
              <article>
                <Link
                  href={`/blog/${heroPost.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--accent)]/30"
                >
                  <div className="grid md:grid-cols-[1fr_1fr]">
                    <div
                      className={`h-48 md:h-auto md:min-h-[240px] ${heroPost.coverImage ? "" : `bg-gradient-to-br ${heroPost.coverGradient}`}`}
                      role="img"
                      aria-label={`Cover for ${heroPost.title}`}
                      style={heroPost.coverImage ? {
                        backgroundImage: `url(${getThumbnailUrl(heroPost.coverImage, 1200, 85)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      } : undefined}
                    />
                    <div className="flex flex-col justify-center p-5 md:p-6">
                      <span className="mb-2 self-start rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold text-foreground/40">
                        {heroPost.category}
                      </span>
                      <h2 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-[color:var(--accent)] md:text-xl">
                        {heroPost.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/35 line-clamp-3">
                        {heroPost.excerpt}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-[11px] text-foreground/25">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {heroPost.author}
                        </span>
                        <time dateTime={heroPost.dateISO}>{heroPost.date}</time>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {heroPost.readTime}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-[color:var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                          Read <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )}

            {/* Grid: remaining posts */}
            {gridPosts.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <article key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--accent)]/30"
                    >
                      <div
                        className={`h-36 ${post.coverImage ? "" : `bg-gradient-to-br ${post.coverGradient}`}`}
                        role="img"
                        aria-label={`Cover for ${post.title}`}
                        style={post.coverImage ? {
                          backgroundImage: `url(${getThumbnailUrl(post.coverImage, 600, 80)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        } : undefined}
                      />
                      <div className="flex flex-1 flex-col p-4">
                        <span className="mb-2 self-start rounded-md bg-foreground/5 px-2 py-0.5 text-[9px] font-semibold text-foreground/35">
                          {post.category}
                        </span>
                        <h2 className="text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-[color:var(--accent)]">
                          {post.title}
                        </h2>
                        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-foreground/35 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-foreground/20">
                          <time dateTime={post.dateISO}>{post.date}</time>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-foreground/30">
              {currentQuery
                ? `No articles found for "${currentQuery}".`
                : "No posts in this category yet."}
            </p>
            {hasActiveFilters && (
              <Link
                href="/blog"
                className="mt-3 inline-block text-xs text-[color:var(--accent)] hover:underline"
              >
                Clear all filters
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Blog pagination"
            className="mt-10 flex items-center justify-center gap-1"
          >
            {currentPage > 1 ? (
              <Link
                href={buildHref({ category: currentCategory, q: currentQuery, sort, page: currentPage - 1 })}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-foreground/40 transition-colors hover:text-foreground"
                rel="prev"
              >
                <ChevronLeft size={14} /> Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-foreground/15">
                <ChevronLeft size={14} /> Prev
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildHref({ category: currentCategory, q: currentQuery, sort, page: p })}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  p === currentPage
                    ? "bg-foreground text-background"
                    : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                }`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </Link>
            ))}

            {currentPage < totalPages ? (
              <Link
                href={buildHref({ category: currentCategory, q: currentQuery, sort, page: currentPage + 1 })}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-foreground/40 transition-colors hover:text-foreground"
                rel="next"
              >
                Next <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-foreground/15">
                Next <ChevronRight size={14} />
              </span>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
