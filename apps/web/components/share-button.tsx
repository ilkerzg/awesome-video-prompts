"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-1.5 text-[11px] text-foreground/30 transition-colors hover:text-foreground"
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
