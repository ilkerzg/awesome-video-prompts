/**
 * Podcast Creator Pipeline
 *
 * Flow:
 * 1. Script (user provides or AI generates) + 2 speaker images
 * 2. Gemini TTS → multi-speaker audio
 * 3. ElevenLabs Scribe v2 → word-level timestamps with speaker diarization
 * 4. Split audio into speaker segments
 * 5. FlashTalk → lip-synced video per segment (image + audio chunk)
 * 6. Merge all video segments → final podcast video
 */

import { getFal, runOpenRouter } from "./fal-client";

// ─── Types ──────────────────────────────────────────────────

export interface Speaker {
  id: string;
  name: string;
  voice: string;
  imageUrl: string | null;
}

export interface SpeakerSegment {
  speakerId: string;
  text: string;
  startTime: number;
  endTime: number;
  audioUrl?: string;
  videoUrl?: string;
}

export type PodcastStage =
  | "idle" | "script" | "portraits" | "tts" | "stt" | "splitting" | "lipsync" | "merging" | "completed" | "failed";

export const PODCAST_STAGE_LABELS: Record<PodcastStage, string> = {
  idle: "Ready",
  script: "Writing Script",
  portraits: "Studio Portraits",
  tts: "Generating Audio",
  stt: "Analyzing Speech",
  splitting: "Splitting Segments",
  lipsync: "Lip-Syncing",
  merging: "Merging Video",
  completed: "Completed",
  failed: "Failed",
};

export const PODCAST_STAGES: PodcastStage[] = [
  "script", "portraits", "tts", "stt", "splitting", "lipsync", "merging", "completed",
];

export interface GeminiVoice {
  id: string;
  gender: "Female" | "Male";
  character: string;
  description: string;
}

export const GEMINI_VOICES: GeminiVoice[] = [
  { id: "Zephyr", gender: "Female", character: "Bright", description: "Crisp, luminous female voice — effortless energy for upbeat hosts." },
  { id: "Puck", gender: "Male", character: "Upbeat", description: "Playful, springy male voice — perfect for charismatic presenters." },
  { id: "Charon", gender: "Male", character: "Informative", description: "Grounded, documentary-style male narration with calm authority." },
  { id: "Kore", gender: "Female", character: "Firm", description: "Confident, decisive female voice — executive tone with edge." },
  { id: "Fenrir", gender: "Male", character: "Excitable", description: "High-energy male voice bursting with enthusiasm and momentum." },
  { id: "Leda", gender: "Female", character: "Youthful", description: "Fresh, spirited female voice — Gen-Z charm and natural warmth." },
  { id: "Orus", gender: "Male", character: "Firm", description: "Steady, commanding male voice built for serious delivery." },
  { id: "Aoede", gender: "Female", character: "Breezy", description: "Light, airy female voice — relaxed and conversational." },
  { id: "Callirrhoe", gender: "Female", character: "Easy-going", description: "Warm, unhurried female voice — approachable and friendly." },
  { id: "Autonoe", gender: "Female", character: "Bright", description: "Radiant, polished female voice with broadcast-ready clarity." },
  { id: "Enceladus", gender: "Male", character: "Breathy", description: "Soft, intimate male voice — great for ASMR or cinematic whispers." },
  { id: "Iapetus", gender: "Male", character: "Clear", description: "Pristine, neutral male voice — tutorial and e-learning ready." },
  { id: "Umbriel", gender: "Male", character: "Easy-going", description: "Laid-back male voice — feels like a coffee-shop chat." },
  { id: "Algenib", gender: "Male", character: "Gravelly", description: "Rough, textured male voice — noir narrator vibes." },
  { id: "Despina", gender: "Female", character: "Smooth", description: "Silky, polished female voice — late-night radio elegance." },
  { id: "Erinome", gender: "Female", character: "Clear", description: "Articulate, composed female voice for news and tutorials." },
  { id: "Laomedeia", gender: "Female", character: "Upbeat", description: "Bubbly, optimistic female voice — ad-spot energy." },
  { id: "Achernar", gender: "Female", character: "Soft", description: "Gentle, soothing female voice — meditation and bedtime stories." },
  { id: "Algieba", gender: "Male", character: "Smooth", description: "Refined, velvety male voice — luxury brand narrator." },
  { id: "Schedar", gender: "Male", character: "Even", description: "Balanced, measured male voice — consistent corporate read." },
  { id: "Gacrux", gender: "Female", character: "Mature", description: "Seasoned, wise female voice — grounded and experienced." },
  { id: "Pulcherrima", gender: "Female", character: "Forward", description: "Direct, assertive female voice — leans in and owns the room." },
  { id: "Achird", gender: "Male", character: "Friendly", description: "Warm, neighborly male voice — the approachable guy-next-door." },
  { id: "Zubenelgenubi", gender: "Male", character: "Casual", description: "Relaxed, off-the-cuff male voice — podcast-ready authenticity." },
  { id: "Vindemiatrix", gender: "Female", character: "Gentle", description: "Tender, comforting female voice — nurturing and kind." },
  { id: "Sadachbia", gender: "Male", character: "Lively", description: "Animated, spirited male voice — full of character and bounce." },
  { id: "Sadaltager", gender: "Male", character: "Knowledgeable", description: "Thoughtful, expert-sounding male voice — lecturer credibility." },
  { id: "Sulafat", gender: "Female", character: "Warm", description: "Inviting, honey-toned female voice — heartfelt storyteller." },
  { id: "Alnilam", gender: "Male", character: "Firm", description: "Resolute, principled male voice — leadership delivery." },
  { id: "Rasalgethi", gender: "Male", character: "Informative", description: "Clear, educational male voice — explainer-video staple." },
];

