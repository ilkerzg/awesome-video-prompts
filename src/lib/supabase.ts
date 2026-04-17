/**
 * Client-side helpers for like/view/submission actions.
 *
 * All mutations go through Next.js API routes which enforce:
 * - Rate limiting (30 toggles/min/IP, 60 views/min/IP, 3 submissions/hour/IP)
 * - Server-side IP detection (client cannot spoof)
 * - IP + fingerprint dedup (spoofing fingerprint alone won't bypass)
 * - Input validation
 * - Only SECURITY DEFINER Postgres functions can write
 *
 * Reads go through the same API routes to keep IP hidden from client.
 */

// ─── Fingerprint (browser characteristics hash) ─────────────

export function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

// ─── Likes ──────────────────────────────────────────────────

export async function toggleLike(promptId: string): Promise<{ liked: boolean; count: number } | null> {
  try {
    const res = await fetch("/api/likes/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, fingerprint: getFingerprint() }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getLikeStatus(promptId: string): Promise<{ liked: boolean; count: number }> {
  try {
    const res = await fetch("/api/likes/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, fingerprint: getFingerprint() }),
    });
    if (!res.ok) return { liked: false, count: 0 };
    return await res.json();
  } catch {
    return { liked: false, count: 0 };
  }
}

export async function getLikeCounts(promptIds: string[]): Promise<Record<string, number>> {
  if (!promptIds.length) return {};
  try {
    const res = await fetch("/api/likes/counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptIds }),
    });
    if (!res.ok) return {};
    const { counts } = await res.json();
    return counts || {};
  } catch {
    return {};
  }
}

// ─── Views ──────────────────────────────────────────────────

export async function trackView(promptId: string): Promise<void> {
  try {
    await fetch("/api/views/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, fingerprint: getFingerprint() }),
    });
  } catch {
    // silent fail
  }
}

// ─── Copies ─────────────────────────────────────────────────

export async function trackCopy(promptId: string): Promise<{ count: number } | null> {
  try {
    const res = await fetch("/api/copies/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, fingerprint: getFingerprint() }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Stats (likes + views + copies) ─────────────────────────

export async function getPromptStats(
  promptId: string,
): Promise<{ likes: number; views: number; copies: number }> {
  try {
    const res = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId }),
    });
    if (!res.ok) return { likes: 0, views: 0, copies: 0 };
    return await res.json();
  } catch {
    return { likes: 0, views: 0, copies: 0 };
  }
}
