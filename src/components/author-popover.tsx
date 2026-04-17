"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, ExternalLink, Search, X } from "lucide-react";

interface OtherWork {
  id: string;
  prompt: string;
  videoUrl: string;
  category: string;
}

export function AuthorPopover({
  author,
  source,
  otherWorks,
}: {
  author: string;
  source: string;
  otherWorks: OtherWork[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Extract handle from author string like "John (@johnAGI168)"
  const handleMatch = author.match(/@(\w+)/);
  const handle = handleMatch ? handleMatch[1] : null;
  const displayName = author.replace(/\s*\(@?\w+\)\s*$/, "");
  const twitterUrl = handle ? `https://x.com/${handle}` : null;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/40 hover:text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5 transition-colors"
      >
        <User size={12} />
        {displayName}
        {handle && <span className="text-foreground/20">@{handle}</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-xl shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[color:var(--separator)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                <User size={14} className="text-[color:var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {handle && <p className="text-[10px] text-foreground/30">@{handle}</p>}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-foreground/20 hover:text-foreground/50">
              <X size={14} />
            </button>
          </div>

          {/* Actions */}
          <div className="border-b border-[color:var(--separator)] px-4 py-2.5 space-y-1">
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <ExternalLink size={12} />
                View on X (Twitter)
              </a>
            )}
            {source && /^https?:\/\//i.test(source) && (
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <ExternalLink size={12} />
                Original post
              </a>
            )}
            <Link
              href={`/explore?author=${encodeURIComponent(displayName)}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors"
            >
              <Search size={12} />
              All prompts by {displayName}
              {otherWorks.length > 0 && (
                <span className="ml-auto rounded-full bg-[color:var(--accent)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--accent)]">
                  {otherWorks.length + 1}
                </span>
              )}
            </Link>
          </div>

          {/* Other works preview */}
          {otherWorks.length > 0 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-foreground/20">
                More by {displayName}
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {otherWorks.slice(0, 5).map((work) => (
                  <Link
                    key={work.id}
                    href={`/explore/${work.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 rounded-lg p-1.5 hover:bg-foreground/5 transition-colors"
                  >
                    <video
                      src={work.videoUrl}
                      muted
                      preload="metadata"
                      className="size-10 shrink-0 rounded-md object-cover"
                    />
                    <p className="text-[10px] leading-relaxed text-foreground/40 line-clamp-2 pt-0.5">
                      {work.prompt.slice(0, 100)}...
                    </p>
                  </Link>
                ))}
                {otherWorks.length > 5 && (
                  <Link
                    href={`/explore?author=${encodeURIComponent(displayName)}`}
                    onClick={() => setOpen(false)}
                    className="block text-center text-[10px] text-[color:var(--accent)] hover:underline pt-1"
                  >
                    +{otherWorks.length - 5} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
