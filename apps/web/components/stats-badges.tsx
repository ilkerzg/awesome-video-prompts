"use client";

import { useEffect, useState } from "react";
import { Eye, Copy } from "lucide-react";

// Zero-backend target: stats are local-session only. Views/copies are
// tracked in localStorage so the badges still light up, but there is
// no aggregation across visitors.
const VIEW_KEY = "avp:views";
const COPY_KEY = "avp:copies";
function readMap(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
function writeMap(key: string, value: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function StatsBadges({ promptId }: { promptId: string }) {
  const [stats, setStats] = useState<{ views: number; copies: number } | null>(null);

  useEffect(() => {
    // Track view locally (fire and forget)
    const views = readMap(VIEW_KEY);
    views[promptId] = (views[promptId] || 0) + 1;
    writeMap(VIEW_KEY, views);

    const copies = readMap(COPY_KEY);
    setStats({ views: views[promptId] || 0, copies: copies[promptId] || 0 });
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
