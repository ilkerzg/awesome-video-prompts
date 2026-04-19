// Unified video model configuration system
// Each model has capabilities (what params it supports) and a buildInput adapter

export type GenerationMode = "t2v" | "i2v";

export interface DurationConfig {
  type: "enum_string" | "enum_int" | "range";
  values: (string | number)[];
  default: string | number;
  // for range type
  min?: number;
  max?: number;
  step?: number;
}

export interface ExtraParam {
  key: string;
  label: string;
  type: "enum" | "boolean" | "number" | "string";
  values?: string[];
  default?: string | number | boolean;
  description?: string;
}

export interface ModelCapabilities {
  duration: DurationConfig;
  aspectRatio: { values: string[]; default: string };
  resolution: { values: string[]; default: string };
  audio: boolean;
  negativePrompt: boolean;
  seed: boolean;
  endImage: boolean;
  extras: ExtraParam[];
}

export interface GenerationParams {
  prompt: string;
  duration: string | number;
  aspectRatio: string;
  resolution: string;
  audioEnabled: boolean;
  negativePrompt: string;
  seed: number | null;
  imageUrl: string | null;
  endImageUrl: string | null;
  extras: Record<string, string | number | boolean>;
}

export interface VideoModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  modes: GenerationMode[];
  t2vEndpoint: string | null;
  i2vEndpoint: string | null;
  capabilities: ModelCapabilities;
  buildInput: (params: GenerationParams, mode: GenerationMode) => Record<string, unknown>;
}

// ─── Model Definitions ───────────────────────────────────────

