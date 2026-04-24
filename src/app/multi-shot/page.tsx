"use client";

import { useState, useCallback, useRef } from "react";
import { TopBar } from "@/components/topbar";
import { FalKeyGuard } from "@/components/fal-key-guard";
import { getFal, runLLM } from "@/lib/fal-client";
import { VIDEO_MODELS, getModel, getEndpoint } from "@/lib/video-models";
import { useSubmitShortcut } from "@/lib/use-submit-shortcut";
import { CustomSelect } from "@/components/custom-select";
import {
  Wand2, Loader2, Copy, Trash2, Plus, Clock, Image as ImageIcon,
  ChevronDown, ChevronUp, Play, Volume2, AlertCircle, Square,
} from "lucide-react";

interface Shot {
  id: string;
  shotNumber: number;
  duration: string;
  prompt: string;
  referencePrompt: string;
  referenceImageUrl: string | null;
  expanded: boolean;
}

type GenStatus = "idle" | "queued" | "generating" | "completed" | "failed";

const MODEL_OPTIONS = VIDEO_MODELS.filter((m) => m.modes.includes("t2v")).map((m) => ({
  id: m.id,
  label: `${m.name} (${m.provider})`,
}));

const SPLIT_PROMPT = `You are a video director. Given a story concept, break it into 3-8 cinematic shots. For each shot, provide:
- duration (3s-10s)
- detailed video prompt (2-3 sentences, cinematic language)
- reference_image_prompt (1 sentence, what a still frame from this shot would look like)

Return ONLY valid JSON array like:
[{"shot":1,"duration":"5s","prompt":"...","reference_prompt":"..."},...]

Story concept:
`;

