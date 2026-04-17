"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GeneratePanel } from "@/components/generate-panel";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/topbar";
import { getRecentHistory, subscribeHistory, type HistoryItem } from "@/lib/history-store";
import { getThumbnailUrl } from "@/lib/media-url";
import { Clock, Sparkles } from "lucide-react";

function RecentCard({ item }: { item: HistoryItem }) {
  const thumb = item.thumbnailUrl || (item.mediaUrl ? getThumbnailUrl(item.mediaUrl, 480, 75) : "");
  return (
    <Link href="/history" className="group overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--border-soft-strong)]">
      <div className="relative aspect-video overflow-hidden bg-black/10">
        {item.mediaType === "video" ? (
          <>
            {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <video src={item.mediaUrl} muted loop playsInline preload="none"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100"
              onMouseEnter={(e) => { const v = e.currentTarget; if (v.preload === "none") { v.preload = "metadata"; v.load(); } v.play().catch(() => {}); }}
              onMouseLeave={(e) => { e.currentTarget.pause(); }} />
          </>
        ) : (
          <img src={item.mediaUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-xs leading-relaxed text-foreground/60">{item.prompt}</p>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-foreground/30">
          {item.modelName && <span className="rounded-md bg-[color:var(--accent)]/10 px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--accent)]">{item.modelName}</span>}
          <span className="ml-auto">{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

export default function GeneratePage() {
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecent(getRecentHistory(3));
    setHydrated(true);
    const unsub = subscribeHistory(() => setRecent(getRecentHistory(3)));
    return unsub;
  }, []);

  return (
    <>
      <TopBar title="Generate Video" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <GeneratePanel />

        {hydrated && recent.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Recent Generations" href="/history" linkLabel="View all" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((item) => <RecentCard key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {hydrated && recent.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-[color:var(--border-soft)] p-8 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
              <Sparkles size={16} className="text-[color:var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-foreground">Your generations will appear here</p>
            <p className="mt-1 text-xs text-foreground/40">
              Completed videos are saved to your browser. Check{" "}
              <Link href="/history" className="text-[color:var(--accent)] hover:underline">History</Link>
              {" "}to see everything you&apos;ve generated.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
