"use client";

import { useState, useCallback, useRef } from "react";
import { TopBar } from "@/components/topbar";
import { getFal, runLLM } from "@/lib/fal-client";
import { VIDEO_MODELS, getModel, getEndpoint } from "@/lib/video-models";
import { buildEnhancePrompt } from "@/lib/prompt-profiles";
import { useSubmitShortcut } from "@/lib/use-submit-shortcut";
import { CustomSelect } from "@/components/custom-select";
import {
  Wand2, Copy, Download, Loader2, RotateCcw, Pencil, Check, Eye, EyeOff,
  Play, Square, AlertCircle, Volume2,
} from "lucide-react";

const SYSTEM = `You are an expert video-prompt composer. Analyze the input and create a comprehensive JSON breakdown. Include 8-15 categories from: "subject", "action_blocking", "environment", "setting", "lighting", "camera_shot", "camera_movement", "lens", "focus_control", "composition", "mood", "style", "style_family", "color_grade", "time_of_day", "weather", "motion_logic", "frame_rate_motion", "sound_direction", "transitions_editing", "vfx". For each, provide vivid cinematic descriptions (3-12 words). Output ONLY valid JSON. User Input:\n`;

const MODEL_OPTIONS = VIDEO_MODELS.filter((m) => m.modes.includes("t2v")).map((m) => ({
  id: m.id,
  label: `${m.name} (${m.provider})`,
}));

interface CatState {
  enabled: boolean;
  value: string;
  editing: boolean;
}

type GenStatus = "idle" | "enhancing" | "queued" | "generating" | "completed" | "failed";

