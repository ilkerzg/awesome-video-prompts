"use client";

import Link from "next/link";
import { ArrowRight, Film, Mic, Layers, BookOpen } from "lucide-react";
import { getThumbnailUrl } from "@/lib/media-url";

type Tool = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  href: string;
  image?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const FEATURED_TOOLS: Tool[] = [
  {
    slug: "shorts-studio",
    title: "Shorts Studio",
    tag: "9:16 vertical",
    description:
      "Turn a script into a captioned podcast-style vertical video. Speakers, cuts, audio — rendered end to end.",
    href: "/shorts",
    icon: Film,
  },
  {
    slug: "podcast-studio",
    title: "Podcast Studio",
    tag: "2 hosts · lip-sync",
    description:
      "Two characters in a studio, generated from a script. Voice, video, cuts. One pipeline, one output.",
    href: "/podcast",
    icon: Mic,
  },
  {
    slug: "scene-builder",
    title: "Scene Builder",
    tag: "story → scenes",
    description:
      "Give it a story. It drafts the scene breakdown, the references, the keyframes — then renders them.",
    href: "/scenario",
    icon: BookOpen,
  },
  {
    slug: "multi-shot",
    title: "Multi-Shot Generator",
    tag: "4+ coherent shots",
    description:
      "Multiple shots of the same world, the same character, the same light. Continuity as a default, not a fight.",
    href: "/multi-shot",
    icon: Layers,
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const imgUrl = tool.image ? getThumbnailUrl(tool.image, 800, 85) : null;

  return (
    <Link
      href={tool.href}
      className="group relative overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]"
    >
      {/* Image area */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-foreground/10 to-foreground/2">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={tool.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/15">
            <tool.icon size={56} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-80 transition-opacity group-hover:opacity-60" />
        {/* Tag chip */}
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {tool.tag}
        </span>
      </div>

      {/* Text */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">
            {tool.title}
          </h3>
          <ArrowRight
            size={16}
            className="shrink-0 text-foreground/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--accent)]"
          />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/55">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}

export function FeaturedTools({ thumbnails }: { thumbnails?: Record<string, string> }) {
  const tools = FEATURED_TOOLS.map((t) => ({
    ...t,
    image: thumbnails?.[t.slug],
  }));

  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { FEATURED_TOOLS };
