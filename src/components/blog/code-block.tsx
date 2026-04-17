"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({
  code,
  language,
  filename,
  caption,
}: {
  code: string;
  language?: string;
  filename?: string;
  caption?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <figure className="my-5">
      <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--separator)] px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Dots */}
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-foreground/10" />
              <span className="size-2.5 rounded-full bg-foreground/10" />
              <span className="size-2.5 rounded-full bg-foreground/10" />
            </div>
            {filename && (
              <span className="ml-2 font-mono text-[11px] text-foreground/30">
                {filename}
              </span>
            )}
            {language && !filename && (
              <span className="ml-2 rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[9px] uppercase text-foreground/25">
                {language}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-foreground/25 transition-colors hover:text-foreground/60"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {/* Code */}
        <pre className="overflow-x-auto p-4">
          <code className="font-mono text-[13px] leading-relaxed text-foreground/60">
            {code}
          </code>
        </pre>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
