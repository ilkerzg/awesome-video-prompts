"use client";

import { useState, useCallback, useRef } from "react";
import { TopBar } from "@/components/topbar";
import { FalKeyGuard } from "@/components/fal-key-guard";
import { getFal, runLLM } from "@/lib/fal-client";
import { VIDEO_MODELS, getModel, getEndpoint } from "@/lib/video-models";
import { getPromptProfile } from "@/lib/prompt-profiles";
import { useSubmitShortcut } from "@/lib/use-submit-shortcut";
import { CustomSelect } from "@/components/custom-select";
import {
  Wand2, Loader2, Copy, Play, Square, Volume2, AlertCircle,
  Upload, X, Image as ImageIcon, RotateCcw, Sparkles, ArrowRight,
} from "lucide-react";

// ─── Model options ──────────────────────────────────────────
const MODEL_OPTIONS = VIDEO_MODELS.map((m) => ({
  id: m.id,
  label: `${m.name} (${m.provider})`,
}));

// ─── Agent system prompt builder ────────────────────────────
function buildAgentPrompt(modelId: string, hasImage: boolean): string {
  const profile = getPromptProfile(modelId);
  const model = getModel(modelId);
  const modelName = model?.name ?? modelId;

  const imageContext = hasImage
    ? `\n\nThe user has also provided a reference image that will be used as the starting frame for image-to-video generation. Your prompt should describe how the video evolves FROM that image — what moves, what changes, what the camera does. Do NOT describe the image itself in excessive detail since the model already sees it; focus on the ACTION and MOTION that should happen.`
    : "";

  if (profile) {
    return `${profile.systemPrompt}

ADDITIONAL RULES:
- The user will give you a SHORT idea or instruction. Your job is to expand it into a FULL, DETAILED, production-ready video prompt.
- Always be highly descriptive and cinematic unless the user explicitly asks for simplicity.
- Include: subject details, environment, lighting, camera work, motion description, mood, color palette, audio cues (if the model supports audio).
- Output ONLY the final prompt text. No explanations, no markdown, no quotes, no labels.
- Write in English.${imageContext}

User's idea:
`;
  }

  return `You are an expert video prompt engineer. Write a detailed, cinematic video generation prompt for ${modelName}.

RULES:
- The user gives a SHORT idea. Expand it into a FULL, DETAILED, production-ready prompt.
- Include: subject, action, environment, lighting (type, direction, color temperature), camera shot & movement, motion description, mood, color palette, texture details.
- Be vivid and specific. "A woman walks" → "A young woman in a flowing ivory dress walks barefoot along a misty forest path, morning sunlight filtering through tall pine trees, camera slowly tracks alongside her at waist height, shallow depth of field, warm golden tones, soft ambient birdsong"
- Output ONLY the prompt text. No markdown, no quotes, no explanations.
- Write in English.${imageContext}

User's idea:
`;
}

// ─── Types ──────────────────────────────────────────────────
type GenStatus = "idle" | "queued" | "generating" | "completed" | "failed";

