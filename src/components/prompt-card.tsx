"use client";

import { ModelBadge } from "./model-badge";
import { CopyButton } from "./copy-button";
import { VideoPreview } from "./video-preview";
import { LikeButton } from "./like-button";
import Link from "next/link";

export function PromptCard({
  id,
  text,
  category,
  modelId,
  tags = [],
  videoUrl,
}: {
  id: string;
  text: string;
  category: string;
  modelId: string;
  likes?: number;
  tags?: string[];
  videoUrl?: string;
}) {
  return (
    <div className="group flex flex-col rounded-[var(--radius-surface)] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-2.5 transition-colors hover:border-[color:var(--border-soft-strong)]">
      <Link href={`/explore/${id}`}>
        <VideoPreview category={category} videoUrl={videoUrl} size="sm" />
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        <Link href={`/explore/${id}`}>
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80 hover:text-foreground">
            {text}
          </p>
        </Link>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ModelBadge modelId={modelId} />
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[color:var(--default)] px-2 py-0.5 text-[11px] text-foreground/50"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[color:var(--separator)] pt-3">
          <LikeButton promptId={id} compact />
          <CopyButton text={text} promptId={id} />
        </div>
      </div>
    </div>
  );
}
