import { Info, Lightbulb, AlertTriangle, Flame, Zap } from "lucide-react";

type CalloutVariant = "info" | "tip" | "warning" | "danger" | "note";

const variants: Record<CalloutVariant, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  border: string;
  bg: string;
  iconColor: string;
  titleColor: string;
}> = {
  info: {
    icon: Info,
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
  },
  tip: {
    icon: Lightbulb,
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
    titleColor: "text-amber-400",
  },
  danger: {
    icon: Flame,
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
    titleColor: "text-red-400",
  },
  note: {
    icon: Zap,
    border: "border-[color:var(--accent)]/20",
    bg: "bg-[color:var(--accent)]/5",
    iconColor: "text-[color:var(--accent)]",
    titleColor: "text-[color:var(--accent)]",
  },
};

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <aside
      role="note"
      className={`my-5 rounded-xl border ${v.border} ${v.bg} p-4`}
    >
      <div className="flex gap-3">
        <Icon size={18} className={`mt-0.5 shrink-0 ${v.iconColor}`} />
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`mb-1 text-sm font-semibold ${v.titleColor}`}>
              {title}
            </p>
          )}
          <div className="text-sm leading-relaxed text-foreground/50">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