export const GEMINI_VOICE_IDS: string[] = GEMINI_VOICES.map((v) => v.id);

export function getVoiceMeta(id: string): GeminiVoice | undefined {
  return GEMINI_VOICES.find((v) => v.id === id);
}

export const LANGUAGE_OPTIONS = [
  { id: "English (US)", label: "English (US)" },
  { id: "English (UK)", label: "English (UK)" },
  { id: "Turkish", label: "Turkish" },
  { id: "Japanese", label: "Japanese" },
  { id: "Korean", label: "Korean" },
  { id: "Spanish", label: "Spanish" },
  { id: "French", label: "French" },
  { id: "German", label: "German" },
  { id: "Chinese (Mandarin)", label: "Chinese (Mandarin)" },
  { id: "Portuguese (Brazil)", label: "Portuguese (Brazil)" },
];

// ─── Helpers ────────────────────────────────────────────────

async function falRun(endpoint: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const fal = getFal();
  try {
    const result = await fal.subscribe(endpoint as string, { input });
    return result.data as Record<string, unknown>;
  } catch (e: unknown) {
    throw new Error(`[${endpoint}] ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ─── Studio Portrait Generation ─────────────────────────────

// Pre-uploaded reference studio halves on fal CDN (permanent URLs)
export const STUDIO_REF_LEFT = "https://v3b.fal.media/files/b/0a967fb9/1vsUZWN6Dx5Qgruqtzgld_1776352577685.png";
export const STUDIO_REF_RIGHT = "https://v3b.fal.media/files/b/0a967fb9/ToC9bEiandNd2QqMH1rTd_1776352577686.png";

/**
 * Generate a "character in podcast studio" portrait using Seedream v5 Lite Edit.
 * Takes the character's photo + podcast studio reference half, outputs the character
 * in a professional podcast studio setting while preserving their appearance.
 */
export async function generateStudioPortrait(
  characterImageUrl: string,
  studioRefUrl: string,
  speakerName: string,
  position: "left" | "right",
): Promise<string> {
  const facing = position === "left" ? "facing right, looking toward the right side, three-quarter view turned to the right" : "facing left, looking toward the left side, three-quarter view turned to the left";
  const data = await falRun("fal-ai/bytedance/seedream/v5/lite/edit", {
    image_urls: [studioRefUrl, characterImageUrl],
    prompt: `Place the person from Figure 2 into the podcast studio scene from Figure 1. The person should be ${facing}, wearing over-ear headphones and sitting in front of a professional podcast microphone. Keep the person's exact face, hair, and appearance from Figure 2 unchanged. Professional podcast studio with colorful LED lights, brick wall background, plants on desk. Close-up portrait, natural studio lighting.`,
    image_size: "auto_2K",
    num_images: 1,
  });
  return ((data.images as { url: string }[])[0]).url;
}

