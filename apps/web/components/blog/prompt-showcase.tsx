"use client";

import { useState } from "react";
import { Copy, Check, ArrowRight, Sparkles } from "lucide-react";

export function PromptShowcase({
  before,
  after,
  model,
}: {
  before: string;
  after: string;
  model?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-[color:var(--border-soft)]">
      {/* Before */}
      <div className="border-b border-[color:var(--separator)] bg-[color:var(--surface)] px-4 py-3">
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
          Original prompt
        </p>
        <p className="text-sm leading-relaxed text-foreground/40">{before}</p>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center gap-2 bg-[color:var(--accent)]/5 py-2">
        <Sparkles size={12} className="text-[color:var(--accent)]" />
        <span className="text-[10px] font-semibold text-[color:var(--accent)]">
          Enhanced{model ? ` for ${model}` : ""}
        </span>
        <ArrowRight size={12} className="text-[color:var(--accent)]" />
      </div>

      {/* After */}
      <div className="bg-[color:var(--surface-secondary)] px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--accent)]">
            Enhanced prompt
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-foreground/25 hover:text-foreground/60"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-sm leading-relaxed text-foreground/60">{after}</p>
      </div>
    </div>
  );
}