export default function PromptGenPage() {
  // Input state
  const [idea, setIdea] = useState("");
  const [modelId, setModelId] = useState("seedance-2.0");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Agent state
  const [agentLoading, setAgentLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [agentError, setAgentError] = useState("");

  // Video gen state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [genProgress, setGenProgress] = useState(0);
  const [genError, setGenError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioResultUrl, setAudioResultUrl] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  const model = getModel(modelId);
  const profile = getPromptProfile(modelId);

  // ─── Image upload ───────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Only images"); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError("Max 100MB"); return; }
    setUploading(true);
    setUploadError("");
    try {
      const fal = getFal();
      const url = await fal.storage.upload(file);
      setImageUrl(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  // ─── Generate prompt via agent ──────────────────────────
  const generatePrompt = useCallback(async () => {
    if (!idea.trim()) return;
    setAgentLoading(true);
    setAgentError("");
    setGeneratedPrompt("");
    setVideoUrl(null);
    try {
      const system = buildAgentPrompt(modelId, !!imageUrl);
      const raw = await runLLM(system + idea.trim(), "anthropic/claude-sonnet-4");
      const cleaned = raw
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/^#+\s*/gm, "")
        .replace(/^\*\*.*?\*\*\s*/gm, "")
        .trim();
      const maxLen = profile?.maxLength ?? 2000;
      setGeneratedPrompt(cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned);
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : "Agent failed");
    } finally {
      setAgentLoading(false);
    }
  }, [idea, modelId, imageUrl, profile]);

  useSubmitShortcut(textareaRef, generatePrompt, !agentLoading);

  // ─── Generate video ─────────────────────────────────────
  const generateVideo = useCallback(async () => {
    if (!model || !generatedPrompt.trim()) return;
    cancelRef.current = false;
    setGenStatus("queued");
    setGenProgress(0);
    setGenError("");
    setVideoUrl(null);
    setAudioResultUrl(null);

    try {
      const fal = getFal();
      const mode = imageUrl ? "i2v" : "t2v";
      const endpoint = getEndpoint(model, mode);
      if (!endpoint) throw new Error("No endpoint for this model + mode");

      const extras: Record<string, string | number | boolean> = {};
      model.capabilities.extras.forEach((e) => {
        if (e.default !== undefined) extras[e.key] = e.default;
      });

      const input = model.buildInput(
        {
          prompt: generatedPrompt,
          duration: model.capabilities.duration.default,
          aspectRatio: model.capabilities.aspectRatio.default,
          resolution: model.capabilities.resolution.default,
          audioEnabled: audioEnabled && model.capabilities.audio,
          negativePrompt: model.capabilities.negativePrompt ? "blur, distort, low quality" : "",
          seed: null,
          imageUrl,
          endImageUrl: null,
          extras,
        },
        mode,
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
      let aUrl: string | null = null;
      if (data.video && typeof data.video === "object") vUrl = (data.video as { url: string }).url;
      else if (typeof data.video_url === "string") vUrl = data.video_url;
      else if (Array.isArray(data.videos) && data.videos.length > 0) vUrl = (data.videos[0] as { url: string }).url;
      if (data.audio && typeof data.audio === "object") aUrl = (data.audio as { url: string }).url;

      setVideoUrl(vUrl);
      setAudioResultUrl(aUrl);
      setGenStatus("completed");
      setGenProgress(100);
    } catch (err) {
      if (cancelRef.current) return;
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setGenStatus("failed");
    }
  }, [model, generatedPrompt, imageUrl, audioEnabled]);

  const cancelGen = () => { cancelRef.current = true; setGenStatus("idle"); setGenProgress(0); };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isGenerating = genStatus === "queued" || genStatus === "generating";

  return (
    <>
      <TopBar title="Prompt Generator" />
      <FalKeyGuard toolName="Prompt Generator">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* Step 1: Model + Input */}
        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          {/* Left: idea + image */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
              <textarea
                ref={textareaRef}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe what you want — the agent will write a detailed prompt for you.

e.g. 'cinematic drone shot of a neon-lit Tokyo street at night in the rain'
e.g. 'make this photo come alive, slow zoom into her eyes' (with image)
e.g. 'epic space battle with two fleets clashing near a gas giant'"
                rows={5}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-foreground/20 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-foreground/20">
                  <kbd className="rounded bg-foreground/5 px-1 py-0.5 font-mono text-[9px]">⌘↵</kbd> to generate prompt
                </span>
                <button
                  onClick={generatePrompt}
                  disabled={!idea.trim() || agentLoading}
                  className="flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-black disabled:opacity-30"
                >
                  {agentLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {agentLoading ? "Writing prompt..." : "Generate Prompt"}
                </button>
              </div>
            </div>

            {/* Reference Image (optional) */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/50">
                <ImageIcon size={12} />
                Reference Image
                <span className="font-normal text-foreground/25">(optional — for I2V)</span>
              </p>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="ref"
                    className="h-36 max-w-full rounded-xl border border-[color:var(--border-soft)] object-cover"
                  />
                  <button
                    onClick={() => setImageUrl(null)}
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md hover:bg-foreground"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 transition-colors ${
                    dragOver
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5"
                      : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--accent)]/40"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[color:var(--accent)]" />
                      <span className="text-xs text-foreground/40">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="text-foreground/20" />
                      <span className="text-xs text-foreground/40">Drop image or click to browse</span>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              )}
              {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
            </div>
          </div>

          {/* Right: model + settings */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground/50">Target Model</label>
              <CustomSelect
                options={MODEL_OPTIONS}
                value={modelId}
                onChange={(v) => v && setModelId(v)}
                placeholder="Select model"
              />
              {model && (
                <p className="mt-1 text-[9px] text-foreground/20">{model.description}</p>
              )}
            </div>

            {model?.capabilities.audio && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  className="accent-[color:var(--accent)]"
                />
                <Volume2 size={12} className="text-foreground/30" />
                <span className="text-[10px] text-foreground/40">Audio</span>
              </label>
            )}

            {imageUrl && (
              <div className="rounded-lg bg-[color:var(--accent)]/5 p-2 text-[9px] text-foreground/40">
                <strong className="text-[color:var(--accent)]">I2V Mode</strong>
                <p className="mt-0.5">Image will be used as starting frame. Agent will focus on motion & camera.</p>
              </div>
            )}

            {profile && (
              <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-foreground/25">
                  {model?.name} Tips
                </p>
                <ul className="space-y-0.5">
                  {profile.tips.slice(0, 3).map((t, i) => (
                    <li key={i} className="text-[9px] text-foreground/20">• {t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {agentError && <p className="mt-3 text-sm text-red-400">{agentError}</p>}

        {/* Step 2: Generated Prompt */}
        {generatedPrompt && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[color:var(--accent)]" />
              <p className="text-xs font-semibold text-foreground/50">Generated Prompt</p>
              <div className="flex-1" />
              <button
                onClick={generatePrompt}
                disabled={agentLoading}
                className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-[color:var(--accent)]"
              >
                <RotateCcw size={10} />
                Regenerate
              </button>
            </div>

            <div className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--surface)]">
              <textarea
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={8}
                className="w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-foreground focus:outline-none"
              />
              <div className="flex items-center gap-2 border-t border-[color:var(--separator)] px-4 py-2.5">
                <span className="text-[9px] text-foreground/20">
                  {generatedPrompt.length} chars
                  {profile ? ` / ${profile.maxLength} max` : ""}
                </span>
                <div className="flex-1" />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg bg-[color:var(--default)] px-3 py-1.5 text-[10px] font-medium text-foreground/50 hover:text-foreground"
                >
                  <Copy size={10} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                {isGenerating ? (
                  <button
                    onClick={cancelGen}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-4 py-1.5 text-[10px] font-semibold text-white"
                  >
                    <Square size={10} />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={generateVideo}
                    className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-1.5 text-[10px] font-semibold text-black"
                  >
                    <Play size={10} />
                    Generate Video
                    <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div>
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

            {genStatus === "failed" && (
              <div className="flex items-start gap-1.5 rounded-lg bg-red-500/5 p-2.5 text-[11px] text-red-400">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {/* Video Result */}
            {videoUrl && (
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
                <video src={videoUrl} controls autoPlay className="w-full rounded-lg" />
                {audioResultUrl && <audio src={audioResultUrl} controls className="mt-2 w-full" />}
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 block text-center text-[9px] text-[color:var(--accent)] hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      </FalKeyGuard>
    </>
  );
}
