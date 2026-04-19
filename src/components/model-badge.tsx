const MODEL_COLORS: Record<string, string> = {
  kling: "#5B8DEF",
  "minimax-video": "#FF6B6B",
  "runway-gen3": "#A78BFA",
  "luma-dream-machine": "#34D399",
  wan: "#F59E0B",
  pika: "#EC4899",
  "stable-video": "#6366F1",
  hailuo: "#14B8A6",
};

const MODEL_LABELS: Record<string, string> = {
  kling: "Kling",
  "minimax-video": "Minimax",
  "runway-gen3": "Runway",
  "luma-dream-machine": "Luma",
  wan: "Wan",
  pika: "Pika",
  "stable-video": "Stable Video",
  hailuo: "Hailuo",
};

export function ModelBadge({ modelId, size = "sm" }: { modelId: string; size?: "sm" | "md" }) {
  const color = MODEL_COLORS[modelId] ?? "#888";
  const label = MODEL_LABELS[modelId] ?? modelId;
  const sizeClass = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 15%, var(--background))`,
        color,
        border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