export const VIDEO_MODELS: VideoModel[] = [
  // ── Veo 3.1 ──
  {
    id: "veo3.1",
    name: "Veo 3.1",
    provider: "Google",
    description: "Most advanced AI video model. 4K, audio, cinematic.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/veo3.1",
    i2vEndpoint: "fal-ai/veo3.1/image-to-video",
    capabilities: {
      duration: { type: "enum_string", values: ["4s", "6s", "8s"], default: "6s" },
      aspectRatio: { values: ["16:9", "9:16"], default: "16:9" },
      resolution: { values: ["720p", "1080p", "4k"], default: "1080p" },
      audio: true, negativePrompt: true, seed: true, endImage: false,
      extras: [{ key: "safety_tolerance", label: "Safety", type: "enum", values: ["1", "2", "3", "4", "5", "6"], default: "4" }],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      resolution: p.resolution,
      duration: p.duration,
      generate_audio: p.audioEnabled,
      ...(p.negativePrompt ? { negative_prompt: p.negativePrompt } : {}),
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
      safety_tolerance: (p.extras.safety_tolerance as string) || "4",
    }),
  },

  // ── Veo 3.1 Lite ──
  {
    id: "veo3.1-lite",
    name: "Veo 3.1 Lite",
    provider: "Google",
    description: "Fast & affordable Veo. T2V + I2V, audio.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/veo3.1/lite",
    i2vEndpoint: "fal-ai/veo3.1/lite/image-to-video",
    capabilities: {
      duration: { type: "enum_string", values: ["4s", "6s", "8s"], default: "6s" },
      aspectRatio: { values: ["16:9", "9:16"], default: "16:9" },
      resolution: { values: ["720p", "1080p"], default: "720p" },
      audio: true, negativePrompt: true, seed: true, endImage: false,
      extras: [],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: mode === "i2v" ? "auto" : p.aspectRatio,
      resolution: p.resolution,
      duration: p.duration,
      generate_audio: p.audioEnabled,
      ...(p.negativePrompt ? { negative_prompt: p.negativePrompt } : {}),
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
    }),
  },

  // ── Seedance 2.0 ──
  {
    id: "seedance-2.0",
    name: "Seedance 2.0",
    provider: "ByteDance",
    description: "Multi-shot, native audio, physics, director camera control.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "bytedance/seedance-2.0/text-to-video",
    i2vEndpoint: "bytedance/seedance-2.0/image-to-video",
    capabilities: {
      duration: { type: "enum_string", values: ["auto", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], default: "auto" },
      aspectRatio: { values: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], default: "16:9" },
      resolution: { values: ["480p", "720p"], default: "720p" },
      audio: true, negativePrompt: false, seed: true, endImage: true,
      extras: [],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      resolution: p.resolution,
      duration: String(p.duration),
      generate_audio: p.audioEnabled,
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
      ...(p.endImageUrl ? { end_image_url: p.endImageUrl } : {}),
    }),
  },

  // ── Wan 2.7 ──
  {
    id: "wan-2.7",
    name: "Wan 2.7",
    provider: "Alibaba",
    description: "Enhanced motion, scene fidelity, visual coherence.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/wan/v2.7/text-to-video",
    i2vEndpoint: "fal-ai/wan/v2.7/image-to-video",
    capabilities: {
      duration: { type: "enum_int", values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], default: 5 },
      aspectRatio: { values: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9" },
      resolution: { values: ["720p", "1080p"], default: "720p" },
      audio: false, negativePrompt: true, seed: true, endImage: true,
      extras: [
        { key: "enable_prompt_expansion", label: "Prompt Expansion", type: "boolean", default: true, description: "AI enhances your prompt" },
      ],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      resolution: p.resolution,
      duration: Number(p.duration),
      ...(p.negativePrompt ? { negative_prompt: p.negativePrompt } : {}),
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
      ...(p.endImageUrl ? { end_image_url: p.endImageUrl } : {}),
      enable_prompt_expansion: p.extras.enable_prompt_expansion !== false,
    }),
  },

  // ── Kling v3 Pro ──
  {
    id: "kling-v3",
    name: "Kling v3 Pro",
    provider: "Kuaishou",
    description: "Cinematic visuals, fluid motion, multi-shot, audio.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/kling-video/v3/pro/text-to-video",
    i2vEndpoint: "fal-ai/kling-video/v3/pro/image-to-video",
    capabilities: {
      duration: { type: "enum_string", values: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], default: "5" },
      aspectRatio: { values: ["16:9", "9:16", "1:1"], default: "16:9" },
      resolution: { values: ["720p"], default: "720p" },
      audio: true, negativePrompt: true, seed: false, endImage: true,
      extras: [
        { key: "cfg_scale", label: "CFG Scale", type: "number", default: 0.5, description: "Prompt adherence (0-1)" },
      ],
    },
    buildInput: (p, mode) => {
      const base: Record<string, unknown> = {
        prompt: p.prompt,
        aspect_ratio: p.aspectRatio,
        duration: String(p.duration),
        generate_audio: p.audioEnabled,
        negative_prompt: p.negativePrompt || "blur, distort, and low quality",
        cfg_scale: Number(p.extras.cfg_scale ?? 0.5),
      };
      if (mode === "i2v" && p.imageUrl) {
        base.start_image_url = p.imageUrl; // Kling uses start_image_url!
        if (p.endImageUrl) base.end_image_url = p.endImageUrl;
      }
      return base;
    },
  },

  // ── Grok Imagine Video ──
  {
    id: "grok-imagine",
    name: "Grok Imagine Video",
    provider: "xAI",
    description: "Text & image to video with audio from xAI.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "xai/grok-imagine-video/text-to-video",
    i2vEndpoint: "xai/grok-imagine-video/image-to-video",
    capabilities: {
      duration: { type: "enum_int", values: [4, 5, 6, 7, 8], default: 6 },
      aspectRatio: { values: ["16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"], default: "16:9" },
      resolution: { values: ["480p", "720p"], default: "720p" },
      audio: false, negativePrompt: false, seed: false, endImage: false,
      extras: [],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: mode === "i2v" ? "auto" : p.aspectRatio,
      resolution: p.resolution,
      duration: Number(p.duration),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
    }),
  },

  // ── Pixverse v6 ──
  {
    id: "pixverse-v6",
    name: "Pixverse v6",
    provider: "Pixverse",
    description: "Multi-style video with thinking mode, up to 1080p.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/pixverse/v6/text-to-video",
    i2vEndpoint: "fal-ai/pixverse/v6/image-to-video",
    capabilities: {
      duration: { type: "enum_int", values: [3, 4, 5, 6, 7, 8], default: 5 },
      aspectRatio: { values: ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"], default: "16:9" },
      resolution: { values: ["360p", "540p", "720p", "1080p"], default: "720p" },
      audio: true, negativePrompt: true, seed: true, endImage: false,
      extras: [
        { key: "style", label: "Style", type: "enum", values: ["anime", "3d_animation", "clay", "comic", "cyberpunk"], default: "" },
        { key: "thinking_type", label: "Thinking", type: "enum", values: ["enabled", "disabled", "auto"], default: "auto" },
      ],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      resolution: p.resolution,
      duration: Number(p.duration),
      generate_audio_switch: p.audioEnabled,
      ...(p.negativePrompt ? { negative_prompt: p.negativePrompt } : {}),
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(p.extras.style ? { style: p.extras.style } : {}),
      thinking_type: (p.extras.thinking_type as string) || "auto",
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
    }),
  },

  // ── Pixverse C1 ──
  {
    id: "pixverse-c1",
    name: "Pixverse C1",
    provider: "Pixverse",
    description: "Compact, fast video generation up to 1080p.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/pixverse/c1/text-to-video",
    i2vEndpoint: "fal-ai/pixverse/c1/image-to-video",
    capabilities: {
      duration: { type: "enum_int", values: [3, 4, 5, 6, 7, 8], default: 5 },
      aspectRatio: { values: ["16:9", "4:3", "1:1", "3:4", "9:16"], default: "16:9" },
      resolution: { values: ["360p", "540p", "720p", "1080p"], default: "720p" },
      audio: true, negativePrompt: false, seed: true, endImage: false,
      extras: [],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      resolution: p.resolution,
      duration: Number(p.duration),
      generate_audio_switch: p.audioEnabled,
      ...(p.seed != null ? { seed: p.seed } : {}),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
    }),
  },

  // ── LTX 2.3 ──
  {
    id: "ltx-2.3",
    name: "LTX 2.3",
    provider: "Lightricks",
    description: "Up to 4K, variable FPS, audio generation.",
    modes: ["t2v", "i2v"],
    t2vEndpoint: "fal-ai/ltx-2.3/text-to-video",
    i2vEndpoint: "fal-ai/ltx-2.3/image-to-video",
    capabilities: {
      duration: { type: "enum_int", values: [6, 8, 10], default: 6 },
      aspectRatio: { values: ["16:9", "9:16"], default: "16:9" },
      resolution: { values: ["1080p", "1440p", "2160p"], default: "1080p" },
      audio: true, negativePrompt: false, seed: false, endImage: true,
      extras: [
        { key: "fps", label: "FPS", type: "enum", values: ["24", "25", "48", "50"], default: "24" },
      ],
    },
    buildInput: (p, mode) => ({
      prompt: p.prompt,
      aspect_ratio: mode === "i2v" ? "auto" : p.aspectRatio,
      resolution: p.resolution,
      duration: Number(p.duration),
      generate_audio: p.audioEnabled,
      fps: Number(p.extras.fps ?? 24),
      ...(mode === "i2v" && p.imageUrl ? { image_url: p.imageUrl } : {}),
      ...(p.endImageUrl ? { end_image_url: p.endImageUrl } : {}),
    }),
  },
];

// ─── Helpers ───────────────────────────────────────────────

export function getModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}

export function getEndpoint(model: VideoModel, mode: GenerationMode): string | null {
  return mode === "t2v" ? model.t2vEndpoint : model.i2vEndpoint;
}

export function getDefaultParams(model: VideoModel): GenerationParams {
  const cap = model.capabilities;
  const extraDefaults: Record<string, string | number | boolean> = {};
  cap.extras.forEach((e) => { if (e.default !== undefined) extraDefaults[e.key] = e.default; });

  return {
    prompt: "",
    duration: cap.duration.default,
    aspectRatio: cap.aspectRatio.default,
    resolution: cap.resolution.default,
    audioEnabled: cap.audio,
    negativePrompt: "",
    seed: null,
    imageUrl: null,
    endImageUrl: null,
    extras: extraDefaults,
  };
}
