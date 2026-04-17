import { VideoOff } from "lucide-react";

export function EmptyStateView({
  title = "Nothing here yet",
  description = "Check back later or try a different filter.",
  icon: Icon = VideoOff,
}: {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[color:var(--default)]">
        <Icon size={28} className="text-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-1 max-w-sm text-sm text-foreground/50">{description}</div>
    </div>
  );
}
