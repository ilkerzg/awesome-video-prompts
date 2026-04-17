"use client";

export function CategoryChip({
  category,
  label,
  selected = false,
  onClick,
}: {
  category: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-foreground text-background"
          : "bg-[color:var(--default)] text-foreground/70 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
