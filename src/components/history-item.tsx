import { CheckCircle, Clock, XCircle } from "lucide-react";
import { ModelBadge } from "./model-badge";
import { VideoPreview } from "./video-preview";

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, label: "Completed", color: "var(--success)" },
  processing: { icon: Clock, label: "Processing", color: "var(--warning)" },
  failed: { icon: XCircle, label: "Failed", color: "var(--danger)" },
} as const;

export function HistoryItem({
  prompt,
  modelId,
  status,
  createdAt,
  duration,
  category = "cinematic",
}: {
  prompt: string;
  modelId: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
  duration: string;
  category?: string;
}) {
  const s = STATUS_CONFIG[status];
  const Icon = s.icon;
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-[var(--radius-surface)] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-2.5">
      <VideoPreview category={category} duration={duration} size="sm" />
      <div className="px-1.5 pt-3 pb-1">
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">
          {prompt}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <ModelBadge modelId={modelId} />
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `color-mix(in oklab, ${s.color} 12%, var(--background))`,
              color: s.color,
            }}
          >
            <Icon size={10} />
            {s.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-foreground/40">{date}</p>
      </div>
    </div>
  );
}
