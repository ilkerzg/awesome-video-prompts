"use client";

import { Check } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export function ModelSelector({
  models,
  selected,
  onSelect,
}: {
  models: ModelOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {models.map((m) => {
        const active = m.id === selected;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`relative flex flex-col items-start rounded-[var(--radius-control)] border p-3 text-left transition-colors ${
              active
                ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5"
                : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--border-soft-strong)]"
            }`}
          >
            {active && (
              <Check
                size={14}
                className="absolute top-2.5 right-2.5 text-[color:var(--accent)]"
              />
            )}
            <span className="text-sm font-semibold text-foreground">
              {m.name}
            </span>
            <span className="text-[11px] text-foreground/40">{m.provider}</span>
          </button>
        );
      })}
    </div>
  );
}
