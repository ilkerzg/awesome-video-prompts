const stats = [
  { value: "500+", label: "Prompts" },
  { value: "10K+", label: "Videos Generated" },
  { value: "8", label: "AI Models" },
  { value: "10", label: "Categories" },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-[var(--radius-surface)] border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-5 py-4 text-center"
        >
          <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {s.value}
          </p>
          <p className="mt-0.5 text-xs text-foreground/50">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
