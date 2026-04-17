"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { EXAMPLE_VIDEOS } from "@/lib/example-videos";
import { getThumbnailUrl } from "@/lib/media-url";

// Pick one representative video per category for the bento grid
const HERO_CATEGORIES: { category: string; label: string; span: string }[] = [
  { category: "cinematic", label: "Cinematic", span: "row-span-2" },
  { category: "action", label: "Action", span: "" },
  { category: "artistic", label: "Artistic", span: "" },
  { category: "nature", label: "Nature", span: "" },
  { category: "sci-fi", label: "Sci-Fi", span: "row-span-2" },
  { category: "commercial", label: "Commercial", span: "" },
  { category: "creative", label: "Creative", span: "" },
  { category: "documentary", label: "Documentary", span: "col-span-2" },
];

function getVideoForCategory(cat: string): string | undefined {
  return EXAMPLE_VIDEOS.find((v) => v.category === cat)?.videoUrl;
}

function BentoCell({ category, label, span }: { category: string; label: string; span: string }) {
  const videoUrl = getVideoForCategory(category);
  const thumbnailUrl = videoUrl ? getThumbnailUrl(videoUrl, 800, 80) : "";
  const ref = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleEnter = () => {
    setHovering(true);
    if (ref.current && ref.current.preload === "none") {
      ref.current.preload = "metadata";
      ref.current.load();
    }
    ref.current?.play().catch(() => {});
  };

  return (
    <Link
      href={`/explore/${category}`}
      className={`group relative overflow-hidden rounded-2xl ${span}`}
      style={{ minHeight: span.includes("row-span") ? 240 : 120 }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => { setHovering(false); if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }}
    >
      {videoUrl ? (
        <>
          {thumbnailUrl && !videoLoaded && (
            <img
              src={thumbnailUrl}
              alt={label}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <video
            ref={ref}
            src={videoUrl}
            poster={thumbnailUrl}
            muted
            loop
            playsInline
            preload="none"
            onLoadedData={() => setVideoLoaded(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/8 to-foreground/3" />
      )}
      {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity ${hovering ? "opacity-40" : "opacity-70"}`} />
      <span className="absolute bottom-2.5 left-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
        {label}
      </span>
    </Link>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-12 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left — Copy */}
          <div className="flex flex-col justify-center">
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.92] tracking-[-0.06em] text-foreground">
              Video
              <br />
              Prompt
              <br />
              Library
            </h1>
            <p className="mt-5 max-w-md text-[1.05rem] leading-7 text-foreground/50">
              Browse 100+ curated video prompts with real examples.
              Copy any prompt, see the result, and generate your own
              with Seedance, Veo, Kling, and more on fal.ai.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center rounded-full bg-[color:var(--accent)] px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                Browse Prompts
              </Link>
              <Link
                href="/generate"
                className="inline-flex items-center rounded-full border border-[color:var(--border-soft-strong)] px-6 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-[color:var(--surface)]"
              >
                Generate Video
              </Link>
            </div>
          </div>

          {/* Right — Bento Grid with real videos */}
          <div className="grid auto-rows-[120px] grid-cols-3 gap-2.5">
            {HERO_CATEGORIES.map((item) => (
              <BentoCell key={item.category} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
