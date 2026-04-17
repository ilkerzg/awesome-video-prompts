"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { EmptyStateView } from "@/components/empty-state-view";
import { TopBar } from "@/components/topbar";
import { CustomSelect } from "@/components/custom-select";
import {
  getHistory, removeHistoryItem, clearHistory, subscribeHistory,
  type HistoryItem, type HistorySource,
} from "@/lib/history-store";
import { getThumbnailUrl } from "@/lib/media-url";
import {
  Clock, Trash2, Copy, Download, ExternalLink,
  Film, Mic, BookOpen, Podcast as PodcastIcon, Camera,
  Layers, Braces, MessageSquareText, Sparkles, Check,
} from "lucide-react";

const SOURCE_LABELS: Record<HistorySource, string> = {
  generate: "Generate",
  shorts: "Shorts",
  podcast: "Podcast",
  scenario: "Scene Builder",
  "multi-shot": "Multi-Shot",
  "json-prompt": "JSON Prompt",
  "shot-composer": "Shot Composer",
  "prompt-gen": "Prompt Gen",
};

const SOURCE_ICONS: Record<HistorySource, React.ComponentType<{ size?: number; className?: string }>> = {
  generate: Sparkles,
  shorts: Film,
  podcast: PodcastIcon,
  scenario: BookOpen,
  "multi-shot": Layers,
  "json-prompt": Braces,
  "shot-composer": Camera,
  "prompt-gen": MessageSquareText,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function HistoryCard({ item, onRemove }: { item: HistoryItem; onRemove: (id: string) => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const Icon = SOURCE_ICONS[item.source] || Mic;

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const thumbUrl = item.thumbnailUrl || (item.mediaUrl ? getThumbnailUrl(item.mediaUrl, 480, 75) : "");

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] transition-colors hover:border-[color:var(--border-soft-strong)]">
      {/* Media */}
      <div className="relative aspect-video overflow-hidden bg-black/20">
        {item.mediaType === "video" ? (
          <video
            src={item.mediaUrl}
            poster={thumbUrl}
            muted loop playsInline preload="none"
            className="h-full w-full object-cover"
            onMouseEnter={(e) => { const v = e.currentTarget; if (v.preload === "none") { v.preload = "metadata"; v.load(); } v.play().catch(() => {}); }}
            onMouseLeave={(e) => { e.currentTarget.pause(); }}
          />
        ) : item.mediaType === "image" ? (
          <img src={item.mediaUrl} alt={item.prompt.slice(0, 40)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <audio src={item.mediaUrl} controls className="max-w-full" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <Icon size={10} />
          {SOURCE_LABELS[item.source]}
        </div>
        {item.duration && (
          <div className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
            {item.duration}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        {item.title && (
          <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
        )}
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-foreground/45">
          {item.prompt}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-foreground/30">
          {item.modelName && <span className="rounded-md bg-[color:var(--accent)]/10 px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--accent)]">{item.modelName}</span>}
          {item.resolution && <span>{item.resolution}</span>}
          {item.aspectRatio && <span>{item.aspectRatio}</span>}
          <span className="ml-auto">{timeAgo(item.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center gap-1 border-t border-[color:var(--separator)] pt-2">
          <button onClick={() => copy(item.prompt, "prompt")} title="Copy prompt"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-foreground/40 hover:text-foreground">
            {copiedField === "prompt" ? <Check size={10} /> : <Copy size={10} />}
            Prompt
          </button>
          <a href={item.mediaUrl} target="_blank" rel="noreferrer" download title="Download media"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-foreground/40 hover:text-foreground">
            <Download size={10} /> Media
          </a>
          <a href={item.mediaUrl} target="_blank" rel="noreferrer" title="Open"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-foreground/40 hover:text-foreground">
            <ExternalLink size={10} /> Open
          </a>
          <button onClick={() => onRemove(item.id)} title="Remove from history"
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-foreground/30 hover:text-red-400">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getHistory());
    setHydrated(true);
    const unsub = subscribeHistory(() => setItems(getHistory()));
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (sourceFilter && i.source !== sourceFilter) return false;
      if (mediaFilter && i.mediaType !== mediaFilter) return false;
      return true;
    });
  }, [items, sourceFilter, mediaFilter]);

  const sources = useMemo(() => {
    const present = Array.from(new Set(items.map((i) => i.source)));
    return present.map((s) => ({ id: s, label: SOURCE_LABELS[s] || s }));
  }, [items]);

  const handleClearAll = () => {
    if (!confirm(`Remove all ${items.length} history items?`)) return;
    clearHistory();
  };

  if (!hydrated) {
    return (
      <>
        <TopBar title="History" />
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <p className="text-sm text-foreground/30">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="History" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Filters */}
        {items.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <CustomSelect
              options={sources}
              value={sourceFilter}
              onChange={setSourceFilter}
              placeholder="All sources"
              className="w-[180px]"
            />
            <CustomSelect
              options={[
                { id: "video", label: "Videos" },
                { id: "image", label: "Images" },
                { id: "audio", label: "Audio" },
              ]}
              value={mediaFilter}
              onChange={setMediaFilter}
              placeholder="All media"
              className="w-[140px]"
            />
            <p className="text-xs text-foreground/30">
              {filtered.length} of {items.length}
            </p>
            {(sourceFilter || mediaFilter) && (
              <button
                onClick={() => { setSourceFilter(null); setMediaFilter(null); }}
                className="text-xs text-[color:var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/15"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <HistoryCard key={item.id} item={item} onRemove={removeHistoryItem} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyStateView
            icon={Clock}
            title="No generations yet"
            description={
              <>
                Start creating videos, podcasts, or scenarios — each completed generation will appear here.
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Link href="/generate" className="rounded-lg bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-black">Generate</Link>
                  <Link href="/shorts" className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground">Shorts</Link>
                  <Link href="/podcast" className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground">Podcast</Link>
                  <Link href="/scenario" className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground">Scenario</Link>
                </div>
              </>
            }
          />
        ) : (
          <EmptyStateView icon={Clock} title="No matches" description="Adjust the filters above to see your generations." />
        )}
      </div>
    </>
  );
}
