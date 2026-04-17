"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Heart } from "lucide-react";

// Zero-backend target: likes are localStorage-only. Supabase was intentionally
// not ported. Counts start at initialCount and only increment on this client.
const LS_KEY = "avp:likes";
function readLikes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeLikes(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded */
  }
}
async function getLikeStatus(promptId: string): Promise<{ liked: boolean; count: number }> {
  const state = readLikes();
  return { liked: !!state[promptId], count: state[promptId] ? 1 : 0 };
}
async function toggleLike(promptId: string): Promise<{ liked: boolean; count: number } | null> {
  const state = readLikes();
  const next = !state[promptId];
  if (next) state[promptId] = true; else delete state[promptId];
  writeLikes(state);
  return { liked: next, count: next ? 1 : 0 };
}

export function LikeButton({
  promptId,
  initialCount,
  compact = false,
}: {
  promptId: string;
  initialCount?: number;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [burst, setBurst] = useState(0); // triggers particle animation
  const lastClickRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getLikeStatus(promptId).then((status) => {
      if (cancelled) return;
      setLiked(status.liked);
      setCount(status.count);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [promptId]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastClickRef.current < 500 || pending) return;
    lastClickRef.current = now;

    setPending(true);
    setError(false);

    const prevLiked = liked;
    const prevCount = count;
    const willLike = !prevLiked;

    // Optimistic + burst animation only when liking (not unliking)
    setLiked(willLike);
    setCount(prevCount + (prevLiked ? -1 : 1));
    if (willLike) setBurst((b) => b + 1);

    const result = await toggleLike(promptId);
    if (!result) {
      setLiked(prevLiked);
      setCount(prevCount);
      setError(true);
      setTimeout(() => setError(false), 2000);
    } else {
      setLiked(result.liked);
      setCount(result.count);
    }
    setPending(false);
  }, [promptId, liked, count, pending]);

  const baseClass = compact
    ? `flex items-center gap-1 text-xs transition-colors ${
        error ? "text-red-400" : liked ? "text-pink-400" : "text-foreground/40 hover:text-pink-400"
      } ${pending ? "opacity-70" : ""}`
    : `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
        error
          ? "bg-red-500/10 text-red-400"
          : liked
          ? "bg-pink-500/10 text-pink-400"
          : "bg-[color:var(--surface)] text-foreground/40 hover:bg-pink-500/5 hover:text-pink-400"
      } ${pending ? "opacity-70" : ""}`;

  const iconSize = compact ? 12 : 13;

  return (
    <button
      onClick={handleClick}
      disabled={!loaded || pending}
      className={baseClass}
      title={error ? "Rate limit — try again" : liked ? "Unlike" : "Like"}
    >
      <span className="relative inline-flex items-center justify-center">
        {/* Heart icon with scale/pop on toggle */}
        <Heart
          size={iconSize}
          fill={liked ? "currentColor" : "none"}
          className={`transition-transform duration-300 ${
            burst > 0 && liked ? "heart-pop" : ""
          }`}
          key={`heart-${burst}-${liked}`}
        />

        {/* Particle burst — only visible briefly after a like */}
        {burst > 0 && liked && (
          <span
            key={`burst-${burst}`}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            {/* Ring pulse */}
            <span className="heart-ring absolute size-5 rounded-full border-2 border-pink-400/70" />
            {/* 6 particles */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <span
                key={angle}
                className="heart-particle absolute size-0.5 rounded-full bg-pink-400"
                style={{ ["--angle" as string]: `${angle}deg` }}
              />
            ))}
          </span>
        )}
      </span>
      <span className="tabular-nums font-medium">{count}</span>
    </button>
  );
}
