import type { Metadata } from "next";
import { TopBar } from "@/components/topbar";
import { BLOG_POSTS, getPost } from "@/lib/blog-data";
import { ShareButton } from "@/components/share-button";
import Link from "next/link";
import { ArrowLeft, Clock, User, ArrowRight, Tag, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogContentRenderer } from "@/components/blog/content-renderer";
import { getThumbnailUrl } from "@/lib/media-url";

// ─── Static params for SSG ──────────────────────────────────
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

// ─── SEO ────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found | fal Awesome Prompts" };

  return {
    title: `${post.title} | fal Awesome Prompts Blog`,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.dateISO,
      authors: [post.author],
      tags: [post.category],
      url: `/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

// ─── Page ───────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Related: same category first, then others
  const sameCategory = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category,
  );
  const other = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category !== post.category,
  );
  const related = [...sameCategory, ...other].slice(0, 3);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.dateISO,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "fal Awesome Prompts" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${post.slug}` },
    articleSection: post.category,
  };

  return (
    <>
      <TopBar title="Blog" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-foreground/30">
            <li>
              <Link href="/blog" className="transition-colors hover:text-[color:var(--accent)]">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/blog?category=${post.category}`}
                className="transition-colors hover:text-[color:var(--accent)]"
              >
                {post.category}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="truncate text-foreground/50">{post.title}</li>
          </ol>
        </nav>

        {/* Cover (full width) */}
        <div
          className={`mb-8 h-48 rounded-2xl md:h-56 ${post.coverImage ? "" : `bg-gradient-to-br ${post.coverGradient}`}`}
          role="img"
          aria-label={`Cover image for ${post.title}`}
          style={post.coverImage ? { backgroundImage: `url(${getThumbnailUrl(post.coverImage, 1200, 85)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />

        {/* Two-column layout: article + sidebar */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          {/* ─── Main article ─── */}
          <article>
            {/* Meta row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/blog?category=${post.category}`}
                className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[10px] font-semibold text-[color:var(--accent)] transition-colors hover:bg-[color:var(--accent)]/20"
              >
                {post.category}
              </Link>
              <span className="flex items-center gap-1 text-xs text-foreground/25">
                <Clock size={12} />
                {post.readTime}
              </span>
              <time dateTime={post.dateISO} className="text-xs text-foreground/20">
                {post.date}
              </time>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground md:text-3xl">
              {post.title}
            </h1>

            {/* Lede */}
            <p className="mt-4 text-base leading-relaxed text-foreground/40">
              {post.excerpt}
            </p>

            <hr className="my-8 border-[color:var(--separator)]" />

            {/* Article body */}
            {post.content ? (
              <BlogContentRenderer content={post.content} />
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] px-6 py-16 text-center">
                <p className="text-sm text-foreground/25">Article content coming soon.</p>
                <p className="mt-1 text-xs text-foreground/15">
                  Full markdown rendering with images, code blocks, and embeds.
                </p>
              </div>
            )}

            <hr className="my-10 border-[color:var(--separator)]" />

            {/* Back */}
            <div className="text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm text-foreground/30 transition-colors hover:text-[color:var(--accent)]"
              >
                <ArrowLeft size={14} />
                Back to all posts
              </Link>
            </div>
          </article>

          {/* ─── Right Sidebar ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-16 space-y-5">
              {/* Author */}
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                  Author
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{post.author}</p>
                    <p className="text-[10px] text-foreground/25">AI Video Generation</p>
                  </div>
                </div>
              </div>

              {/* Post Info */}
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                  Details
                </p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/30">Published</span>
                    <time dateTime={post.dateISO} className="text-foreground/60">
                      {post.date}
                    </time>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/30">Read time</span>
                    <span className="flex items-center gap-1 text-foreground/60">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/30">Category</span>
                    <Link
                      href={`/blog?category=${post.category}`}
                      className="flex items-center gap-1 text-[color:var(--accent)] hover:underline"
                    >
                      <Tag size={11} />
                      {post.category}
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <ShareButton title={post.title} />
                </div>
              </div>

              {/* Related Posts */}
              {related.length > 0 && (
                <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                    Related Articles
                  </p>
                  <div className="space-y-3">
                    {related.map((rp) => (
                      <Link
                        key={rp.slug}
                        href={`/blog/${rp.slug}`}
                        className="group block"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`h-12 w-16 shrink-0 rounded-lg ${rp.coverImage ? "" : `bg-gradient-to-br ${rp.coverGradient}`}`}
                            style={rp.coverImage ? { backgroundImage: `url(${getThumbnailUrl(rp.coverImage, 200, 75)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-[color:var(--accent)] line-clamp-2">
                              {rp.title}
                            </h3>
                            <span className="mt-0.5 block text-[9px] text-foreground/20">
                              {rp.readTime}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse more */}
              <Link
                href="/blog"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground/5 py-2.5 text-xs text-foreground/30 transition-colors hover:text-foreground"
              >
                <BookOpen size={12} />
                Browse all articles
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
