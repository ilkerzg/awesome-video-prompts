import { getFal, runOpenRouter } from "./fal-client";
import { VIDEO_MODELS, getModel, type GenerationParams } from "./video-models";

// ─── Types ──────────────────────────────────────────────────

export interface PipelineConfig {
  topic: string;
  aspectRatio: "9:16" | "16:9";
  voice: string;
  endCardUrl: string | null;
  imageModel: string;
  videoModel: string;
  musicModel: string;
}

export interface ScriptScene { id: string; beat: string; narration: string }
export interface ScriptResult { tts_script: string; music_prompt: string; scenes: ScriptScene[] }

export interface ProductionScene {
  id: string;
  image_prompt: string;
  video_prompt: string;
  gen_duration: string;
  trim_duration: number;
}

export interface ProductionPlan {
  music_duration_ms: number;
  hook_duration: number;
  middle_start: number;
  middle_duration: number;
  anchor_start: number;
  anchor_duration: number;
  scenes: ProductionScene[];
}

export interface SceneAsset {
  imageUrl: string | null;
  videoUrl: string | null;
  trimmedUrl: string | null;
  status: "pending" | "image" | "video" | "trimming" | "done" | "error";
  error?: string;
}

export type PipelineStage = "idle" | "script" | "voice" | "planning" | "assets" | "merge" | "audio" | "subtitles" | "completed" | "failed";

export const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Ready", script: "Writing Script", voice: "Generating Voice",
  planning: "Production Planning", assets: "Creating Assets",
  merge: "Merging Video", audio: "Adding Audio",
  subtitles: "Finishing", completed: "Completed", failed: "Failed",
};

export const STAGE_ORDER: PipelineStage[] = [
  "script", "voice", "planning", "assets", "merge", "audio", "subtitles", "completed",
];

// ─── Model Configs ──────────────────────────────────────────

