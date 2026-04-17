/**
 * Unified generation history (localStorage-backed).
 *
 * All generation pages call `addHistoryItem()` when a generation completes.
 * History and Recent Generations read from `getHistory()`.
 *
 * Storage is capped by user preference (default 50 items).
 * Oldest items are pruned when the cap is exceeded.
 */

const STORAGE_KEY = "generations_history";
const SETTINGS_KEY = "app_settings";
const EMIT_EVENT = "history-changed";

// ─── Types ──────────────────────────────────────────────────

export type HistorySource =
  | "generate"
  | "shorts"
  | "podcast"
  | "scenario"
  | "multi-shot"
  | "json-prompt"
  | "shot-composer"
  | "prompt-gen";

export type HistoryMediaType = "video" | "image" | "audio";

export interface HistoryItem {
  id: string;
  source: HistorySource;
  mediaType: HistoryMediaType;
  prompt: string;
  title?: string;
  modelId?: string;
  modelName?: string;
  aspectRatio?: string;
  duration?: string;
  resolution?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  cost?: string;
}

// ─── Read ───────────────────────────────────────────────────

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getHistoryBySource(source: HistorySource): HistoryItem[] {
  return getHistory().filter((i) => i.source === source);
}

export function getRecentHistory(limit = 6): HistoryItem[] {
  return getHistory().slice(0, limit);
}

// ─── Write ──────────────────────────────────────────────────

export function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): HistoryItem {
  if (typeof window === "undefined") throw new Error("Server context");
  const full: HistoryItem = {
    ...item,
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const current = getHistory();
  const limit = getSettings().historyLimit;
  const updated = [full, ...current].slice(0, limit);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EMIT_EVENT));
  return full;
}

export function removeHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  const updated = getHistory().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EMIT_EVENT));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EMIT_EVENT));
}

// ─── Subscribe (for live updates) ───────────────────────────

export function subscribeHistory(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EMIT_EVENT, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) callback();
  });
  return () => window.removeEventListener(EMIT_EVENT, handler);
}

// ─── Storage usage ──────────────────────────────────────────

export function getStorageUsage(): { bytes: number; items: number; percentEst: number } {
  if (typeof window === "undefined") return { bytes: 0, items: 0, percentEst: 0 };
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? "";
    total += key.length + value.length;
  }
  const items = getHistory().length;
  // Browsers allow ~5-10MB; use 5MB as a conservative estimate for %
  const percentEst = Math.min(100, (total / (5 * 1024 * 1024)) * 100);
  return { bytes: total, items, percentEst };
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Settings ──────────────────────────────────────────────

export interface AppSettings {
  historyLimit: number;
  defaultModel: string;
  defaultAspectRatio: string;
  defaultDuration: string;
  defaultResolution: string;
  autoplayVideos: boolean;
  theme: "system" | "light" | "dark";
}

const DEFAULT_SETTINGS: AppSettings = {
  historyLimit: 50,
  defaultModel: "seedance-2.0",
  defaultAspectRatio: "16:9",
  defaultDuration: "5s",
  defaultResolution: "720p",
  autoplayVideos: true,
  theme: "system",
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  if (typeof window === "undefined") return;
  const current = getSettings();
  const updated = { ...current, [key]: value };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("settings-changed"));
}

export function resetSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SETTINGS_KEY);
  window.dispatchEvent(new CustomEvent("settings-changed"));
}

export function subscribeSettings(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("settings-changed", handler);
  return () => window.removeEventListener("settings-changed", handler);
}
