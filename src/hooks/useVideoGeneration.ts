"use client";

import { useState, useCallback, useRef } from "react";
import { getFal, runLLM } from "@/lib/fal-client";
import {
  VIDEO_MODELS,
  getModel,
  getEndpoint,
  getDefaultParams,
  type VideoModel,
  type GenerationMode,
  type GenerationParams,
} from "@/lib/video-models";
import { buildEnhancePrompt, getPromptProfile, type PromptProfile } from "@/lib/prompt-profiles";
import { addHistoryItem } from "@/lib/history-store";

export type GenerationStatus = "idle" | "enhancing" | "queued" | "generating" | "completed" | "failed";

export interface GenerationResult {
  videoUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  requestId: string | null;
}

export interface GenerationState {
  status: GenerationStatus;
  progress: number;
  result: GenerationResult;
  error: string | null;
  logs: string[];
  originalPrompt: string | null;
  enhancedPrompt: string | null;
}

export interface UseVideoGenerationReturn {
  modelId: string;
  mode: GenerationMode;
  params: GenerationParams;
  state: GenerationState;
  model: VideoModel | undefined;
  promptProfile: PromptProfile | undefined;
  autoEnhance: boolean;
  setAutoEnhance: (v: boolean) => void;
  setModelId: (id: string) => void;
  setMode: (mode: GenerationMode) => void;
  setParam: <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => void;
  setExtra: (key: string, value: string | number | boolean) => void;
  enhancePrompt: () => Promise<string | null>;
  generate: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  models: typeof VIDEO_MODELS;
  canGenerate: boolean;
  isEnhancing: boolean;
  isGenerating: boolean;
}

const initialState: GenerationState = {
  status: "idle",
  progress: 0,
  result: { videoUrl: null, audioUrl: null, duration: null, requestId: null },
  error: null,
  logs: [],
  originalPrompt: null,
  enhancedPrompt: null,
};