// ─── Pipeline Steps ─────────────────────────────────────────

// Step 1: Generate script via AI (if user provides topic instead of script)
export async function generatePodcastScript(
  topic: string,
  speaker1Name: string,
  speaker2Name: string,
): Promise<string> {
  const system = `You write natural, engaging podcast conversation scripts. Two speakers discuss a topic in a warm, conversational tone. Use speaker tags like "${speaker1Name}: ..." and "${speaker2Name}: ...". Include emotional cues in brackets like [excited], [laughing], [thoughtful]. Keep it 60-90 seconds of dialogue (roughly 150-250 words). Output ONLY the script text, no markdown, no labels.`;
  const raw = await runOpenRouter(topic, {
    model: "anthropic/claude-opus-4-6",
    system_prompt: system,
    max_tokens: 2048,
  });
  return raw.trim();
}

// Step 2: Gemini TTS → multi-speaker audio
export async function generateTTS(
  script: string,
  speakers: Speaker[],
  language: string,
  styleInstructions: string,
): Promise<string> {
  const data = await falRun("fal-ai/gemini-3.1-flash-tts", {
    prompt: script,
    voice: speakers[0]?.voice || "Charon",
    speakers: speakers.map((s) => ({
      voice: s.voice,
      speaker_id: s.name,
    })),
    temperature: 1,
    language_code: language,
    output_format: "mp3",
    style_instructions: styleInstructions,
  });
  return (data.audio as { url: string }).url;
}

// Step 3: ElevenLabs Scribe v2 → word-level timestamps + diarization
export async function transcribeAudio(audioUrl: string): Promise<{
  text: string;
  words: { text: string; start: number; end: number; type: string; speaker_id: string }[];
}> {
  const data = await falRun("fal-ai/elevenlabs/speech-to-text/scribe-v2", {
    audio_url: audioUrl,
    diarize: true,
    language_code: "eng",
    tag_audio_events: true,
  });
  return {
    text: data.text as string,
    words: data.words as { text: string; start: number; end: number; type: string; speaker_id: string }[],
  };
}

