"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { PromptCard } from "@/components/prompt-card";
import { FeaturedTools } from "@/components/featured-tools";
import { SecondaryTools } from "@/components/secondary-tools";

import { MOCK_PROMPTS } from "@/lib/mock-data";
import { MODELS, CATEGORIES } from "@/lib/constants";
import { EXAMPLE_VIDEOS } from "@/lib/example-videos";
import { BLOG_POSTS } from "@/lib/blog-data";
import { getThumbnailUrl } from "@/lib/media-url";
import toolThumbnails from "@/lib/tool-thumbnails.json";

// Category counts from real data
const categoryCounts: Record<string, number> = {};
EXAMPLE_VIDEOS.forEach((v) => {
  categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
});

export default function HomePage() {
  const topPrompts = MOCK_PROMPTS.slice(0, 8);
  const latestPosts = [...BLOG_POSTS]
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 3);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-14 md:pt-24">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
              <span className="size-1.5 rounded-full bg-[color:var(--accent)]" />
              Client-side · Bring your own key
            </span>
            <h1 className="text-[clamp(2.4rem,5.2vw,4.8rem)] font-bold leading-[0.95] tracking-[-0.06em] text-foreground">
              Script. Story.
              <br />
              Shot list.
              <br />
              <span className="text-[color:var(--accent)]">All rendered.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-7 text-foreground/55">
              Four focused studios that turn ideas into finished video. Pick
              the studio, pick the model, render. Seedance, Veo, Kling, Wan,
              and the rest, wired into pipelines you can actually ship.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/shorts"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                Start with Shorts
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center rounded-full border border-[color:var(--border-soft-strong)] px-6 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-[color:var(--surface)]"
              >
                Explore Prompts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Tools (4 primary studios) ────────────── */}
      <FeaturedTools thumbnails={toolThumbnails as Record<string, string>} />

      {/* ─── Models bar ────────────────────────────────────── */}
      <section className="border-y border-[color:var(--separator)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 overflow-x-auto px-6 py-5">
          <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-foreground/30">
            Models wired in
          </span>
          <div className="flex items-center gap-8">
            {MODELS.map((m) => (
              <a
                key={m.id}
                href={m.falUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-semibold text-foreground/25 transition-colors hover:text-[color:var(--accent)]"
              >
                {m.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Recent Prompts ────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader
            title="Recent Prompts"
            description="Browse the latest additions to the library"
            href="/explore"
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                text={prompt.text}
                category={prompt.category}
                modelId={prompt.modelId}
                likes={prompt.likes}
                tags={prompt.tags}
                videoUrl={prompt.videoUrl}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─────────────────────────────────────── */}
      <section className="border-t border-[color:var(--separator)]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader title="Browse by Category" href="/explore" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.filter((cat) => categoryCounts[cat.id]).map((cat) => (
              <Link
                key={cat.id}
                href={`/explore/${cat.id}`}
                className="group flex items-center justify-between rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-5 py-4 transition-colors hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--accent)]/5"
              >
                <div>
                  <span className="text-sm font-medium text-foreground/70 group-hover:text-foreground">
                    {cat.label}
                  </span>
                  <span className="ml-2 text-xs text-foreground/20">
                    {categoryCounts[cat.id]}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-foreground/20 group-hover:text-[color:var(--accent)]"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Secondary tools ───────────────────────────────── */}
      <SecondaryTools />

      {/* ─── Latest from the blog ──────────────────────────── */}
      <section className="border-t border-[color:var(--separator)]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader
            title="From the blog"
            description="Model deep-dives and workflow notes."
            href="/blog"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {latestPosts.map((post) => {
              const cover = post.coverImage
                ? getThumbnailUrl(post.coverImage, 600, 80)
                : null;
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--accent)]/30"
                >
                  <div
                    className={`aspect-[16/9] ${
                      cover ? "" : `bg-gradient-to-br ${post.coverGradient}`
                    }`}
                    style={
                      cover
                        ? {
                            backgroundImage: `url(${cover})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                      {post.category}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground group-hover:text-[color:var(--accent)]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[12px] text-foreground/45">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-[color:var(--separator)] pb-8 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.85] tracking-[-0.07em] text-foreground/5">
              fal.prompts
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-foreground/30">
            <span>
              Powered by{" "}
              <a
                href="https://fal.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/40 underline-offset-2 hover:text-[color:var(--accent)] hover:underline"
              >
                fal.ai
              </a>
            </span>
            <div className="flex gap-6">
              <Link href="/explore" className="hover:text-foreground/60">
                Explore
              </Link>
              <Link href="/shorts" className="hover:text-foreground/60">
                Shorts
              </Link>
              <Link href="/podcast" className="hover:text-foreground/60">
                Podcast
              </Link>
              <Link href="/scenario" className="hover:text-foreground/60">
                Scene
              </Link>
              <Link href="/multi-shot" className="hover:text-foreground/60">
                Multi-Shot
              </Link>
              <Link href="/blog" className="hover:text-foreground/60">
                Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
