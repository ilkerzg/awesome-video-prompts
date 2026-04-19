/**
 * Scenario Smart Agent
 *
 * Breaks a story concept into scenes, extracts recurring characters and
 * environments, generates canonical reference images for each, then
 * creates per-scene keyframes and video clips using those references for
 * consistency.
 *
 * Runs entirely client-side using the user's fal.ai key.
 */

import { getFal, runOpenRouter } from "./fal-client";

// ─── Types ──────────────────────────────────────────────────

export interface CharacterRef {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  status: "pending" | "generating" | "done" | "failed";
}

export interface EnvironmentRef {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  status: "pending" | "generating" | "done" | "failed";
}

export interface SmartScene {
  id: string;
  index: number;
  title: string;
  action: string;
  imagePrompt: string;
  videoPrompt: string;
  characterIds: string[];
  environmentId: string | null;
  duration: "4" | "5" | "6" | "8" | "10";
  imageUrl?: string;
  videoUrl?: string;
  status: "pending" | "image_generating" | "image_done" | "video_generating" | "video_done" | "failed";
  error?: string;
}

export interface SmartScenario {
  title: string;
  concept: string;
  characters: CharacterRef[];
  environments: EnvironmentRef[];
  scenes: SmartScene[];
}

export type AgentStage =
  | "idle"
  | "analyzing"
  | "characters"
  | "environments"
  | "images"
  | "videos"
  | "completed"
  | "failed";

export const AGENT_STAGES: AgentStage[] = [
  "analyzing", "characters", "environments", "images", "videos", "completed",
];

export const AGENT_STAGE_LABELS: Record<AgentStage, string> = {
  idle: "Ready",
  analyzing: "Analyzing story",
  characters: "Character references",
  environments: "Environment plates",
  images: "Scene keyframes",
  videos: "Animating scenes",
  completed: "Completed",
  failed: "Failed",
};

// ─── LLM: Analyze scenario ──────────────────────────────────

const ANALYZE_SYSTEM = `You are a film director and casting agent. Given a story concept, break it into 4-8 cinematic scenes and identify every recurring character and distinct location.

Return ONLY valid JSON matching this exact shape:

{
  "title": "short scenario title",
  "characters": [
    { "id": "c1", "name": "short name", "description": "60-120 word portrait description with age, clothing, distinctive features — this is used to generate a reference image that MUST stay consistent across every scene" }
  ],
  "environments": [
    { "id": "e1", "name": "short location name", "description": "60-120 word scene description: architecture, lighting, atmosphere, time of day — used as reference plate" }
  ],
  "scenes": [
    {
      "id": "s1",
      "title": "short scene title",
      "action": "1-2 sentences describing what happens",
      "imagePrompt": "detailed 30-60 word prompt for generating the keyframe — refer to the characters and environment naturally, do not invent new ones",
      "videoPrompt": "30-50 word prompt describing the motion/camera movement for video generation",
      "characterIds": ["c1"],
      "environmentId": "e1",
      "duration": "5"
    }
  ]
}

Rules:
- Reuse the same character/environment IDs across scenes when the same person or place recurs.
- Duration is one of: "4", "5", "6", "8", "10".
- Keep environments to 1-3 distinct locations unless the story clearly needs more.
- Keep characters to 1-4 unless the story clearly needs more.
- Image prompts should be cinematic and specific; describe clothing, framing, lighting, mood.`;

export async function analyzeScenario(concept: string): Promise<{
  title: string;
  characters: CharacterRef[];
  environments: EnvironmentRef[];
  scenes: SmartScene[];
}> {
  const raw = await runOpenRouter(concept, {
    system_prompt: ANALYZE_SYSTEM,
    model: "anthropic/claude-opus-4-6",
    max_tokens: 4096,
  });
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Scenario agent returned no JSON");
  const parsed = JSON.parse(match[0]);

  const characters: CharacterRef[] = (parsed.characters || []).map((c: { id: string; name: string; description: string }) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: "pending" as const,
  }));

  const environments: EnvironmentRef[] = (parsed.environments || []).map((e: { id: string; name: string; description: string }) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    status: "pending" as const,
  }));

  const scenes: SmartScene[] = (parsed.scenes || []).map((s: {
    id: string; title: string; action: string; imagePrompt: string;
    videoPrompt: string; characterIds?: string[]; environmentId?: string | null; duration?: string;
  }, i: number) => ({
    id: s.id,
    index: i,
    title: s.title,
    action: s.action,
    imagePrompt: s.imagePrompt,
    videoPrompt: s.videoPrompt,
    characterIds: s.characterIds || [],
    environmentId: s.environmentId || null,
    duration: (s.duration as SmartScene["duration"]) || "5",
    status: "pending" as const,
  }));

  return {
    title: parsed.title || "Untitled Scenario",
    characters,
    environments,
    scenes,
  };
}

// ─── Reference image generation (Nano Banana) ──────────────

