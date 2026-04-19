"use client";

import { useEffect, useState } from "react";
import { Eye, Copy } from "lucide-react";
import { trackView, getPromptStats } from "@/lib/supabase";

export function StatsBadges({ promptId }: { promptId: string }) {
  const [stats, setStats] = useState<{ views: number; copies: number } | null>(null);

  useEffect(() => {
    // Track view on mount (fire and forget)
    trackView(promptId);

    // Fetch stats
    let cancelled = false;
    getPromptStats(promptId).then((s) => {
      if (cancelled) return;
      setStats({ views: s.views, copies: s.copies });
    });

    // Poll for updates every 30s while page is open
    const interval = setInterval(() => {
      getPromptStats(promptId).then((s) => {
        if (cancelled) return;
        setStats({ views: s.views, copies: s.copies });
      });
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [promptId]);

  if (!stats) {
    return (
      <>
        <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/20">
          <Eye size={12} />
          <span className="tabular-nums">—</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/20">
          <Copy size={12} />
          <span className="tabular-nums">—</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/40" title="Views">
        <Eye size={12} />
        <span className="tabular-nums">{stats.views}</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--surface)] px-3 py-1.5 text-xs text-foreground/40" title="Copies">
        <Copy size={12} />
        <span className="tabular-nums">{stats.copies}</span>
      </div>
    </>
  );
}