export const IMAGE_MODEL_OPTIONS = [
  { id: "nano-banana-pro", label: "Nano Banana Pro", endpoint: "fal-ai/nano-banana-pro" },
  { id: "seedream-v5-lite", label: "Seedream v5 Lite", endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image" },
  { id: "flux-klein-9b", label: "FLUX.2 Klein 9B", endpoint: "fal-ai/flux-2/klein/9b/lora" },
];

export const VIDEO_MODEL_OPTIONS = VIDEO_MODELS.filter((m) => m.i2vEndpoint).map((m) => ({
  id: m.id, label: `${m.name} (${m.provider})`,
}));

export const MUSIC_MODEL_OPTIONS = [
  { id: "elevenlabs", label: "ElevenLabs Music" },
];

export const VOICE_OPTIONS = [
  { id: "Rachel", label: "Rachel" }, { id: "Aria", label: "Aria" },
  { id: "Roger", label: "Roger" }, { id: "Sarah", label: "Sarah" },
  { id: "Brian", label: "Brian" }, { id: "Charlie", label: "Charlie" },
  { id: "Finn", label: "Finn" }, { id: "Juniper", label: "Juniper" },
];

// ─── Helpers ────────────────────────────────────────────────

function extractJson<T>(raw: string): T {
  try { return JSON.parse(raw); } catch { /* continue */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("No valid JSON in LLM response");
}

async function falRun(endpoint: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const fal = getFal();
  try {
    const result = await fal.subscribe(endpoint as string, { input });
    return result.data as Record<string, unknown>;
  } catch (e: unknown) {
    throw new Error(`[${endpoint}] ${e instanceof Error ? e.message : String(e)}`);
  }
}

function getVideoModelDurationInfo(modelId: string): string {
  const m = getModel(modelId);
  if (!m) return 'Available gen_durations: "4s", "6s", "8s"';
  const vals = m.capabilities.duration.values;
  const type = m.capabilities.duration.type;
  if (type === "enum_string") return `Available gen_durations (string): ${vals.map((v) => `"${v}"`).join(", ")}`;
  if (type === "enum_int") return `Available gen_durations (integer seconds): ${vals.join(", ")}`;
  return `Available gen_durations: ${vals.join(", ")}`;
}

function mapAspectRatioForImage(imageModel: string, aspectRatio: string): Record<string, unknown> {
  if (imageModel === "nano-banana-pro") {
    return { aspect_ratio: aspectRatio, resolution: "2K", safety_tolerance: "5" };
  }
  if (imageModel === "seedream-v5-lite") {
    const size = aspectRatio === "9:16" ? "portrait_2K" : "landscape_2K";
    return { image_size: size };
  }
  // flux klein
  const size = aspectRatio === "9:16" ? "portrait_16_9" : "landscape_16_9";
  return { image_size: size, loras: [] };
}

// ─── System Prompts ─────────────────────────────────────────

const SCRIPT_SYSTEM = `CRITICAL: Your entire response must be ONLY a raw JSON object. Do NOT wrap in code fences. The very first character must be { and the very last must be }.

You are a screenplay writer for 60-second faceless educational videos.

Write a narration script following a 5-beat arc across exactly 10 scenes:
- Scene 1: HOOK — curiosity gap. Never open with the topic name.
- Scene 2: GROUND — connect the hook to the viewer's world.
- Scenes 3-7: CORE — teaching payload, one concept per scene.
- Scenes 8-9: SYNTHESIS — link core ideas back to the hook.
- Scene 10: ANCHOR — one memorable closing line.

Rules:
- 8-12 words per sentence, max 15.
- Total narration: 150-170 words for 60 seconds.
- No people, faces, avatars mentioned.
- Active voice only.

Return:
{
  "tts_script": "All narrations joined with spaces.",
  "music_prompt": "Soft ambient educational background, instrumental only, no vocals, themes of [topic]",
  "scenes": [
    {"id": "s01", "beat": "hook", "narration": "..."},
    {"id": "s02", "beat": "ground", "narration": "..."},
    {"id": "s03", "beat": "core", "narration": "..."},
    {"id": "s04", "beat": "core", "narration": "..."},
    {"id": "s05", "beat": "core", "narration": "..."},
    {"id": "s06", "beat": "core", "narration": "..."},
    {"id": "s07", "beat": "core", "narration": "..."},
    {"id": "s08", "beat": "synthesis", "narration": "..."},
    {"id": "s09", "beat": "synthesis", "narration": "..."},
    {"id": "s10", "beat": "anchor", "narration": "..."}
  ]
}`;

function buildPlanningSystem(videoModelId: string): string {
  const durInfo = getVideoModelDurationInfo(videoModelId);

  return `CRITICAL: Your entire response must be ONLY a raw JSON object. No code fences. First char { last char }.

You are a video production planner. You receive word-level timestamps from STT and the original 10-scene script.

STEP 1: Map words to scenes by matching narration content.
STEP 2: Calculate each scene duration from first word start to last word end.
STEP 3: Write image & video prompts.
STEP 4: Assign gen_duration and trim_duration.

IMPORTANT — DURATION RULES:
- ${durInfo}
- trim_duration = exact scene duration from timestamps (decimal, e.g. 5.3)
- gen_duration must be ≥ trim_duration. Pick the smallest available gen_duration that fits.
- The SUM of all trim_durations MUST equal the total narration duration (last word end time). Do NOT lose any time between scenes.

IMAGE PROMPT RULES:
- [Subject] + [Action/State] + [Context] + [Composition] + [Style/Lighting]
- Describe lighting, composition, materials explicitly.
- No people, faces, avatars.
- No generic keywords like "8K, masterpiece".

VIDEO PROMPT RULES:
- Describe MOTION and CAMERA only. The image shows the scene.
- "Camera slowly pushes in toward..." / "Particles drift upward..."
- Concise, motion-focused.

SUBTITLE SPLIT POINTS:
- hook_duration = scene 1 trim_duration
- middle_start = hook_duration
- middle_duration = sum of scenes 2-9 trim_durations
- anchor_start = hook_duration + middle_duration
- anchor_duration = scene 10 trim_duration

music_duration_ms = total narration duration × 1000 + 3000 (integer).

Return:
{
  "music_duration_ms": 63000,
  "hook_duration": 5.3,
  "middle_start": 5.3,
  "middle_duration": 45.2,
  "anchor_start": 50.5,
  "anchor_duration": 5.8,
  "scenes": [
    {"id":"s01","image_prompt":"...","video_prompt":"...","gen_duration":"6s","trim_duration":5.3},
    ...10 scenes
  ]
}`;
}

// ─── Pipeline Step Functions ────────────────────────────────

// Script
export async function generateScript(topic: string): Promise<ScriptResult> {
  const raw = await runOpenRouter(topic, { system_prompt: SCRIPT_SYSTEM, max_tokens: 4096 });
  return extractJson<ScriptResult>(raw);
}

// TTS
export async function generateTTS(text: string, voice: string): Promise<string> {
  const data = await falRun("fal-ai/elevenlabs/tts/eleven-v3", { text, voice, apply_text_normalization: "on" });
  return (data.audio as { url: string }).url;
}

// STT → returns words array and total duration
export async function generateSTT(audioUrl: string): Promise<{ words: unknown[]; totalDuration: number }> {
  const data = await falRun("fal-ai/elevenlabs/speech-to-text/scribe-v2", { audio_url: audioUrl });
  const words = data.words as { start: number; end: number; text: string }[];
  const totalDuration = words.length > 0 ? words[words.length - 1].end : 60;
  return { words, totalDuration };
}

// Production planning with duration validation
export async function planProduction(
  wordsJson: string,
  scriptJson: string,
  videoModelId: string,
  totalDuration: number,
): Promise<ProductionPlan> {
  const system = buildPlanningSystem(videoModelId);
  const userPrompt = `Total narration duration: ${totalDuration.toFixed(1)} seconds.\n\nTranscript words:\n${wordsJson}\n\nOriginal script:\n${scriptJson}`;
  const raw = await runOpenRouter(userPrompt, { system_prompt: system, max_tokens: 8192 });
  const plan = extractJson<ProductionPlan>(raw);

  // Duration validation: ensure trim_durations sum ≈ total narration
  const planTotal = plan.scenes.reduce((s, sc) => s + sc.trim_duration, 0);
  if (Math.abs(totalDuration - planTotal) > 1.5) {
    const scale = totalDuration / planTotal;
    plan.scenes.forEach((s) => {
      s.trim_duration = Math.round(s.trim_duration * scale * 10) / 10;
    });
    // Recalculate splits
    plan.hook_duration = plan.scenes[0].trim_duration;
    plan.middle_start = plan.hook_duration;
    plan.middle_duration = plan.scenes.slice(1, 9).reduce((s, sc) => s + sc.trim_duration, 0);
    plan.anchor_start = plan.hook_duration + plan.middle_duration;
    plan.anchor_duration = plan.scenes[9].trim_duration;
    plan.music_duration_ms = Math.round(totalDuration * 1000) + 3000;
  }

  return plan;
}

// Scene image
export async function generateSceneImage(prompt: string, aspectRatio: string, imageModel: string): Promise<string> {
  const cfg = IMAGE_MODEL_OPTIONS.find((m) => m.id === imageModel) ?? IMAGE_MODEL_OPTIONS[0];
  const extra = mapAspectRatioForImage(imageModel, aspectRatio);
  const data = await falRun(cfg.endpoint, { prompt, num_images: 1, ...extra });
  const images = data.images as { url: string }[];
  return images[0].url;
}

// Scene video (I2V) — uses VIDEO_MODELS buildInput
export async function generateSceneVideo(
  prompt: string,
  imageUrl: string,
  genDuration: string | number,
  videoModelId: string,
  aspectRatio: string,
): Promise<string> {
  const model = getModel(videoModelId);
  if (!model?.i2vEndpoint) throw new Error(`No I2V for ${videoModelId}`);

  const extras: Record<string, string | number | boolean> = {};
  model.capabilities.extras.forEach((e) => { if (e.default !== undefined) extras[e.key] = e.default; });

  const params: GenerationParams = {
    prompt,
    duration: genDuration,
    aspectRatio,
    resolution: model.capabilities.resolution.default,
    audioEnabled: false,
    negativePrompt: model.capabilities.negativePrompt ? "blur, distort, low quality" : "",
    seed: null,
    imageUrl,
    endImageUrl: null,
    extras,
  };

  const input = model.buildInput(params, "i2v");
  const data = await falRun(model.i2vEndpoint, input);

  let url: string | null = null;
  if (data.video && typeof data.video === "object") url = (data.video as { url: string }).url;
  else if (typeof data.video_url === "string") url = data.video_url;
  else if (Array.isArray(data.videos) && data.videos.length > 0) url = (data.videos[0] as { url: string }).url;
  if (!url) throw new Error(`No video URL from ${videoModelId}`);
  return url;
}

// Trim video
export async function trimVideo(videoUrl: string, duration: number): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/trim-video", { video_url: videoUrl, start_time: 0, duration });
  return (data.video as { url: string }).url;
}

// Trim video with start_time
export async function trimSegment(videoUrl: string, startTime: number, duration: number): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/trim-video", { video_url: videoUrl, start_time: startTime, duration });
  return (data.video as { url: string }).url;
}

