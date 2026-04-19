import { Heart } from "lucide-react";
import { ModelBadge } from "./model-badge";
import { VideoPreview } from "./video-preview";

export function VideoCard({
  prompt,
  modelId,
  likes,
  author,
  category = "cinematic",
}: {
  prompt: string;
  modelId: string;
  likes: number;
  author: string;
  category?: string;
}) {
  return (
    <div className="group rounded-[var(--radius-surface)] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-2.5 transition-colors hover:border-[color:var(--border-soft-strong)]">
      <VideoPreview category={category} size="sm" />
      <div className="px-1.5 pt-3 pb-1">
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">
          {prompt}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ModelBadge modelId={modelId} />
            <span className="text-xs text-foreground/40">by {author}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground/40">
            <Heart size={12} />
            {likes}
          </div>
        </div>
      </div>
    </div>
  );
}
