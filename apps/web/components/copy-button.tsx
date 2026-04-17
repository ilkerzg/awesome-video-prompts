"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Zero-backend target: copy tracking is localStorage-only.
function trackCopy(promptId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("avp:copies") || "{}";
    const map = JSON.parse(raw) as Record<string, number>;
    map[promptId] = (map[promptId] || 0) + 1;
    window.localStorage.setItem("avp:copies", JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function CopyButton({
  text,
  promptId,
  className = "",
}: {
  text: string;
  promptId?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);

    // Track copy (fire and forget, rate limited server-side)
    if (promptId) {
      trackCopy(promptId);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        copied
          ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
          : "bg-[color:var(--default)] text-foreground hover:bg-[color:var(--surface-tertiary)]"
      } ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