export default function MultiShotPage() {
  const [storyInput, setStoryInput] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);

  const [modelId, setModelId] = useState("kling-v3");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [genProgress, setGenProgress] = useState(0);
  const [genError, setGenError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refLoading, setRefLoading] = useState<Record<string, boolean>>({});

  const model = getModel(modelId);

  const generateShots = useCallback(async () => {
    if (!storyInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const raw = await runLLM(SPLIT_PROMPT + storyInput.trim());
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array in response");
      const parsed = JSON.parse(match[0]) as {
        shot: number; duration: string; prompt: string; reference_prompt: string;
      }[];
      setShots(
        parsed.map((s, i) => ({
          id: `shot-${Date.now()}-${i}`,
          shotNumber: s.shot || i + 1,
          duration: s.duration || "5s",
          prompt: s.prompt || "",
          referencePrompt: s.reference_prompt || "",
          referenceImageUrl: null,
          expanded: true,
        })),
      );
      setVideoUrl(null);
      setGenStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to split story");
    } finally {
      setLoading(false);
    }
  }, [storyInput]);

  useSubmitShortcut(textareaRef, generateShots, !loading);

  const updateShot = (id: string, u: Partial<Shot>) =>
    setShots((p) => p.map((s) => (s.id === id ? { ...s, ...u } : s)));
  const removeShot = (id: string) => setShots((p) => p.filter((s) => s.id !== id));
  const addShot = () =>
    setShots((p) => [
      ...p,
      {
        id: `shot-${Date.now()}`,
        shotNumber: p.length + 1,
        duration: "5s",
        prompt: "",
        referencePrompt: "",
        referenceImageUrl: null,
        expanded: true,
      },
    ]);

  const generateRefImage = useCallback(
    async (shotId: string) => {
      const shot = shots.find((s) => s.id === shotId);
      if (!shot?.referencePrompt.trim()) return;
      setRefLoading((p) => ({ ...p, [shotId]: true }));
      try {
        const fal = getFal();
        const result = await fal.subscribe("fal-ai/nano-banana-pro" as string, {
          input: { prompt: shot.referencePrompt, num_images: 1, image_size: "landscape_4_3" } as Record<string, unknown>,
        });
        const data = result.data as Record<string, unknown>;
        const images = data?.images as { url: string }[] | undefined;
        if (images?.[0]?.url) updateShot(shotId, { referenceImageUrl: images[0].url });
      } catch (e) {
        console.error("Ref image failed:", e);
      }
      setRefLoading((p) => ({ ...p, [shotId]: false }));
    },
    [shots],
  );

  const buildCombinedPrompt = useCallback(() => {
    if (modelId === "seedance-2.0") {
      return shots.map((s) => `[${s.duration}] ${s.prompt}`).join(" → ");
    }
    return shots.map((s, i) => `Shot ${i + 1} (${s.duration}): ${s.prompt}`).join("\n\n");
  }, [shots, modelId]);

  const totalDuration = shots.reduce((sum, s) => {
    const n = parseInt(s.duration.replace("s", ""));
    return sum + (isNaN(n) ? 5 : n);
  }, 0);

  const generateVideo = useCallback(async () => {
    if (!model || shots.length === 0) return;
    cancelRef.current = false;
    setGenStatus("queued");
    setGenProgress(0);
    setGenError("");
    setVideoUrl(null);
    setAudioUrl(null);

    try {
      const fal = getFal();
      let input: Record<string, unknown>;
      let endpoint: string;

      if (modelId === "kling-v3") {
        endpoint = "fal-ai/kling-video/v3/pro/text-to-video";
        input = {
          multi_prompt: shots.map((s) => ({
            prompt: s.prompt,
            duration: s.duration.replace("s", ""),
          })),
          aspect_ratio: aspectRatio,
          generate_audio: audioEnabled,
          negative_prompt: "blur, distort, and low quality",
          cfg_scale: 0.5,
        };
      } else {
        endpoint = getEndpoint(model, "t2v") || "";
        if (!endpoint) throw new Error("No endpoint for this model");
        const combinedPrompt = buildCombinedPrompt();
        const extras: Record<string, string | number | boolean> = {};
        model.capabilities.extras.forEach((e) => {
          if (e.default !== undefined) extras[e.key] = e.default;
        });
        input = model.buildInput(
          {
            prompt: combinedPrompt,
            duration: model.capabilities.duration.default,
            aspectRatio,
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
      }

      if (cancelRef.current) return;

      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update: { status: string }) => {
          if (cancelRef.current) return;
          if (update.status === "IN_QUEUE") setGenStatus("queued");
          else if (update.status === "IN_PROGRESS") {
            setGenStatus("generating");
            setGenProgress((p) => Math.min(95, p + 5));
          }
        },
      });

      if (cancelRef.current) return;

      const data = result.data as Record<string, unknown>;
      let vUrl: string | null = null;
      let aUrl: string | null = null;
      if (data.video && typeof data.video === "object")
        vUrl = (data.video as { url: string }).url;
      else if (typeof data.video_url === "string") vUrl = data.video_url;
      else if (Array.isArray(data.videos) && data.videos.length > 0)
        vUrl = (data.videos[0] as { url: string }).url;
      if (data.audio && typeof data.audio === "object")
        aUrl = (data.audio as { url: string }).url;

      setVideoUrl(vUrl);
      setAudioUrl(aUrl);
      setGenStatus("completed");
      setGenProgress(100);
    } catch (err) {
      if (cancelRef.current) return;
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setGenStatus("failed");
    }
  }, [model, modelId, shots, aspectRatio, audioEnabled, buildCombinedPrompt]);

  const cancelGeneration = () => {
    cancelRef.current = true;
    setGenStatus("idle");
    setGenProgress(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCombinedPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isGenerating = genStatus === "queued" || genStatus === "generating";
  const aspectOptions = model?.capabilities.aspectRatio.values || ["16:9", "9:16", "1:1"];

  return (
    <>
      <TopBar title="Multi-Shot Generator" />
      <FalKeyGuard toolName="Multi-Shot Generator">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Story Input */}
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
          <textarea
            ref={textareaRef}
            value={storyInput}
            onChange={(e) => setStoryInput(e.target.value)}
            placeholder="Describe your video story... e.g. 'A lone astronaut discovers an ancient alien temple on Mars. She enters cautiously, finding glowing symbols on the walls. The symbols activate and reveal a holographic star map.'"
            rows={4}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/20 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-foreground/20">
              AI will split this into shots ·{" "}
              <kbd className="rounded bg-foreground/5 px-1 py-0.5 font-mono text-[9px]">⌘↵</kbd>
            </span>
            <button
              onClick={generateShots}
              disabled={!storyInput.trim() || loading}
              className="flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-black disabled:opacity-30"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {loading ? "Splitting into shots..." : "Generate Shots"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {/* Shots + Generation Panel */}
        {shots.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Shots List */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground/40">
                {shots.length} shots · {totalDuration}s total
              </p>
              {shots.map((shot, idx) => (
                <div
                  key={shot.id}
                  className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]"
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-[color:var(--accent)]/10 text-[10px] font-bold text-[color:var(--accent)]">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-foreground/25" />
                      <input
                        value={shot.duration}
                        onChange={(e) => updateShot(shot.id, { duration: e.target.value })}
                        className="w-12 bg-transparent text-xs font-mono text-foreground/60 focus:outline-none focus:text-[color:var(--accent)]"
                      />
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={() => updateShot(shot.id, { expanded: !shot.expanded })}
                      className="text-foreground/20"
                    >
                      {shot.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {shots.length > 1 && (
                      <button
                        onClick={() => removeShot(shot.id)}
                        className="text-foreground/20 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {shot.expanded && (
                    <div className="space-y-3 border-t border-[color:var(--separator)] px-3 py-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                          Video Prompt
                        </label>
                        <textarea
                          value={shot.prompt}
                          onChange={(e) => updateShot(shot.id, { prompt: e.target.value })}
                          rows={3}
                          className="mt-1 w-full resize-none bg-transparent text-xs text-foreground/70 placeholder:text-foreground/15 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                          <ImageIcon size={9} />
                          Reference Image
                        </label>
                        <div className="mt-1 flex gap-2">
                          <textarea
                            value={shot.referencePrompt}
                            onChange={(e) =>
                              updateShot(shot.id, { referencePrompt: e.target.value })
                            }
                            rows={2}
                            className="flex-1 resize-none bg-transparent text-xs text-foreground/50 placeholder:text-foreground/15 focus:outline-none"
                            placeholder="Describe the reference still frame..."
                          />
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              onClick={() => generateRefImage(shot.id)}
                              disabled={!shot.referencePrompt.trim() || refLoading[shot.id]}
                              className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1.5 text-[9px] font-medium text-foreground/40 hover:text-[color:var(--accent)] disabled:opacity-30"
                            >
                              {refLoading[shot.id] ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <ImageIcon size={10} />
                              )}
                              Gen Ref
                            </button>
                            {shot.referenceImageUrl && (
                              <img
                                src={shot.referenceImageUrl}
                                alt="ref"
                                className="h-16 w-24 rounded-lg object-cover"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addShot}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[color:var(--border-soft)] py-2.5 text-xs text-foreground/25 hover:border-[color:var(--accent)]/30 hover:text-[color:var(--accent)]"
              >
                <Plus size={14} />
                Add Shot
              </button>
            </div>

            {/* Generation Sidebar */}
            <div className="sticky top-16 space-y-4 self-start">
              <div className="rounded-xl border border-[color:var(--accent)]/15 bg-[color:var(--surface)] p-4">
                <p className="mb-3 text-xs font-semibold text-foreground/40">Generate Video</p>

                <CustomSelect
                  options={MODEL_OPTIONS}
                  value={modelId}
                  onChange={(v) => {
                    if (v) {
                      setModelId(v);
                      const m = getModel(v);
                      if (m) setAspectRatio(m.capabilities.aspectRatio.default);
                    }
                  }}
                  placeholder="Select model"
                />

                {/* Aspect Ratio */}
                <div className="mt-3">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-foreground/25">
                    Aspect Ratio
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {aspectOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          aspectRatio === r
                            ? "bg-foreground/10 text-foreground/70"
                            : "text-foreground/20 hover:text-foreground/40"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio */}
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

                {/* Kling v3 multi_prompt info */}
                {modelId === "kling-v3" && (
                  <div className="mt-3 rounded-lg bg-[color:var(--accent)]/5 p-2 text-[9px] text-foreground/40">
                    <strong className="text-[color:var(--accent)]">Kling v3 Multi-Shot</strong>
                    <p className="mt-0.5">
                      Each shot sent as multi_prompt element. Min 3s/shot, max 15s total.
                    </p>
                    {totalDuration > 15 && (
                      <p className="mt-1 text-red-400">
                        ⚠ Total {totalDuration}s exceeds 15s limit
                      </p>
                    )}
                  </div>
                )}

                {/* Duration */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-foreground/30">
                  <span>{shots.length} shots</span>
                  <span className="font-mono">{totalDuration}s total</span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[color:var(--default)] py-2 text-[10px] font-medium text-foreground/50"
                  >
                    <Copy size={10} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {isGenerating ? (
                    <button
                      onClick={cancelGeneration}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-500/80 py-2 text-[10px] font-semibold text-white"
                    >
                      <Square size={10} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={generateVideo}
                      disabled={
                        shots.some((s) => !s.prompt.trim()) ||
                        (modelId === "kling-v3" && totalDuration > 15)
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[color:var(--accent)] py-2 text-[10px] font-semibold text-black disabled:opacity-30"
                    >
                      <Play size={10} />
                      Generate
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
                      {genStatus === "queued" ? "In queue..." : `Generating... ${genProgress}%`}
                    </p>
                  </div>
                )}

                {/* Error */}
                {genStatus === "failed" && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-500/5 p-2 text-[10px] text-red-400">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>{genError}</span>
                  </div>
                )}

                {/* Video Result */}
                {videoUrl && (
                  <div className="mt-3">
                    <video src={videoUrl} controls autoPlay className="w-full rounded-lg" />
                    {audioUrl && <audio src={audioUrl} controls className="mt-2 w-full" />}
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

              {/* Info */}
              <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3 space-y-1 text-[10px] text-foreground/25">
                <p className="font-semibold text-foreground/40">How it works</p>
                <p>
                  <strong>Kling v3:</strong> Native multi_prompt — each shot as separate element
                </p>
                <p>
                  <strong>Seedance 2.0:</strong> All shots combined with timing markers
                </p>
                <p>
                  <strong>Others:</strong> Shots combined into single descriptive prompt
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      </FalKeyGuard>
    </>
  );
}