export default function JsonPromptPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState<Record<string, CatState>>({});
  const [rawMode, setRawMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);

  // Generation state
  const [modelId, setModelId] = useState("seedance-2.0");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [genProgress, setGenProgress] = useState(0);
  const [genError, setGenError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const model = getModel(modelId);

  const generate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const raw = await runLLM(SYSTEM + input.trim());
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const parsed = JSON.parse(match[0]);
      const c: Record<string, CatState> = {};
      Object.entries(parsed).forEach(([k, v]) => {
        c[k] = { enabled: true, value: String(v), editing: false };
      });
      setCats(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [input]);

  useSubmitShortcut(textareaRef, generate, !loading);

  const toggle = (k: string) =>
    setCats((p) => ({ ...p, [k]: { ...p[k], enabled: !p[k].enabled } }));
  const update = (k: string, v: string) =>
    setCats((p) => ({ ...p, [k]: { ...p[k], value: v } }));
  const toggleEdit = (k: string) =>
    setCats((p) => ({ ...p, [k]: { ...p[k], editing: !p[k].editing } }));

  const json = () => {
    const o: Record<string, string> = {};
    Object.entries(cats).forEach(([k, v]) => {
      if (v.enabled) o[k] = v.value;
    });
    return JSON.stringify(o, null, 2);
  };

  const buildPromptFromJson = useCallback(() => {
    const enabled = Object.entries(cats).filter(([, v]) => v.enabled);
    return enabled.map(([k, v]) => `${k}: ${v.value}`).join(". ");
  }, [cats]);

  const copy = () => {
    navigator.clipboard.writeText(json());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const dl = () => {
    const b = new Blob([json()], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "prompt.json";
    a.click();
    URL.revokeObjectURL(u);
  };

  // Video generation from JSON categories
  const generateVideo = useCallback(async () => {
    if (!model || Object.keys(cats).length === 0) return;
    cancelRef.current = false;
    setGenStatus("enhancing");
    setGenProgress(0);
    setGenError("");
    setVideoUrl(null);

    try {
      const fal = getFal();
      const rawPrompt = buildPromptFromJson();

      // Enhance prompt for the selected model
      let finalPrompt = rawPrompt;
      try {
        const enhanceInput = buildEnhancePrompt(rawPrompt, modelId);
        const enhanced = await runLLM(enhanceInput, "anthropic/claude-sonnet-4");
        finalPrompt = enhanced
          .replace(/^["'`]+|["'`]+$/g, "")
          .replace(/^#+\s*/gm, "")
          .trim();
      } catch {
        finalPrompt = rawPrompt;
      }

      if (cancelRef.current) return;
      setGenStatus("queued");

      const endpoint = getEndpoint(model, "t2v");
      if (!endpoint) throw new Error("No endpoint");

      const extras: Record<string, string | number | boolean> = {};
      model.capabilities.extras.forEach((e) => {
        if (e.default !== undefined) extras[e.key] = e.default;
      });

      const input = model.buildInput(
        {
          prompt: finalPrompt,
          duration: model.capabilities.duration.default,
          aspectRatio: model.capabilities.aspectRatio.default,
          resolution: model.capabilities.resolution.default,
          audioEnabled: audioEnabled && model.capabilities.audio,
          negativePrompt: model.capabilities.negativePrompt ? "blur, distort, low quality" : "",
          seed: null,
          imageUrl: null,
          endImageUrl: null,
          extras,
        },
        "t2v",
      );

      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (upd: { status: string }) => {
          if (cancelRef.current) return;
          if (upd.status === "IN_QUEUE") setGenStatus("queued");
          else if (upd.status === "IN_PROGRESS") {
            setGenStatus("generating");
            setGenProgress((p) => Math.min(95, p + 5));
          }
        },
      });

      if (cancelRef.current) return;

      const data = result.data as Record<string, unknown>;
      let vUrl: string | null = null;
      if (data.video && typeof data.video === "object")
        vUrl = (data.video as { url: string }).url;
      else if (typeof data.video_url === "string") vUrl = data.video_url;
      else if (Array.isArray(data.videos) && data.videos.length > 0)
        vUrl = (data.videos[0] as { url: string }).url;

      setVideoUrl(vUrl);
      setGenStatus("completed");
      setGenProgress(100);
    } catch (err) {
      if (cancelRef.current) return;
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setGenStatus("failed");
    }
  }, [model, modelId, cats, audioEnabled, buildPromptFromJson]);

  const cancelGen = () => {
    cancelRef.current = true;
    setGenStatus("idle");
    setGenProgress(0);
  };

  const has = Object.keys(cats).length > 0;
  const count = Object.values(cats).filter((c) => c.enabled).length;
  const isGenerating = genStatus === "queued" || genStatus === "generating" || genStatus === "enhancing";

  return (
    <>
      <TopBar title="JSON Prompt Generator" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your video idea... e.g. 'A samurai drawing a katana at dawn in a bamboo forest with cherry blossoms'"
            rows={4}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/20 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-foreground/20">
              {input.length} chars ·{" "}
              <kbd className="rounded bg-foreground/5 px-1 py-0.5 font-mono text-[9px]">⌘↵</kbd>{" "}
              to submit
            </span>
            <button
              onClick={generate}
              disabled={!input.trim() || loading}
              className="flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-black disabled:opacity-30"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {loading ? "Analyzing..." : "Generate JSON"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {has && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground/40">{count} categories active</p>
                <button
                  onClick={() => setCats({})}
                  className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-foreground/60"
                >
                  <RotateCcw size={10} />
                  Clear
                </button>
              </div>
              {Object.entries(cats).map(([k, c]) => (
                <div
                  key={k}
                  className={`rounded-xl border p-3 transition-all ${
                    c.enabled
                      ? "border-[color:var(--border-soft)] bg-[color:var(--surface)]"
                      : "border-transparent bg-[color:var(--surface-secondary)] opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggle(k)}
                      className={`flex size-5 items-center justify-center rounded-md border text-[10px] ${
                        c.enabled
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                          : "border-[color:var(--border-soft)]"
                      }`}
                    >
                      {c.enabled && <Check size={10} />}
                    </button>
                    <span className="flex-1 font-mono text-xs font-semibold text-[color:var(--accent)]">
                      {k}
                    </span>
                    <button
                      onClick={() => toggleEdit(k)}
                      className="text-foreground/20 hover:text-foreground/60"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                  {c.editing ? (
                    <input
                      value={c.value}
                      onChange={(e) => update(k, e.target.value)}
                      onBlur={() => toggleEdit(k)}
                      autoFocus
                      className="mt-2 w-full rounded-lg border border-[color:var(--accent)]/30 bg-transparent px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1.5 pl-8 text-xs leading-relaxed text-foreground/60">
                      {c.value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Right sidebar: JSON preview + Generation */}
            <div className="sticky top-16 space-y-4 self-start">
              {/* JSON Preview */}
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
                <div className="flex items-center justify-between border-b border-[color:var(--separator)] px-4 py-2.5">
                  <span className="font-mono text-xs font-semibold text-foreground/50">
                    prompt.json
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setRawMode(!rawMode)}
                      className="rounded-md p-1 text-foreground/30 hover:text-foreground"
                    >
                      {rawMode ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      onClick={copy}
                      className="flex items-center gap-1 rounded-md bg-[color:var(--default)] px-2 py-1 text-[10px] font-medium text-foreground/50"
                    >
                      <Copy size={10} />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={dl}
                      className="flex items-center gap-1 rounded-md bg-[color:var(--default)] px-2 py-1 text-[10px] font-medium text-foreground/50"
                    >
                      <Download size={10} />
                      .json
                    </button>
                  </div>
                </div>
                <pre className="max-h-48 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/60">
                  {json()}
                </pre>
              </div>

              {/* Generate Video */}
              <div className="rounded-xl border border-[color:var(--accent)]/15 bg-[color:var(--surface)] p-4">
                <p className="mb-3 text-xs font-semibold text-foreground/40">Generate Video</p>

                <CustomSelect
                  options={MODEL_OPTIONS}
                  value={modelId}
                  onChange={(v) => v && setModelId(v)}
                  placeholder="Select model"
                />

                {model?.capabilities.audio && (
                  <label className="mt-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={(e) => setAudioEnabled(e.target.checked)}
                      className="accent-[color:var(--accent)]"
                    />
                    <Volume2 size={12} className="text-foreground/30" />
                    <span className="text-[10px] text-foreground/40">Generate audio</span>
                  </label>
                )}

                <p className="mt-2 text-[9px] text-foreground/25">
                  JSON categories will be combined into a prompt and enhanced for {model?.name}.
                </p>

                <div className="mt-3">
                  {isGenerating ? (
                    <button
                      onClick={cancelGen}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500/80 py-2 text-[10px] font-semibold text-white"
                    >
                      <Square size={10} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={generateVideo}
                      disabled={count === 0}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[color:var(--accent)] py-2 text-[10px] font-semibold text-black disabled:opacity-30"
                    >
                      <Play size={10} />
                      Generate Video
                    </button>
                  )}
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/5">
                      <div
                        className="h-full rounded-full bg-[color:var(--accent)] transition-all duration-500"
                        style={{ width: `${genProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-center text-[9px] text-foreground/30">
                      {genStatus === "enhancing"
                        ? "Enhancing prompt..."
                        : genStatus === "queued"
                          ? "In queue..."
                          : `Generating... ${genProgress}%`}
                    </p>
                  </div>
                )}

                {genStatus === "failed" && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-500/5 p-2 text-[10px] text-red-400">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>{genError}</span>
                  </div>
                )}

                {videoUrl && (
                  <div className="mt-3">
                    <video src={videoUrl} controls autoPlay className="w-full rounded-lg" />
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-center text-[9px] text-[color:var(--accent)] hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
