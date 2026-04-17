"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/topbar";
import { CustomSelect } from "@/components/custom-select";
import { getFalKey, setFalKey, isUsingUserKey, getFal } from "@/lib/fal-client";
import {
  getSettings, setSetting, resetSettings,
  getStorageUsage, formatBytes, clearHistory, getHistory,
  type AppSettings,
} from "@/lib/history-store";
import { VIDEO_MODELS } from "@/lib/video-models";
import Link from "next/link";
import {
  Key, Eye, EyeOff, Check, AlertCircle, Loader2, Trash2,
  Shield, ExternalLink, Info, Sliders, Database, Download, Upload, RotateCcw,
} from "lucide-react";

const ASPECT_OPTIONS = [
  { id: "16:9", label: "16:9 — Landscape" },
  { id: "9:16", label: "9:16 — Portrait" },
  { id: "1:1", label: "1:1 — Square" },
  { id: "4:3", label: "4:3 — Classic" },
  { id: "21:9", label: "21:9 — Cinemascope" },
];

const DURATION_OPTIONS = [
  { id: "4s", label: "4 seconds" },
  { id: "5s", label: "5 seconds" },
  { id: "6s", label: "6 seconds" },
  { id: "8s", label: "8 seconds" },
  { id: "10s", label: "10 seconds" },
  { id: "15s", label: "15 seconds" },
];

const RESOLUTION_OPTIONS = [
  { id: "480p", label: "480p" },
  { id: "720p", label: "720p" },
  { id: "1080p", label: "1080p" },
  { id: "1440p", label: "1440p" },
  { id: "4k", label: "4K" },
];

const HISTORY_LIMITS = [
  { id: "20", label: "20 items" },
  { id: "50", label: "50 items" },
  { id: "100", label: "100 items" },
  { id: "200", label: "200 items" },
];