export async function generateReferenceImage(
  description: string,
  kind: "character" | "environment",
): Promise<string> {
  const fal = getFal();
  const prompt =
    kind === "character"
      ? `Cinematic portrait reference sheet. ${description} Full body, clean neutral background, soft studio lighting, photorealistic, detailed features, sharp focus. Used as a reference for later scenes — face and clothing must be clearly visible.`
      : `Cinematic environment reference plate. ${description} Establishing wide shot, no people visible, photorealistic, clean composition, 16:9 aspect ratio.`;

  const result = await fal.subscribe("fal-ai/gemini-3.1-flash-image-preview", {
    input: {
      prompt,
      aspect_ratio: "16:9",
    },
  });
  const data = result.data as { images?: { url: string }[] };
  return data.images?.[0]?.url || "";
}

// ─── Scene keyframe (reference-aware via NB2 edit) ──────────

export async function generateSceneKeyframe(
  scene: SmartScene,
  characters: CharacterRef[],
  environments: EnvironmentRef[],
): Promise<string> {
  const fal = getFal();

  // Collect reference image URLs
  const refUrls: string[] = [];
  const charactersInScene = characters.filter((c) => scene.characterIds.includes(c.id));
  charactersInScene.forEach((c) => c.imageUrl && refUrls.push(c.imageUrl));
  const env = environments.find((e) => e.id === scene.environmentId);
  if (env?.imageUrl) refUrls.push(env.imageUrl);

  if (refUrls.length === 0) {
    // No references — plain text-to-image
    const result = await fal.subscribe("fal-ai/gemini-3.1-flash-image-preview", {
      input: { prompt: scene.imagePrompt, aspect_ratio: "16:9" },
    });
    return (result.data as { images?: { url: string }[] }).images?.[0]?.url || "";
  }

  // Use Seedream Edit with references
  const refList = charactersInScene
    .map((c, i) => `Figure ${i + 1}: ${c.name}`)
    .join(", ");
  const envRef = env ? ` The setting is: ${env.name}.` : "";
  const prompt = `Compose a cinematic scene using the provided reference images. ${refList ? `Keep each character's exact appearance from the reference: ${refList}.${envRef}` : envRef} ${scene.imagePrompt} Photorealistic, 16:9 widescreen.`;

  const result = await fal.subscribe("fal-ai/bytedance/seedream/v5/lite/edit", {
    input: {
      image_urls: refUrls,
      prompt,
      image_size: "auto_2K",
      num_images: 1,
    },
  });
  return (result.data as { images?: { url: string }[] }).images?.[0]?.url || "";
}

// ─── Scene video (image-to-video) ───────────────────────────

export async function generateSceneVideo(
  scene: SmartScene,
  imageUrl: string,
): Promise<string> {
  const fal = getFal();
  const result = await fal.subscribe("bytedance/seedance-2.0/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt: scene.videoPrompt,
      resolution: "720p",
      duration: scene.duration,
      aspect_ratio: "16:9",
      generate_audio: true,
    },
  });
  return (result.data as { video: { url: string } }).video?.url || "";
}

// ─── Revise scene (LLM updates a specific scene with feedback) ──

const REVISE_SYSTEM = `You are a film director revising ONE scene of a scenario based on user feedback. Return only the revised scene JSON matching the SmartScene shape (same keys, keep the id and index). Preserve characterIds and environmentId if still appropriate, otherwise update them. Keep the revision focused — don't redesign the whole scenario.`;

export async function reviseScene(
  scene: SmartScene,
  feedback: string,
  characters: CharacterRef[],
  environments: EnvironmentRef[],
): Promise<SmartScene> {
  const context = JSON.stringify({
    scene: {
      id: scene.id,
      index: scene.index,
      title: scene.title,
      action: scene.action,
      imagePrompt: scene.imagePrompt,
      videoPrompt: scene.videoPrompt,
      characterIds: scene.characterIds,
      environmentId: scene.environmentId,
      duration: scene.duration,
    },
    availableCharacters: characters.map((c) => ({ id: c.id, name: c.name })),
    availableEnvironments: environments.map((e) => ({ id: e.id, name: e.name })),
    feedback,
  });

  const raw = await runOpenRouter(context, {
    system_prompt: REVISE_SYSTEM,
    model: "anthropic/claude-opus-4-6",
    max_tokens: 1024,
  });
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Revision returned no JSON");
  const parsed = JSON.parse(match[0]);

  return {
    ...scene,
    title: parsed.title || scene.title,
    action: parsed.action || scene.action,
    imagePrompt: parsed.imagePrompt || scene.imagePrompt,
    videoPrompt: parsed.videoPrompt || scene.videoPrompt,
    characterIds: parsed.characterIds || scene.characterIds,
    environmentId: parsed.environmentId ?? scene.environmentId,
    duration: (parsed.duration as SmartScene["duration"]) || scene.duration,
    // Reset generated artifacts so the user can re-generate with the new prompt
    imageUrl: undefined,
    videoUrl: undefined,
    status: "pending",
  };
}

// ─── Video merging ──────────────────────────────────────────

export async function mergeSceneVideos(videoUrls: string[]): Promise<string> {
  if (videoUrls.length === 0) throw new Error("No videos to merge");
  if (videoUrls.length === 1) return videoUrls[0];

  const fal = getFal();
  const result = await fal.subscribe("fal-ai/ffmpeg-api/merge-videos", {
    input: { video_urls: videoUrls },
  });
  return (result.data as { video: { url: string } }).video?.url || "";
}
