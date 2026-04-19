import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLE_VIDEOS } from "@/lib/example-videos";
import { CATEGORIES } from "@/lib/constants";
import { TopBar } from "@/components/topbar";
import { ArrowLeft, ExternalLink, Tag, Cpu, Play } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { VideoPreview } from "@/components/video-preview";
import { AuthorPopover } from "@/components/author-popover";
import { LikeButton } from "@/components/like-button";
import { StatsBadges } from "@/components/stats-badges";
import { getThumbnailUrl } from "@/lib/media-url";

// ─── Static Generation ──────────────────────────────────────

export async function generateStaticParams() {
  return EXAMPLE_VIDEOS.map((v) => ({ id: v.id }));
}

// ─── SEO Metadata ───────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = EXAMPLE_VIDEOS.find((v) => v.id === id);
  if (!video) return { title: "Prompt Not Found" };

  const title = `${video.prompt.slice(0, 60)}... — AI Video Prompt`;
  const description = video.prompt.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      videos: [{ url: video.videoUrl, type: "video/mp4" }],
    },
    twitter: {
      card: "player",
      title,
      description,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────

export default async function ExploreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // If slug matches a category, redirect to filtered explore
  if (CATEGORIES.some((c) => c.id === id)) {
    redirect(`/explore?category=${id}`);
  }

  const video = EXAMPLE_VIDEOS.find((v) => v.id === id);
  if (!video) notFound();

  // Build the fal.ai-ready JSON
  const falJson = {
    prompt: video.prompt,
    aspect_ratio: "16:9",
    resolution: "720p",
    duration: "auto",
    generate_audio: true,
  };

  const falJsonString = JSON.stringify(falJson, null, 2);

  // Build the full SDK code snippet
  const sdkCode = `import { fal } from "@fal-ai/client";

const result = await fal.subscribe("bytedance/seedance-2.0/text-to-video", {
  input: ${JSON.stringify(falJson, null, 4).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n")},
});

console.log(result.data.video.url);`;

  // Other works by the same author (extract display name for matching)
  const authorDisplayName = video.author.replace(/\s*\(@?\w+\)\s*$/, "");
  const otherWorks = EXAMPLE_VIDEOS
    .filter((v) => v.id !== video.id && v.author.startsWith(authorDisplayName))
    .map((v) => ({ id: v.id, prompt: v.prompt, videoUrl: v.videoUrl, category: v.category }));

  // Related videos (same category, excluding current)
  const related = EXAMPLE_VIDEOS
    .filter((v) => v.category === video.category && v.id !== video.id)
    .slice(0, 4);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.prompt.slice(0, 100),
    description: video.prompt,
    contentUrl: video.videoUrl,
    thumbnailUrl: video.videoUrl,
    uploadDate: new Date().toISOString(),
    creator: { "@type": "Person", name: video.author },
  };

  return (
    <>
      <TopBar title="Prompt Detail" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/explore" className="flex items-center gap-1.5 text-xs text-foreground/30 hover:text-[color:var(--accent)]">
            <ArrowLeft size={12} /> Back to Explore
          </Link>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: Video + Prompt */}
          <div className="space-y-5">
            {/* Video Player */}
            <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-black">
              <video
                src={video.videoUrl}
                poster={getThumbnailUrl(video.videoUrl, 1280, 85)}
                controls
                autoPlay
                loop
                playsInline
                preload="metadata"
                className="w-full"
                style={{ maxHeight: 480 }}
              />
            </div>

            {/* Prompt Text */}
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-[10px] font-bold uppercase tracking-wider text-foreground/25">Prompt</h1>
                <CopyButton text={video.prompt} promptId={video.id} />
              </div>
              <p className="text-[15px] leading-[1.8] text-foreground/70">{video.prompt}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3">
              <LikeButton promptId={video.id} />
              <StatsBadges promptId={video.id} />
              <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/40">
                <Cpu size={12} /> {video.model}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/40">
                <Tag size={12} /> {video.category}
              </div>
              <AuthorPopover author={video.author} source={video.source} otherWorks={otherWorks} />
            </div>
          </div>

          {/* Right: fal JSON + SDK Code */}
          <div className="space-y-4">
            {/* fal.ai Ready JSON */}
            <div className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--surface)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-[color:var(--accent)]/10">
                    <Play size={10} className="text-[color:var(--accent)]" />
                  </div>
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)]">fal.ai Ready JSON</h2>
                </div>
                <CopyButton text={falJsonString} />
              </div>
              <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed">
                <code className="text-emerald-400">{falJsonString}</code>
              </pre>
              <a
                href={`https://fal.ai/models/bytedance/seedance-2.0/text-to-video`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-xs font-semibold text-black hover:brightness-110 transition-all"
              >
                <ExternalLink size={12} /> Run on fal.ai
              </a>
            </div>

            {/* SDK Code */}
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground/25">TypeScript SDK</h2>
                <CopyButton text={sdkCode} />
              </div>
              <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed">
                <code className="text-foreground/50">{sdkCode}</code>
              </pre>
            </div>

            {/* Video URL */}
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/25">Video URL</h2>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={video.videoUrl}
                  className="flex-1 rounded-lg bg-black/20 px-3 py-2 font-mono text-[10px] text-foreground/40"
                />
                <CopyButton text={video.videoUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* Related Prompts */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-foreground/25">
              More {video.category} prompts
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link key={r.id} href={`/explore/${r.id}`} className="group">
                  <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--border-soft-strong)]">
                    <VideoPreview category={r.category} videoUrl={r.videoUrl} size="sm" />
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs leading-relaxed text-foreground/50">{r.prompt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