// Music (ElevenLabs)
export async function generateMusic(prompt: string, durationMs: number): Promise<string> {
  const data = await falRun("fal-ai/elevenlabs/music", {
    prompt,
    music_length_ms: durationMs,
    output_format: "mp3_44100_128",
  });
  const url = (data.audio as { url: string })?.url;
  if (!url) throw new Error("Music generation returned no audio URL");
  return url;
}

// Music fade
export async function fadeMusic(audioUrl: string): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/audio-volume", {
    audio_url: audioUrl, volume: 0, fade_in: 2, fade_out: 4, output_format: "mp3",
  });
  return (data.audio as { url: string }).url;
}

// Merge videos
export async function mergeVideos(videoUrls: string[]): Promise<string> {
  const data = await falRun("fal-ai/ffmpeg-api/merge-videos", { video_urls: videoUrls });
  return (data.video as { url: string }).url;
}

// Add audio to video
export async function addAudioToVideo(videoUrl: string, audioUrl: string, keepOriginal = false): Promise<string> {
  if (!videoUrl || !audioUrl) throw new Error("Missing video or audio URL for merge");
  const data = await falRun("fal-ai/workflow-utilities/merge-audio-into-video", {
    video_url: videoUrl, audio_url: audioUrl, keep_original_audio: keepOriginal,
  });
  const url = (data.video as { url: string })?.url;
  if (!url) throw new Error("merge-audio-into-video returned no video URL");
  return url;
}

