"use client";

import { useState, useCallback, useRef } from "react";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";
import { VIDEO_MODELS } from "@/lib/video-models";
import { getFal } from "@/lib/fal-client";
import { CustomSelect } from "./custom-select";
import {
  Loader2, Play, Square, Wand2, Volume2,
  AlertCircle, Image as ImageIcon, RotateCcw, Upload, X,
} from "lucide-react";

const MODEL_OPTIONS = VIDEO_MODELS.map((m) => ({
  id: m.id,
  label: `${m.name} (${m.provider})`,
}));

function ImageUploadField({
  value,
  onChange,
  label = "Input Image",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("File too large (max 100MB)");
        return;
      }
      setUploading(true);
      setError("");
      try {
        const fal = getFal();
        const url = await fal.storage.upload(file);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile],
  );

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-foreground">
        <ImageIcon size={14} /> {label}
      </label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="input"
            className="h-40 max-w-full rounded-xl border border-[color:var(--border-soft)] object-cover"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md hover:bg-foreground"
          >
            <X size={12} />
          </button>
          <p className="mt-1 truncate text-[9px] text-foreground/25 max-w-[300px]">{value}</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5"
              : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--accent)]/40"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-[color:var(--accent)]" />
              <span className="text-xs text-foreground/40">Uploading to fal.ai...</span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-foreground/20" />
              <span className="text-xs text-foreground/40">
                Drop an image here or click to browse
              </span>
              <span className="text-[10px] text-foreground/20">
                JPG, PNG, WebP · Max 100MB
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