// Step 4: Group words into speaker segments
export function groupSpeakerSegments(
  words: { text: string; start: number; end: number; type: string; speaker_id: string }[],
): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  let current: SpeakerSegment | null = null;

  for (const word of words) {
    if (word.type === "spacing") continue;

    if (!current || current.speakerId !== word.speaker_id) {
      if (current) segments.push(current);
      current = {
        speakerId: word.speaker_id,
        text: word.text,
        startTime: word.start,
        endTime: word.end,
      };
    } else {
      current.text += " " + word.text;
      current.endTime = word.end;
    }
  }
  if (current) segments.push(current);

  // Merge very short segments (< 1s) with neighbors of same speaker
  const merged: SpeakerSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.speakerId === seg.speakerId && seg.startTime - last.endTime < 0.5) {
      last.text += " " + seg.text;
      last.endTime = seg.endTime;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

// Step 5a: Split audio at speaker segment boundaries
export async function splitAudio(
  audioUrl: string,
  splitPoints: number[],
): Promise<string[]> {
  const data = await falRun("fal-ai/workflow-utilities/split-audio", {
    audio_url: audioUrl,
    split_points: splitPoints,
  });
  const segments = data.audio as { url: string }[];
  return segments.map((s) => s.url);
}

// Step 5b: lip-synced video from portrait + audio
export type LipsyncModelId = "creatify-aurora" | "veed-fabric" | "veed-fabric-hq" | "kling-avatar-v2";

export interface LipsyncModel {
  id: LipsyncModelId;
  name: string;
  endpoint: string;
  endpointUrl: string;
  description: string;
}

export const LIPSYNC_MODELS: LipsyncModel[] = [
  {
    id: "creatify-aurora",
    name: "Creatify Aurora",
    endpoint: "fal-ai/creatify/aurora",
    endpointUrl: "https://fal.ai/models/fal-ai/creatify/aurora",
    description: "Natural talking-head lip-sync at 720p with cinematic guidance.",
  },
  {
    id: "veed-fabric",
    name: "VEED Fabric 1.0 Fast",
    endpoint: "veed/fabric-1.0/fast",
    endpointUrl: "https://fal.ai/models/veed/fabric-1.0/fast",
    description: "Fast portrait animation at 480p — the budget option.",
  },
  {
    id: "veed-fabric-hq",
    name: "VEED Fabric 1.0",
    endpoint: "veed/fabric-1.0",
    endpointUrl: "https://fal.ai/models/veed/fabric-1.0",
    description: "Higher-quality VEED Fabric at 720p for sharper, more refined results.",
  },
  {
    id: "kling-avatar-v2",
    name: "Kling Avatar v2 Pro",
    endpoint: "fal-ai/kling-video/ai-avatar/v2/pro",
    endpointUrl: "https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/pro",
    description: "High-fidelity avatar lip-sync from Kling v2 Pro.",
  },
];

export const DEFAULT_LIPSYNC_MODEL: LipsyncModelId = "creatify-aurora";

export function getLipsyncModel(id: LipsyncModelId): LipsyncModel {
  return LIPSYNC_MODELS.find((m) => m.id === id) ?? LIPSYNC_MODELS[0];
}

const CREATIFY_DEFAULT_PROMPT = "Studio interview, medium close-up (shoulders-up crop). Solid neutral backdrop, uniform soft key light. Presenter faces the lens with steady eye-contact and natural expression. Hands stay below frame, body still. Ultra-sharp, 4K.";

export async function generateLipsync(
  imageUrl: string,
  audioUrl: string,
  modelId: LipsyncModelId = DEFAULT_LIPSYNC_MODEL,
): Promise<string> {
  const model = getLipsyncModel(modelId);
  let input: Record<string, unknown>;
  if (model.id === "creatify-aurora") {
    input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt: CREATIFY_DEFAULT_PROMPT,
      guidance_scale: 1,
      audio_guidance_scale: 2,
      resolution: "720p",
    };
  } else if (model.id === "kling-avatar-v2") {
    input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt: ".",
    };
  } else if (model.id === "veed-fabric-hq") {
    input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      resolution: "720p",
    };
  } else {
    input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      resolution: "480p",
    };
  }
  const data = await falRun(model.endpoint, input);
  return (data.video as { url: string }).url;
}

// Step 6: Merge all video segments
export async function mergeVideos(videoUrls: string[]): Promise<string> {
  const data = await falRun("fal-ai/ffmpeg-api/merge-videos", {
    video_urls: videoUrls,
  });
  return (data.video as { url: string }).url;
}

// Step 6b: Add original audio back to merged video
export async function addAudioToVideo(videoUrl: string, audioUrl: string): Promise<string> {
  const data = await falRun("fal-ai/workflow-utilities/merge-audio-into-video", {
    video_url: videoUrl,
    audio_url: audioUrl,
    keep_original_audio: false,
  });
  return (data.video as { url: string }).url;
}