// Auto subtitle
export async function addSubtitles(
  videoUrl: string,
  opts: {
    fontSize?: number; fontWeight?: string; fontColor?: string; fontName?: string;
    position?: string; wordsPerSubtitle?: number;
    strokeWidth?: number; highlightColor?: string;
    enableAnimation?: boolean;
  },
): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/auto-subtitle", {
    video_url: videoUrl,
    font_size: opts.fontSize ?? 48,
    font_weight: opts.fontWeight ?? "bold",
    font_color: opts.fontColor ?? "white",
    font_name: opts.fontName ?? "Montserrat",
    position: opts.position ?? "bottom",
    words_per_subtitle: opts.wordsPerSubtitle ?? 3,
    stroke_width: opts.strokeWidth ?? 2,
    stroke_color: "black",
    highlight_color: opts.highlightColor ?? "purple",
    background_opacity: 0,
    enable_animation: opts.enableAnimation ?? true,
    language: "en",
  });
  return (data.video as { url: string }).url;
}

// End card (Ken Burns)
export async function createEndCard(imageUrl: string): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/image-to-video", {
    image_url: imageUrl, duration: 3, zoom_factor: 1.15,
    zoom_direction: "in", easing: "ease_in_out", output_format: "mp4",
  });
  return (data.video as { url: string }).url;
}