export function GeneratePanel() {
  const {
    modelId, mode, params, state, model, promptProfile,
    autoEnhance, setAutoEnhance,
    setModelId, setMode, setParam, setExtra,
    enhancePrompt, generate, cancel, reset,
    canGenerate, isEnhancing, isGenerating,
  } = useVideoGeneration();

  const cap = model?.capabilities;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left: Prompt + Result */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Prompt</label>
          <textarea
            value={params.prompt}
            onChange={(e) => setParam("prompt", e.target.value)}
            placeholder="Describe the video you want to create..."
            rows={6}
            className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-[color:var(--accent)] focus:outline-none"
          />
        </div>

        {/* Auto-enhance */}
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={autoEnhance}
              onChange={(e) => setAutoEnhance(e.target.checked)}
              className="accent-[color:var(--accent)]"
            />
            <span className="text-xs text-foreground/50">Auto-enhance prompt</span>
          </label>
          <button
            onClick={enhancePrompt}
            disabled={!params.prompt.trim() || isEnhancing}
            className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-1.5 text-[11px] font-medium text-foreground/40 hover:text-[color:var(--accent)] disabled:opacity-30"
          >
            {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            Enhance
          </button>
        </div>

        {/* Enhanced prompt preview */}
        {state.enhancedPrompt && (
          <div className="rounded-xl border border-[color:var(--accent)]/15 bg-[color:var(--accent)]/5 p-3">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[color:var(--accent)]">
              Enhanced Prompt
            </p>
            <p className="text-xs leading-relaxed text-foreground/60">{state.enhancedPrompt}</p>
          </div>
        )}

        {/* I2V Image Upload */}
        {mode === "i2v" && (
          <ImageUploadField
            value={params.imageUrl}
            onChange={(url) => setParam("imageUrl", url)}
          />
        )}

        {/* Generate Button */}
        <div className="flex gap-2">
          {isGenerating ? (
            <button
              onClick={cancel}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-3 text-sm font-semibold text-white"
            >
              <Square size={14} /> Cancel
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] py-3 text-sm font-semibold text-black disabled:opacity-30"
            >
              {isEnhancing ? (
                <><Loader2 size={14} className="animate-spin" /> Enhancing...</>
              ) : (
                <><Play size={14} /> Generate Video</>
              )}
            </button>
          )}
          {state.status === "completed" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-xl bg-foreground/5 px-4 py-3 text-sm text-foreground/50 hover:text-foreground"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>

        {/* Progress */}
        {isGenerating && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-foreground/5">
              <div
                className="h-full rounded-full bg-[color:var(--accent)] transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-foreground/30">
              {state.status === "queued"
                ? "In queue..."
                : `Generating... ${state.progress}%`}
            </p>
            {state.logs.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto rounded-lg bg-foreground/5 p-2">
                {state.logs.slice(-5).map((log, i) => (
                  <p key={i} className="font-mono text-[9px] text-foreground/30">{log}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {state.status === "failed" && state.error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/5 p-3 text-sm text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Video Result */}
        {state.result.videoUrl && (
          <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
            <video src={state.result.videoUrl} controls autoPlay className="w-full rounded-lg" />
            {state.result.audioUrl && (
              <audio src={state.result.audioUrl} controls className="mt-2 w-full" />
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-foreground/30">
              <span>Request: {state.result.requestId?.slice(0, 12)}...</span>
              <a
                href={state.result.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--accent)] hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}

        {/* Prompt Tips */}
        {promptProfile && promptProfile.tips.length > 0 && (
          <div className="rounded-xl bg-[color:var(--surface-secondary)] p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-foreground/30">
              Tips for {model?.name}
            </p>
            <ul className="space-y-0.5">
              {promptProfile.tips.map((tip, i) => (
                <li key={i} className="text-[10px] text-foreground/25">• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="space-y-5">
        {/* Model */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Model</label>
          <CustomSelect
            options={MODEL_OPTIONS}
            value={modelId}
            onChange={(v) => v && setModelId(v)}
            placeholder="Select model"
          />
          {model && (
            <p className="mt-1.5 text-[10px] text-foreground/25">{model.description}</p>
          )}
        </div>

        {/* Mode */}
        {model && model.modes.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Mode</label>
            <div className="flex gap-2">
              {model.modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-colors ${
                    m === mode
                      ? "bg-foreground text-background"
                      : "bg-[color:var(--default)] text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {m === "t2v" ? "Text → Video" : "Image → Video"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration */}
        {cap && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Duration</label>
            <div className="flex flex-wrap gap-1.5">
              {cap.duration.values.map((d) => (
                <button
                  key={String(d)}
                  onClick={() => setParam("duration", d)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    String(params.duration) === String(d)
                      ? "bg-foreground text-background"
                      : "bg-[color:var(--default)] text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {d}{typeof d === "number" ? "s" : d === "auto" ? "" : "s"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aspect Ratio */}
        {cap && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Aspect Ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {cap.aspectRatio.values.map((r) => (
                <button
                  key={r}
                  onClick={() => setParam("aspectRatio", r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    params.aspectRatio === r
                      ? "bg-foreground text-background"
                      : "bg-[color:var(--default)] text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resolution */}
        {cap && cap.resolution.values.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Resolution</label>
            <div className="flex flex-wrap gap-1.5">
              {cap.resolution.values.map((r) => (
                <button
                  key={r}
                  onClick={() => setParam("resolution", r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    params.resolution === r
                      ? "bg-foreground text-background"
                      : "bg-[color:var(--default)] text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio */}
        {cap?.audio && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={params.audioEnabled}
              onChange={(e) => setParam("audioEnabled", e.target.checked)}
              className="accent-[color:var(--accent)]"
            />
            <Volume2 size={14} className="text-foreground/40" />
            <span className="text-sm text-foreground/60">Generate audio</span>
          </label>
        )}

        {/* Negative Prompt */}
        {cap?.negativePrompt && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/50">
              Negative Prompt
            </label>
            <input
              value={params.negativePrompt}
              onChange={(e) => setParam("negativePrompt", e.target.value)}
              placeholder="blur, distort, low quality..."
              className="w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 py-2 text-xs text-foreground placeholder:text-foreground/20 focus:outline-none"
            />
          </div>
        )}

        {/* Seed */}
        {cap?.seed && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/50">
              Seed <span className="font-normal text-foreground/25">(optional)</span>
            </label>
            <input
              type="number"
              value={params.seed ?? ""}
              onChange={(e) =>
                setParam("seed", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="Random"
              className="w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 py-2 text-xs text-foreground placeholder:text-foreground/20 focus:outline-none"
            />
          </div>
        )}

        {/* End Image */}
        {cap?.endImage && (
          <ImageUploadField
            value={params.endImageUrl}
            onChange={(url) => setParam("endImageUrl", url)}
            label="End Image (optional)"
          />
        )}

        {/* Extra Params */}
        {cap?.extras.map((extra) => (
          <div key={extra.key}>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/50">
              {extra.label}
              {extra.description && (
                <span className="ml-1 font-normal text-foreground/25">— {extra.description}</span>
              )}
            </label>
            {extra.type === "enum" && extra.values ? (
              <div className="flex flex-wrap gap-1.5">
                {extra.values.map((v) => (
                  <button
                    key={v}
                    onClick={() => setExtra(extra.key, v)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      String(params.extras[extra.key] ?? extra.default) === v
                        ? "bg-foreground text-background"
                        : "bg-[color:var(--default)] text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {v || "none"}
                  </button>
                ))}
              </div>
            ) : extra.type === "boolean" ? (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!params.extras[extra.key]}
                  onChange={(e) => setExtra(extra.key, e.target.checked)}
                  className="accent-[color:var(--accent)]"
                />
                <span className="text-xs text-foreground/50">{extra.label}</span>
              </label>
            ) : (
              <input
                type={extra.type === "number" ? "number" : "text"}
                value={String(params.extras[extra.key] ?? extra.default ?? "")}
                onChange={(e) =>
                  setExtra(
                    extra.key,
                    extra.type === "number" ? Number(e.target.value) : e.target.value,
                  )
                }
                className="w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 py-2 text-xs text-foreground focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