export function useVideoGeneration(defaultModelId?: string): UseVideoGenerationReturn {
  // Pull user preferences from localStorage at mount
  const resolvedDefaultModelId = (() => {
    if (defaultModelId) return defaultModelId;
    if (typeof window === "undefined") return "seedance-2.0";
    try {
      const raw = localStorage.getItem("app_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.defaultModel && getModel(parsed.defaultModel)) return parsed.defaultModel;
      }
    } catch { /* */ }
    return "seedance-2.0";
  })();

  const [modelId, setModelIdRaw] = useState(resolvedDefaultModelId);
  const [mode, setMode] = useState<GenerationMode>("t2v");
  const [params, setParams] = useState<GenerationParams>(() => {
    const m = getModel(resolvedDefaultModelId);
    const base = m ? getDefaultParams(m) : getDefaultParams(VIDEO_MODELS[0]);
    // Overlay user preferences if they exist and the model supports them
    if (typeof window !== "undefined" && m) {
      try {
        const raw = localStorage.getItem("app_settings");
        if (raw) {
          const prefs = JSON.parse(raw);
          const ar = m.capabilities?.aspectRatio?.values;
          const dv = m.capabilities?.duration?.values;
          const rv = m.capabilities?.resolution?.values;
          if (prefs.defaultAspectRatio && ar?.includes(prefs.defaultAspectRatio)) {
            base.aspectRatio = prefs.defaultAspectRatio;
          }
          if (prefs.defaultDuration && dv?.includes(prefs.defaultDuration)) {
            base.duration = prefs.defaultDuration;
          }
          if (prefs.defaultResolution && rv?.includes(prefs.defaultResolution)) {
            base.resolution = prefs.defaultResolution;
          }
        }
      } catch { /* */ }
    }
    return base;
  });
  const [state, setState] = useState<GenerationState>(initialState);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const cancelRef = useRef(false);

  const model = getModel(modelId);
  const promptProfile = model ? getPromptProfile(model.id) : undefined;

  const setModelId = useCallback((id: string) => {
    setModelIdRaw(id);
    const m = getModel(id);
    if (m) {
      setParams((prev) => ({ ...getDefaultParams(m), prompt: prev.prompt, imageUrl: prev.imageUrl, endImageUrl: prev.endImageUrl }));
      if (!m.modes.includes(mode)) setMode(m.modes[0]);
    }
    setState((s) => ({ ...s, enhancedPrompt: null, originalPrompt: null }));
  }, [mode]);

  const setParam = useCallback(<K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (key === "prompt") setState((s) => ({ ...s, enhancedPrompt: null, originalPrompt: null }));
  }, []);

  const setExtra = useCallback((key: string, value: string | number | boolean) => {
    setParams((prev) => ({ ...prev, extras: { ...prev.extras, [key]: value } }));
  }, []);

  // ── Standalone enhance (user clicks "Enhance" button) ──
  const enhancePrompt = useCallback(async (): Promise<string | null> => {
    if (!model || !params.prompt.trim()) return null;
    setState((s) => ({ ...s, status: "enhancing", error: null, originalPrompt: params.prompt, enhancedPrompt: null }));
    try {
      const full = buildEnhancePrompt(params.prompt, model.id);
      const raw = await runLLM(full, "anthropic/claude-sonnet-4");
      const cleaned = raw.replace(/^["'`]+|["'`]+$/g, "").replace(/^#+\s*/gm, "").replace(/^\*\*.*?\*\*\s*/gm, "").trim();
      const maxLen = promptProfile?.maxLength ?? 2000;
      const result = cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
      setState((s) => ({ ...s, status: "idle", enhancedPrompt: result }));
      return result;
    } catch (err) {
      setState((s) => ({ ...s, status: "idle", error: `Enhancement failed: ${err instanceof Error ? err.message : "Unknown"}` }));
      return null;
    }
  }, [model, params.prompt, promptProfile]);

  // ── Generate (with optional auto-enhance) ──
  const generate = useCallback(async () => {
    if (!model) return;
    const endpoint = getEndpoint(model, mode);
    if (!endpoint || !params.prompt.trim()) return;
    if (mode === "i2v" && !params.imageUrl) return;

    cancelRef.current = false;
    let finalPrompt = params.prompt;

    // Auto-enhance if enabled and not already enhanced
    if (autoEnhance && !state.enhancedPrompt) {
      setState({ ...initialState, status: "enhancing", originalPrompt: params.prompt });
      try {
        const full = buildEnhancePrompt(params.prompt, model.id);
        const raw = await runLLM(full, "anthropic/claude-sonnet-4");
        const cleaned = raw.replace(/^["'`]+|["'`]+$/g, "").replace(/^#+\s*/gm, "").trim();
        const maxLen = promptProfile?.maxLength ?? 2000;
        finalPrompt = cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
        if (cancelRef.current) return;
        setState((s) => ({ ...s, enhancedPrompt: finalPrompt }));
      } catch {
        finalPrompt = params.prompt; // fallback to original
      }
    } else if (state.enhancedPrompt) {
      finalPrompt = state.enhancedPrompt;
    }

    if (cancelRef.current) return;

    // Generate
    setState((s) => ({ ...s, status: "queued", progress: 0, result: initialState.result, error: null, logs: [] }));

    try {
      const fal = getFal();
      const input = model.buildInput({ ...params, prompt: finalPrompt }, mode);

      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update: { status: string; logs?: { message: string }[] }) => {
          if (cancelRef.current) return;
          if (update.status === "IN_QUEUE") setState((s) => ({ ...s, status: "queued" }));
          else if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs?.map((l) => l.message) ?? [];
            setState((s) => ({ ...s, status: "generating", progress: Math.min(95, s.progress + 5), logs: [...s.logs, ...newLogs] }));
          }
        },
      });

      if (cancelRef.current) return;

      const data = result.data as Record<string, unknown>;
      let videoUrl: string | null = null;
      let audioUrl: string | null = null;
      if (data.video && typeof data.video === "object") videoUrl = (data.video as { url: string }).url;
      else if (typeof data.video_url === "string") videoUrl = data.video_url;
      else if (Array.isArray(data.videos) && data.videos.length > 0) videoUrl = (data.videos[0] as { url: string }).url;
      if (data.audio && typeof data.audio === "object") audioUrl = (data.audio as { url: string }).url;

      setState((s) => ({ ...s, status: "completed", progress: 100, result: { videoUrl, audioUrl, duration: null, requestId: result.requestId ?? null } }));

      // Persist to history
      if (videoUrl || audioUrl) {
        try {
          addHistoryItem({
            source: "generate",
            mediaType: videoUrl ? "video" : "audio",
            prompt: state.enhancedPrompt || params.prompt,
            modelId: model.id,
            modelName: model.name,
            aspectRatio: params.aspectRatio as string | undefined,
            duration: params.duration as string | undefined,
            resolution: params.resolution as string | undefined,
            mediaUrl: (videoUrl || audioUrl) as string,
          });
        } catch { /* ignore history errors */ }
      }
    } catch (err) {
      if (cancelRef.current) return;
      setState((s) => ({ ...s, status: "failed", error: err instanceof Error ? err.message : "Generation failed" }));
    }
  }, [model, mode, params, autoEnhance, state.enhancedPrompt, promptProfile]);

  const cancel = useCallback(() => { cancelRef.current = true; setState((s) => ({ ...s, status: "idle", progress: 0 })); }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setState(initialState);
    if (model) setParams((prev) => ({ ...getDefaultParams(model), prompt: prev.prompt }));
  }, [model]);

  const canGenerate = !!model && !!params.prompt.trim() && (mode === "t2v" || !!params.imageUrl) && state.status !== "queued" && state.status !== "generating" && state.status !== "enhancing";

  return {
    modelId, mode, params, state, model, promptProfile,
    autoEnhance, setAutoEnhance,
    setModelId, setMode, setParam, setExtra,
    enhancePrompt, generate, cancel, reset,
    models: VIDEO_MODELS,
    canGenerate,
    isEnhancing: state.status === "enhancing",
    isGenerating: state.status === "queued" || state.status === "generating",
  };
}