const THEME_OPTIONS = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsPage() {
  // API Key
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [usingUserKey, setUsingUserKey] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);

  // Preferences
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [storage, setStorage] = useState({ bytes: 0, items: 0, percentEst: 0 });
  const [historyCount, setHistoryCount] = useState(0);
  const [clearedHistory, setClearedHistory] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem("fal_key") || "");
    setUsingUserKey(isUsingUserKey());
    setHasEnvKey(!!process.env.NEXT_PUBLIC_FAL_KEY);
    setSettings(getSettings());
    setStorage(getStorageUsage());
    setHistoryCount(getHistory().length);
  }, []);

  const refreshStorage = useCallback(() => {
    setStorage(getStorageUsage());
    setHistoryCount(getHistory().length);
  }, []);

  // ─── API Key handlers ──────────────────────────────────

  const handleSave = () => {
    setFalKey(key.trim());
    setSaved(true);
    setUsingUserKey(!!key.trim());
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    setFalKey("");
    setKey("");
    setUsingUserKey(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    const currentKey = key.trim() || getFalKey();
    if (!currentKey) {
      setTestResult("error");
      setTestMessage("No API key to test");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      if (key.trim()) localStorage.setItem("fal_key", key.trim());
      const fal = getFal();
      await fal.subscribe("fal-ai/any-llm", {
        input: { prompt: "Say 'ok'", model: "openai/gpt-4o-mini" },
      });
      setTestResult("success");
      setTestMessage("Connection successful");
    } catch (e) {
      setTestResult("error");
      setTestMessage(e instanceof Error ? e.message : "Connection failed");
    }
    setTesting(false);
  };

  // ─── Preference handlers ───────────────────────────────

  const updateSetting = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    setSetting(k, v);
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const handleClearHistory = () => {
    if (!confirm(`Delete all ${historyCount} history items? This cannot be undone.`)) return;
    clearHistory();
    refreshStorage();
    setClearedHistory(true);
    setTimeout(() => setClearedHistory(false), 2000);
  };

  const handleExport = () => {
    const data = {
      settings: getSettings(),
      history: getHistory(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fal-prompts-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.settings) {
          localStorage.setItem("app_settings", JSON.stringify(parsed.settings));
          setSettings(getSettings());
        }
        if (Array.isArray(parsed.history)) {
          localStorage.setItem("generations_history", JSON.stringify(parsed.history));
          refreshStorage();
        }
        alert(`Imported ${parsed.history?.length || 0} history items and settings.`);
      } catch {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    if (!confirm("Reset preferences to defaults? (Keeps API key and history)")) return;
    resetSettings();
    setSettings(getSettings());
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  };

  const masked = show
    ? key
    : key ? key.slice(0, 4) + "•".repeat(Math.max(0, key.length - 8)) + key.slice(-4) : "";

  const videoModelOptions = VIDEO_MODELS.filter((m) => m.modes?.includes("t2v")).map((m) => ({
    id: m.id,
    label: `${m.name} (${m.provider})`,
  }));

  return (
    <>
      <TopBar title="Settings" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="max-w-3xl space-y-5">

          {/* ─── API Key ─── */}
          <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
                <Key size={18} className="text-[color:var(--accent)]" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">fal.ai API Key</h2>
                <p className="mt-1 text-xs leading-relaxed text-foreground/40">
                  All generation runs directly from your browser to fal.ai. Your key is never sent to our server.
                </p>
              </div>
              {usingUserKey && (
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                  <div className="size-1.5 rounded-full bg-emerald-400" />
                  Active
                </div>
              )}
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
              <Shield size={13} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="text-[11px] leading-relaxed text-foreground/50">
                <strong className="text-foreground/70">Client-side only.</strong> Stored in your browser&apos;s localStorage and only sent to fal.ai servers. Never reaches ours.
              </div>
            </div>

            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">
              API Key
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={hasEnvKey && !usingUserKey ? "Using project default key" : "Paste your fal.ai key..."}
                className="h-10 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] pl-3 pr-20 font-mono text-xs text-foreground placeholder:text-foreground/20 focus:border-[color:var(--accent)]/40 focus:outline-none"
              />
              <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-foreground/30 hover:text-foreground/60">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {!show && masked && (
              <p className="mt-1.5 font-mono text-[10px] text-foreground/20">{masked}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={handleSave} disabled={!key.trim() || saved}
                className="flex items-center gap-1.5 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">
                {saved ? <Check size={12} /> : null}
                {saved ? "Saved" : "Save"}
              </button>
              <button onClick={handleTest} disabled={testing || (!key.trim() && !usingUserKey)}
                className="flex items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-2 text-xs text-foreground/60 hover:text-foreground disabled:opacity-50">
                {testing ? <Loader2 size={12} className="animate-spin" /> : null}
                {testing ? "Testing..." : "Test connection"}
              </button>
              {key && (
                <button onClick={handleClear} className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-400 hover:bg-red-500/15">
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>

            {testResult && (
              <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${
                testResult === "success" ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400" : "border-red-500/10 bg-red-500/5 text-red-400"
              }`}>
                {testResult === "success" ? <Check size={13} className="mt-0.5 shrink-0" /> : <AlertCircle size={13} className="mt-0.5 shrink-0" />}
                <span>{testMessage}</span>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[color:var(--surface-secondary)] p-3">
              <Info size={13} className="mt-0.5 shrink-0 text-foreground/30" />
              <div className="text-[11px] leading-relaxed text-foreground/40">
                Don&apos;t have a key?{" "}
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">
                  Create one at fal.ai/dashboard/keys
                  <ExternalLink size={10} className="ml-0.5 inline" />
                </a>
              </div>
            </div>
          </section>

          {/* ─── Default generation preferences ─── */}
          <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <Sliders size={18} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Generation defaults</h2>
                <p className="mt-1 text-xs text-foreground/40">
                  Applied to new generations across the app. Individual pages can still override.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Default model</label>
                <CustomSelect
                  options={videoModelOptions}
                  value={settings.defaultModel}
                  onChange={(v) => v && updateSetting("defaultModel", v)}
                  placeholder="Seedance 2.0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Aspect ratio</label>
                <CustomSelect
                  options={ASPECT_OPTIONS}
                  value={settings.defaultAspectRatio}
                  onChange={(v) => v && updateSetting("defaultAspectRatio", v)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Duration</label>
                <CustomSelect
                  options={DURATION_OPTIONS}
                  value={settings.defaultDuration}
                  onChange={(v) => v && updateSetting("defaultDuration", v)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Resolution</label>
                <CustomSelect
                  options={RESOLUTION_OPTIONS}
                  value={settings.defaultResolution}
                  onChange={(v) => v && updateSetting("defaultResolution", v)}
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.autoplayVideos}
                onChange={(e) => updateSetting("autoplayVideos", e.target.checked)}
                className="size-4 rounded border border-[color:var(--border-soft)]" />
              <span className="text-xs text-foreground/60">Autoplay videos when opening detail pages</span>
            </label>
          </section>

          {/* ─── History & storage ─── */}
          <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Database size={18} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">History &amp; storage</h2>
                <p className="mt-1 text-xs text-foreground/40">
                  Generations are saved locally in your browser. No server sync.
                </p>
              </div>
            </div>

            {/* Usage stats */}
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/30">History items</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{historyCount}</p>
              </div>
              <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/30">Storage used</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatBytes(storage.bytes)}</p>
              </div>
              <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/30">Quota used</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${storage.percentEst}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-foreground/40">{storage.percentEst.toFixed(1)}% of ~5 MB</p>
              </div>
            </div>

            {/* History limit */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Keep last</label>
                <CustomSelect
                  options={HISTORY_LIMITS}
                  value={String(settings.historyLimit)}
                  onChange={(v) => v && updateSetting("historyLimit", Number(v))}
                />
                <p className="mt-1 text-[10px] text-foreground/30">Older generations are pruned automatically.</p>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground/30">Theme</label>
                <CustomSelect
                  options={THEME_OPTIONS}
                  value={settings.theme}
                  onChange={(v) => v && updateSetting("theme", v as AppSettings["theme"])}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleExport}
                className="flex items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-2 text-xs text-foreground/60 hover:text-foreground">
                <Download size={12} /> Export backup
              </button>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-2 text-xs text-foreground/60 hover:text-foreground">
                <Upload size={12} /> Import backup
                <input type="file" accept="application/json" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
              </label>
              <button onClick={handleResetAll}
                className="flex items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-2 text-xs text-foreground/60 hover:text-foreground">
                {resetDone ? <Check size={12} /> : <RotateCcw size={12} />}
                {resetDone ? "Reset" : "Reset preferences"}
              </button>
              <button onClick={handleClearHistory} disabled={historyCount === 0}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-400 hover:bg-red-500/15 disabled:opacity-30">
                {clearedHistory ? <Check size={12} /> : <Trash2 size={12} />}
                {clearedHistory ? "Cleared" : "Clear history"}
              </button>
            </div>
          </section>

          {/* ─── Security ─── */}
          <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">Security &amp; data</h2>
            <ul className="space-y-2 text-xs leading-relaxed text-foreground/50">
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> API key in localStorage only — never sent to our servers</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Generation requests go browser → fal.ai directly</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Generation history stored locally, never uploaded</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Like counts + view counts are the only data we store (no personal info)</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span> No server-side logging of prompts, videos, or keys</li>
            </ul>
            <p className="mt-3 text-[11px] text-foreground/30">
              Source:{" "}
              <Link href="https://github.com/ilkerzg/fal-awesome-prompts" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">
                GitHub
              </Link>
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
