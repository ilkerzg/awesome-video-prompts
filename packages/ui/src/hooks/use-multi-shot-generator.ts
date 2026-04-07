import { useState, useCallback, useRef } from "react";
import { getFalApiKey } from "@workspace/ui/lib/fal-api-utils";
import { callLlmRouter } from "@workspace/ui/lib/openrouter-utils";

// ── Types ──────────────────────────────────────────────

export interface ShotPrompt {
  shot_number: number;
  prompt: string;
  duration: string;
  references: string[];
}

export interface ReferenceImageRole {
  tag: string;
  role: string;
  purpose: string;
  used_in_shots: number[];
}

export interface MultiShotPrompts {
  shots: ShotPrompt[];
  total_duration: string;
  base_image_prompt: string;
  reference_image_prompts: string[];
  reference_image_roles: ReferenceImageRole[];
}

export type PipelineStage =
  | "idle"
  | "generating-prompts"
  | "uploading-files"
  | "generating-images"
  | "generating-video"
  | "complete"
  | "error";

export type LlmModel =
  | "anthropic/claude-sonnet-4.6"
  | "google/gemini-3-flash-preview"
  | "google/gemini-3.1-pro-preview"
  | "openai/gpt-5.4-mini";

export interface LlmModelOption {
  id: LlmModel;
  label: string;
}

export const LLM_MODELS: LlmModelOption[] = [
  { id: "anthropic/claude-sonnet-4.6", label: "Sonnet 4.6" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini" },
];

export type ImageModelId =
  | "nano-banana-pro"
  | "nano-banana-2"
  | "seedream-v5-lite";

export interface ImageModelConfig {
  id: ImageModelId;
  label: string;
  t2i: string; // fal endpoint for text-to-image
  edit: string; // fal endpoint for image editing
}

export const IMAGE_MODELS: ImageModelConfig[] = [
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    t2i: "fal-ai/nano-banana-pro",
    edit: "fal-ai/nano-banana-pro/edit",
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    t2i: "fal-ai/nano-banana-2",
    edit: "fal-ai/nano-banana-2/edit",
  },
  {
    id: "seedream-v5-lite",
    label: "Seedream v5 Lite",
    t2i: "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    edit: "fal-ai/bytedance/seedream/v5/lite/edit",
  },
];

export type VideoModelId = "seedance-2" | "kling-v3";

export interface VideoModelConfig {
  id: VideoModelId;
  label: string;
  endpoint: string;
  requiresStartImage: boolean;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: "seedance-2",
    label: "Seedance 2.0",
    endpoint: "bytedance/seedance-2.0/reference-to-video",
    requiresStartImage: false,
  },
  {
    id: "kling-v3",
    label: "Kling v3 Pro",
    endpoint: "fal-ai/kling-video/v3/pro/image-to-video",
    requiresStartImage: true,
  },
];

export interface MultiShotConfig {
  sceneDescription: string;
  llmModel: LlmModel;
  referenceImage: File | null;
  referenceImageUrl: string;
  referenceVideoFile: File | null;
  referenceAudioFile: File | null;
  additionalImageCount: number;
  imageModelId: ImageModelId;
  videoModelId: VideoModelId;
  videoDuration: string;
  videoAspectRatio: string;
  generateAudio: boolean;
}

export interface PipelineState {
  stage: PipelineStage;
  prompts: MultiShotPrompts | null;
  generatedImageUrls: string[];
  generatedStartImageUrl: string | null;
  uploadedRefImageUrl: string | null;
  uploadedRefVideoUrl: string | null;
  uploadedRefAudioUrl: string | null;
  videoUrl: string | null;
  error: string | null;
  stageMessage: string;
}

// ── System Prompt Builder ──────────────────────────────
const MAX_SHOT_COUNT = 4;
const MAX_TOTAL_DURATION = 15;
const MAX_SHOT_PROMPT_CHARS_KLING = 480; // Kling v3 hard limit is 512 — leave safety margin
const MAX_SHOT_PROMPT_CHARS_SEEDANCE = 700;
const MAX_BASE_IMAGE_PROMPT_CHARS = 500;
const MAX_REFERENCE_IMAGE_PROMPT_CHARS = 320;
const PLANNER_ATTEMPTS = 3;

interface MultiShotConstraints {
  videoModelId: VideoModelId;
  hasUserImage: boolean;
  hasReferenceVideo: boolean;
  hasReferenceAudio: boolean;
  generatedReferenceCount: number;
  generatedReferenceStartIndex: number;
  fixedTotalDuration: number | null;
  totalDurationMin: number;
  totalDurationMax: number;
  shotCountMin: number;
  shotCountMax: number;
  shotDurationMin: number;
  shotDurationMax: number;
  maxShotPromptChars: number;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0)
    return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function getGeneratedImageTags(constraints: MultiShotConstraints): string[] {
  return Array.from(
    { length: constraints.generatedReferenceCount },
    (_, index) => `@Image${constraints.generatedReferenceStartIndex + index}`,
  );
}

function getAvailableReferenceTags(
  constraints: MultiShotConstraints,
): string[] {
  const tags = [...getGeneratedImageTags(constraints)];
  if (constraints.hasUserImage) tags.unshift("@Image1");
  if (constraints.hasReferenceVideo && constraints.videoModelId !== "kling-v3")
    tags.push("@Video1");
  if (constraints.hasReferenceAudio && constraints.videoModelId !== "kling-v3")
    tags.push("@Audio1");
  return tags;
}

function collectPromptRefs(text: string): string[] {
  const matches = text.match(/@(?:Image|Element|Video|Audio)\d+/g) || [];
  return [...new Set(matches)];
}

function extractErrorMessage(err: any): string {
  // Fal API errors: { body: { detail: [{ msg, type, loc }] } }
  const detail = err?.body?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const msg = first?.msg || first?.message || '';
    const type = first?.type || '';
    const loc = Array.isArray(first?.loc) ? first.loc.join(' > ') : '';
    const parts = [msg, type !== 'value_error' && type ? `(${type})` : '', loc ? `[${loc}]` : ''].filter(Boolean);
    return parts.join(' ');
  }
  // Fal API errors: { detail: [{ msg }] } (direct)
  if (Array.isArray(err?.detail)) {
    const msg = err.detail[0]?.msg;
    if (msg) return msg;
  }
  // Standard Error object
  if (err instanceof Error && err.message && err.message !== 'ValidationError') {
    return err.message;
  }
  // Error with body.message
  if (err?.body?.message) return err.body.message;
  // Stringify as fallback
  if (typeof err === 'string') return err;
  try {
    const str = JSON.stringify(err, null, 2);
    if (str && str !== '{}') return str.slice(0, 500);
  } catch {}
  return 'Pipeline failed. Please try again.';
}

function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function buildConstraints(config: MultiShotConfig): MultiShotConstraints {
  const fixedTotalDuration =
    config.videoDuration === "auto"
      ? null
      : parsePositiveInt(config.videoDuration);

  const hasUserImage = !!(
    config.referenceImage || config.referenceImageUrl.trim()
  );
  const shotDurationMin = config.videoModelId === "kling-v3" ? 3 : 1;

  let shotCountMin =
    config.videoModelId === "kling-v3" &&
    fixedTotalDuration !== null &&
    fixedTotalDuration < 6
      ? 1
      : 2;
  let shotCountMax = MAX_SHOT_COUNT;

  if (fixedTotalDuration !== null) {
    shotCountMax = Math.min(
      MAX_SHOT_COUNT,
      Math.max(1, Math.floor(fixedTotalDuration / shotDurationMin)),
    );
    shotCountMin = Math.min(shotCountMin, shotCountMax);
  }

  const totalDurationMin =
    fixedTotalDuration ??
    (config.videoModelId === "kling-v3"
      ? Math.max(shotCountMin * shotDurationMin, 6)
      : 4);

  return {
    videoModelId: config.videoModelId,
    hasUserImage,
    hasReferenceVideo: !!config.referenceVideoFile,
    hasReferenceAudio: !!config.referenceAudioFile,
    generatedReferenceCount: config.additionalImageCount,
    generatedReferenceStartIndex: hasUserImage ? 2 : 1,
    fixedTotalDuration,
    totalDurationMin,
    totalDurationMax: fixedTotalDuration ?? MAX_TOTAL_DURATION,
    shotCountMin,
    shotCountMax,
    shotDurationMin,
    shotDurationMax: fixedTotalDuration ?? MAX_TOTAL_DURATION,
    maxShotPromptChars: config.videoModelId === 'kling-v3' ? MAX_SHOT_PROMPT_CHARS_KLING : MAX_SHOT_PROMPT_CHARS_SEEDANCE,
  };
}

function normalizePlan(
  raw: any,
  constraints: MultiShotConstraints,
): MultiShotPrompts {
  const shots = Array.isArray(raw?.shots)
    ? raw.shots
        .map((shot: any, index: number) => {
          const prompt =
            typeof shot?.prompt === "string"
              ? normalizeWhitespace(shot.prompt)
              : "";
          const promptRefs = collectPromptRefs(prompt);
          const references = Array.isArray(shot?.references)
            ? [
                ...new Set(
                  shot.references
                    .map((ref: unknown) =>
                      typeof ref === "string" ? ref.trim() : "",
                    )
                    .filter(Boolean),
                ),
              ]
            : promptRefs;

          return {
            shot_number: index + 1,
            prompt,
            duration: String(parsePositiveInt(shot?.duration) ?? ""),
            references,
          };
        })
        .filter((shot: ShotPrompt) => shot.prompt.length > 0)
    : [];

  const totalDuration = String(
    parsePositiveInt(raw?.total_duration) ??
      shots.reduce(
        (sum: number, shot: ShotPrompt) =>
          sum + (parsePositiveInt(shot.duration) ?? 0),
        0,
      ),
  );

  const referenceImagePrompts = Array.isArray(raw?.reference_image_prompts)
    ? raw.reference_image_prompts
        .map((prompt: unknown) =>
          typeof prompt === "string" ? normalizeWhitespace(prompt) : "",
        )
        .filter(Boolean)
    : [];

  const referenceImageRoles = Array.isArray(raw?.reference_image_roles)
    ? raw.reference_image_roles.map((role: any) => ({
        tag: typeof role?.tag === "string" ? role.tag.trim() : "",
        role:
          typeof role?.role === "string" ? normalizeWhitespace(role.role) : "",
        purpose:
          typeof role?.purpose === "string"
            ? normalizeWhitespace(role.purpose)
            : "",
        used_in_shots: Array.isArray(role?.used_in_shots)
          ? [
              ...new Set(
                role.used_in_shots
                  .map((value: unknown) => parsePositiveInt(value))
                  .filter(
                    (value: number | null): value is number => value !== null,
                  ),
              ),
            ]
          : [],
      }))
    : [];

  return {
    shots,
    total_duration: totalDuration,
    base_image_prompt:
      typeof raw?.base_image_prompt === "string"
        ? normalizeWhitespace(raw.base_image_prompt)
        : "",
    reference_image_prompts: referenceImagePrompts,
    reference_image_roles: referenceImageRoles,
  };
}

function validatePlan(
  plan: MultiShotPrompts,
  constraints: MultiShotConstraints,
): string[] {
  const errors: string[] = [];
  const durations = plan.shots.map((shot) => parsePositiveInt(shot.duration));
  const durationValues = durations.filter(
    (value): value is number => value !== null,
  );
  const totalDuration = parsePositiveInt(plan.total_duration);
  const expectedGeneratedTags = getGeneratedImageTags(constraints);
  const allowedRefs = new Set(getAvailableReferenceTags(constraints));

  if (
    plan.shots.length < constraints.shotCountMin ||
    plan.shots.length > constraints.shotCountMax
  ) {
    errors.push(
      `Shot count must be between ${constraints.shotCountMin} and ${constraints.shotCountMax}.`,
    );
  }

  if (durationValues.length !== plan.shots.length) {
    errors.push("Every shot must have a valid integer duration.");
  }

  plan.shots.forEach((shot, index) => {
    if (shot.shot_number !== index + 1) {
      errors.push("Shot numbers must be sequential starting at 1.");
    }
    if (shot.prompt.length === 0) {
      errors.push(`Shot ${index + 1} is missing a prompt.`);
    }
    if (shot.prompt.length > constraints.maxShotPromptChars) {
      errors.push(`Shot ${index + 1} prompt is too long.`);
    }

    const shotDuration = parsePositiveInt(shot.duration);
    if (shotDuration === null) return;
    if (shotDuration < constraints.shotDurationMin) {
      errors.push(
        `Shot ${index + 1} duration must be at least ${constraints.shotDurationMin}s.`,
      );
    }
    if (shotDuration > constraints.shotDurationMax) {
      errors.push(
        `Shot ${index + 1} duration must not exceed ${constraints.shotDurationMax}s.`,
      );
    }

    const promptRefs = collectPromptRefs(shot.prompt);
    const referenceSet = new Set(shot.references);

    if (
      promptRefs.some((ref) => !referenceSet.has(ref)) ||
      shot.references.some((ref) => !promptRefs.includes(ref))
    ) {
      errors.push(
        `Shot ${index + 1} references must exactly match the tags used inside the prompt text.`,
      );
    }

    if (shot.references.some((ref) => !allowedRefs.has(ref))) {
      errors.push(`Shot ${index + 1} contains an unavailable reference tag.`);
    }
  });

  if (plan.base_image_prompt.length === 0) {
    errors.push("base_image_prompt is required.");
  } else if (plan.base_image_prompt.length > MAX_BASE_IMAGE_PROMPT_CHARS) {
    errors.push("base_image_prompt is too long.");
  }

  if (totalDuration === null) {
    errors.push("total_duration must be a valid integer string.");
  } else {
    const summedDurations = durationValues.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    if (summedDurations !== totalDuration) {
      errors.push(
        `total_duration must equal the sum of shot durations (${summedDurations}).`,
      );
    }
    if (
      constraints.fixedTotalDuration !== null &&
      totalDuration !== constraints.fixedTotalDuration
    ) {
      errors.push(
        `total_duration must equal ${constraints.fixedTotalDuration}.`,
      );
    }
    if (
      constraints.fixedTotalDuration === null &&
      (totalDuration < constraints.totalDurationMin ||
        totalDuration > constraints.totalDurationMax)
    ) {
      errors.push(
        `total_duration must be between ${constraints.totalDurationMin} and ${constraints.totalDurationMax}.`,
      );
    }
  }

  if (
    plan.reference_image_prompts.length !== constraints.generatedReferenceCount
  ) {
    errors.push(
      `reference_image_prompts must contain exactly ${constraints.generatedReferenceCount} entries.`,
    );
  }

  if (
    plan.reference_image_prompts.some(
      (prompt) => prompt.length > MAX_REFERENCE_IMAGE_PROMPT_CHARS,
    )
  ) {
    errors.push(
      `Each reference_image_prompt must be under ${MAX_REFERENCE_IMAGE_PROMPT_CHARS} characters.`,
    );
  }

  if (
    plan.reference_image_roles.length !== constraints.generatedReferenceCount
  ) {
    errors.push(
      `reference_image_roles must contain exactly ${constraints.generatedReferenceCount} entries.`,
    );
  } else {
    const uniqueRoles = new Set<string>();
    plan.reference_image_roles.forEach((role, index) => {
      const expectedTag = expectedGeneratedTags[index];
      if (role.tag !== expectedTag) {
        errors.push(
          `reference_image_roles[${index}] must use tag ${expectedTag}.`,
        );
      }
      if (!role.role || !role.purpose) {
        errors.push(
          `reference_image_roles[${index}] must include both role and purpose.`,
        );
      }
      if (
        role.used_in_shots.some(
          (shotNumber) => shotNumber < 1 || shotNumber > plan.shots.length,
        )
      ) {
        errors.push(
          `reference_image_roles[${index}] includes an invalid shot number.`,
        );
      }
      uniqueRoles.add(role.role.toLowerCase());
    });
    if (uniqueRoles.size !== plan.reference_image_roles.length) {
      errors.push(
        "Each generated reference image should have a distinct role.",
      );
    }
  }

  const imageRefsUsed = new Set(
    plan.shots.flatMap((shot) =>
      shot.references.filter((ref) => ref.startsWith("@Image")),
    ),
  );

  // Reference usage is guided by the system prompt as a preference,
  // not enforced as a hard validation error that blocks generation.

  return [...new Set(errors)];
}

function buildSystemPrompt(constraints: MultiShotConstraints): string {
  const isSeedance = constraints.videoModelId !== "kling-v3";
  const generatedTags = getGeneratedImageTags(constraints);
  const generatedRangeLabel =
    generatedTags.length > 0 ? generatedTags.join(", ") : "none";

  const referenceSection =
    constraints.generatedReferenceCount > 0
      ? `
## Reference Asset Strategy

You must generate exactly ${constraints.generatedReferenceCount} reference image prompt(s) for the following actual tags: ${generatedRangeLabel}.

${
  constraints.hasUserImage
    ? `The user already supplied the canonical source image as @Image1. Treat @Image1 as the main identity/continuity anchor. Your generated prompts are for complementary variations only: new angle, staging, environment lock, prop detail, or climax composition. Do NOT mentally remap them to @Image1.`
    : `No source image was supplied. ${generatedTags[0] ? `${generatedTags[0]} must become the primary hero/master anchor for the subject and opening frame.` : "There are no generated image slots."} Any remaining generated images should solve different continuity problems rather than duplicating the same frame.`
}

Design generated references in priority order:
1. Hero or identity lock.
2. World or environment lock.
3. Key prop, supporting subject, or interaction detail.
4. Climax, mood, or composition lock.

Each generated reference must have a distinct role and practical value inside the sequence. Avoid near-duplicates.
Each reference prompt must be under ${MAX_REFERENCE_IMAGE_PROMPT_CHARS} characters.
`
      : `
## Reference Asset Strategy

No generated reference image prompts are requested for this run.
`;

  const externalRefsSection = !isSeedance
    ? ""
    : `
## External Conditioning Assets

${constraints.hasReferenceVideo ? "- A reference video is available as @Video1. Use it only if motion style or camera rhythm should be borrowed." : "- No reference video is available."}
${constraints.hasReferenceAudio ? "- A reference audio file is available as @Audio1. Use it only if rhythm, vocal sync, or mood timing materially improves the result." : "- No reference audio is available."}
`;

  const durationRule =
    constraints.fixedTotalDuration !== null
      ? `Use exactly ${constraints.fixedTotalDuration} seconds total.`
      : `Choose the strongest total duration between ${constraints.totalDurationMin} and ${constraints.totalDurationMax} seconds.`;

  const shotCountRule =
    constraints.shotCountMin === constraints.shotCountMax
      ? `Use exactly ${constraints.shotCountMin} shot(s).`
      : `Choose between ${constraints.shotCountMin} and ${constraints.shotCountMax} shots. Prefer fewer stronger shots over filler.`;

  const strategySection = isSeedance
    ? `## Seedance Strategy

Seedance uses one merged prompt. Treat each shot as an editorial beat that will later be concatenated into one flowing cinematic paragraph.
When writing shot 2+, keep continuity and motion bridges natural. Avoid robotic transition labels.

**CRITICAL RESTRICTION**: Seedance 2.0 currently blocks content containing recognizable human faces or likenesses. Do NOT write prompts featuring close-ups of human faces, named real people, or realistic human portraits. Instead focus on: silhouettes, backs of heads, masked/helmeted figures, wide shots where faces are small, animals, objects, landscapes, fantasy creatures, or stylized/animated characters. If the user's scene involves people, frame them from behind, in silhouette, or at enough distance that facial features are not discernible.`
    : `## Kling Strategy

Kling uses \`multi_prompt\`. Each shot is an actual timed segment with its own prompt and duration.
Every shot duration must be at least ${constraints.shotDurationMin} seconds.
Each shot prompt is sent separately to the API — write self-contained cinematic beats while preserving continuity.
**CRITICAL: Each shot prompt has a HARD limit of ${constraints.maxShotPromptChars} characters. Count carefully. Exceeding this will cause an API error.**`;

  const referenceRolesField =
    constraints.generatedReferenceCount > 0
      ? `,"reference_image_roles":[{"tag":"${generatedTags[0]}","role":"hero anchor","purpose":"What continuity problem this image solves","used_in_shots":[1]}]`
      : `,"reference_image_roles":[]`;

  return `You are an elite cinematic director and AI video prompt engineer.

Privately perform a planning pass before writing:
1. Extract the story beats, subject continuity needs, and visual anchor opportunities.
2. Decide the optimal shot count from the allowed range.
3. Allocate durations to maximize impact and fit the duration budget.
4. Decide which references should anchor which shots.
5. Only then write the final JSON.

${strategySection}

## Creative Policy

- Think in cinematic beats, not filler shots.
- Use escalating visual contrast across the sequence: framing, motion, scale, or lighting.
- Maintain continuity of subject state, gaze, costume, environment, and motion direction.
- If references exist, use them intentionally as conditioning anchors, not decorative mentions.
- Keep prompts vivid, camera-literate, and production-ready.

## Hard Constraints

- ${shotCountRule}
- ${durationRule}
- total_duration must equal the sum of all shot durations.
- Each shot duration must be at least ${constraints.shotDurationMin} second(s).
- All prompts must be in English.
- Each shot prompt must stay under ${constraints.maxShotPromptChars} characters. This is a HARD API limit — prompts exceeding this WILL be rejected.
- base_image_prompt must stay under ${MAX_BASE_IMAGE_PROMPT_CHARS} characters.
- No markdown. No commentary. JSON only.

${referenceSection}
${externalRefsSection}

## Shot Writing Rules

Each shot prompt should include:
- Subject state and action.
- Camera language: framing, motion, lens feel, or viewpoint.
- Light and atmosphere.
- What changes during the beat.
- A clear handoff into the next beat when continuity matters.

No "Shot 1:" labels inside prompts. No meta commentary.

## Output Format

Respond with exactly this JSON shape:

{"shots":[{"shot_number":1,"prompt":"...","duration":"4","references":["@Image1"]}],"total_duration":"4","base_image_prompt":"..."${constraints.generatedReferenceCount > 0 ? `,"reference_image_prompts":["prompt1"]` : `,"reference_image_prompts":[]`}${referenceRolesField}}
`;
}

function buildPlannerUserPrompt(
  sceneDescription: string,
  constraints: MultiShotConstraints,
): string {
  const generatedTags = getGeneratedImageTags(constraints);
  const durationBudget =
    constraints.fixedTotalDuration !== null
      ? `${constraints.fixedTotalDuration}s fixed total`
      : `${constraints.totalDurationMin}-${constraints.totalDurationMax}s flexible total`;

  return `Scene brief:
${sceneDescription.trim()}

Execution context:
- Video model: ${constraints.videoModelId}
- Duration budget: ${durationBudget}
- Allowed shot count: ${constraints.shotCountMin}-${constraints.shotCountMax}
- Minimum shot duration: ${constraints.shotDurationMin}s
- User source image present: ${constraints.hasUserImage ? "yes, available as @Image1" : "no"}
- Generated reference image slots: ${generatedTags.length > 0 ? generatedTags.join(", ") : "none"}
- Reference video present: ${constraints.hasReferenceVideo ? "yes, available as @Video1" : "no"}
- Reference audio present: ${constraints.hasReferenceAudio ? "yes, available as @Audio1" : "no"}

Planning preference:
- Use 2 shots for a simple reveal/payoff arc.
- Use 3 shots for setup/escalation/payoff.
- Use 4 shots only when the scene clearly supports multiple distinct cinematic beats.
- Make generated references complementary and reusable across the sequence.
- If no user image exists and generated references are available, make the first generated image the main visual continuity anchor.
`;
}

function buildRepairUserPrompt(
  sceneDescription: string,
  previousOutput: string,
  errors: string[],
): string {
  return `Repair the JSON plan below for this same scene brief:

${sceneDescription.trim()}

Validation errors:
${errors.map((error) => `- ${error}`).join("\n")}

Keep the strongest cinematic ideas, but correct every constraint violation.
Return corrected JSON only.

Previous JSON:
${previousOutput}`;
}

// ── Hook ───────────────────────────────────────────────

export function useMultiShotPipeline() {
  const [state, setState] = useState<PipelineState>({
    stage: "idle",
    prompts: null,
    generatedImageUrls: [],
    generatedStartImageUrl: null,
    uploadedRefImageUrl: null,
    uploadedRefVideoUrl: null,
    uploadedRefAudioUrl: null,
    videoUrl: null,
    error: null,
    stageMessage: "",
  });

  const abortRef = useRef(false);
  const activeRunRef = useRef(0);

  const updateState = useCallback((patch: Partial<PipelineState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const isRunActive = useCallback((runId: number) => {
    return !abortRef.current && activeRunRef.current === runId;
  }, []);

  const safeUpdateState = useCallback(
    (runId: number, patch: Partial<PipelineState>) => {
      if (isRunActive(runId)) {
        updateState(patch);
      }
    },
    [isRunActive, updateState],
  );

  // Upload a file to fal storage
  const uploadToFal = useCallback(async (file: File): Promise<string> => {
    const { fal } = await import("@fal-ai/client");
    const apiKey = getFalApiKey();
    if (!apiKey) throw new Error("FAL API key required");
    fal.config({ credentials: apiKey });
    const url = await (fal as any).storage.upload(file);
    return url;
  }, []);

  // Generate images via fal
  const generateImage = useCallback(
    async (
      prompt: string,
      imageModel: ImageModelConfig,
      sourceImageUrl?: string | null,
    ): Promise<string | null> => {
      const { fal } = await import("@fal-ai/client");
      const apiKey = getFalApiKey();
      if (!apiKey) throw new Error("FAL API key required");
      fal.config({ credentials: apiKey });

      const isEdit = !!sourceImageUrl;
      const endpoint = isEdit ? imageModel.edit : imageModel.t2i;

      const input: any = { prompt };

      if (isEdit) {
        input.image_urls = [sourceImageUrl];
      }

      // Seedream v5 Lite edit uses image_size instead of aspect_ratio
      if (!isEdit) {
        input.aspect_ratio = "16:9";
      }

      const result = await (fal as any).subscribe(endpoint, {
        input,
        logs: true,
      });

      const images = result?.data?.images || result?.images;
      if (images && images.length > 0) {
        return images[0].url;
      }
      return null;
    },
    [],
  );

  const generatePlan = useCallback(
    async (
      config: MultiShotConfig,
      constraints: MultiShotConstraints,
    ): Promise<MultiShotPrompts> => {
      const systemPrompt = buildSystemPrompt(constraints);
      let previousOutput = "";
      let validationErrors: string[] = [];

      for (let attempt = 1; attempt <= PLANNER_ATTEMPTS; attempt++) {
        const userPrompt =
          attempt === 1
            ? buildPlannerUserPrompt(config.sceneDescription, constraints)
            : buildRepairUserPrompt(
                config.sceneDescription,
                previousOutput,
                validationErrors,
              );

        const llmOutput = await callLlmRouter({
          model: config.llmModel,
          systemPrompt,
          userPrompt,
          temperature: attempt === 1 ? 0.95 : 0.2,
        });

        previousOutput = llmOutput;

        const rawPlan = extractJsonObject(llmOutput);
        if (!rawPlan) {
          validationErrors = ["Response was not valid JSON."];
          continue;
        }

        const normalizedPlan = normalizePlan(rawPlan, constraints);
        validationErrors = validatePlan(normalizedPlan, constraints);

        if (validationErrors.length === 0) {
          return normalizedPlan;
        }
      }

      throw new Error(
        validationErrors.length > 0
          ? `Planner could not produce a valid multi-shot plan: ${validationErrors[0]}`
          : "Planner could not produce a valid multi-shot plan.",
      );
    },
    [],
  );

  // ── Run Pipeline ─────────────────────────────────────

  const runPipeline = useCallback(
    async (config: MultiShotConfig) => {
      const runId = activeRunRef.current + 1;
      activeRunRef.current = runId;
      abortRef.current = false;

      // Validate FAL key (used for both LLM and image/video generation)
      const falKey = getFalApiKey();
      if (!falKey) {
        updateState({
          stage: "error",
          error: "Please set your FAL API key (key icon in header).",
        });
        return;
      }
      if (!config.sceneDescription.trim()) {
        updateState({ stage: "error", error: "Please describe your scene." });
        return;
      }

      const imageModel =
        IMAGE_MODELS.find((m) => m.id === config.imageModelId) ??
        IMAGE_MODELS[0]!;
      const videoModel =
        VIDEO_MODELS.find((m) => m.id === config.videoModelId) ??
        VIDEO_MODELS[0]!;
      const constraints = buildConstraints(config);

      try {
        // ── Stage 1: Upload user files ─────────────────
        let refImageUrl: string | null = null;
        let refVideoUrl: string | null = null;
        let refAudioUrl: string | null = null;

        if (
          config.referenceImage ||
          config.referenceImageUrl.trim() ||
          config.referenceVideoFile ||
          config.referenceAudioFile
        ) {
          safeUpdateState(runId, {
            stage: "uploading-files",
            stageMessage: "Uploading reference files...",
            error: null,
            prompts: null,
            generatedImageUrls: [],
            generatedStartImageUrl: null,
            videoUrl: null,
            uploadedRefImageUrl: null,
            uploadedRefVideoUrl: null,
            uploadedRefAudioUrl: null,
          });

          if (config.referenceImage) {
            refImageUrl = await uploadToFal(config.referenceImage);
          } else if (config.referenceImageUrl.trim()) {
            refImageUrl = config.referenceImageUrl.trim();
          }

          if (config.referenceVideoFile) {
            refVideoUrl = await uploadToFal(config.referenceVideoFile);
          }

          if (config.referenceAudioFile) {
            refAudioUrl = await uploadToFal(config.referenceAudioFile);
          }

          safeUpdateState(runId, {
            uploadedRefImageUrl: refImageUrl,
            uploadedRefVideoUrl: refVideoUrl,
            uploadedRefAudioUrl: refAudioUrl,
          });
        } else {
          safeUpdateState(runId, {
            error: null,
            prompts: null,
            generatedImageUrls: [],
            generatedStartImageUrl: null,
            videoUrl: null,
            uploadedRefImageUrl: null,
            uploadedRefVideoUrl: null,
            uploadedRefAudioUrl: null,
          });
        }

        if (!isRunActive(runId)) return;

        // ── Stage 2: Generate prompts via OpenRouter ───
        safeUpdateState(runId, {
          stage: "generating-prompts",
          stageMessage: `Planning shots with ${LLM_MODELS.find((m) => m.id === config.llmModel)?.label || config.llmModel}...`,
        });

        const prompts = await generatePlan(config, constraints);
        if (!isRunActive(runId)) return;
        safeUpdateState(runId, { prompts });

        // ── Stage 3: Generate reference images ─────────
        const refImagePrompts = prompts.reference_image_prompts;
        const generatedImageUrls: string[] = [];
        let generatedStartImageUrl: string | null = null;

        const needsGeneratedStartImage =
          config.videoModelId === "kling-v3" &&
          !refImageUrl &&
          refImagePrompts.length === 0;

        if (refImagePrompts.length > 0 || needsGeneratedStartImage) {
          safeUpdateState(runId, {
            stage: "generating-images",
            stageMessage:
              refImagePrompts.length > 0
                ? `Generating reference images (0/${refImagePrompts.length})...`
                : "Generating opening frame...",
          });

          for (let i = 0; i < refImagePrompts.length; i++) {
            if (!isRunActive(runId)) return;

            const referencePrompt = refImagePrompts[i];
            if (!referencePrompt) continue;

            safeUpdateState(runId, {
              stageMessage: `Generating reference image ${i + 1}/${refImagePrompts.length}...`,
            });

            try {
              const url = await generateImage(
                referencePrompt,
                imageModel,
                constraints.hasUserImage ? refImageUrl : null,
              );
              if (url && isRunActive(runId)) {
                generatedImageUrls.push(url);
                safeUpdateState(runId, {
                  generatedImageUrls: [...generatedImageUrls],
                });
              }
            } catch (err: any) {
              const imgError = extractErrorMessage(err);
              console.error(`Image ${i + 1} generation failed:`, imgError);
              safeUpdateState(runId, {
                stageMessage: `Image ${i + 1} failed: ${imgError.slice(0, 100)}... Continuing...`,
              });
              // Continue with other images
            }
          }

          if (needsGeneratedStartImage && isRunActive(runId)) {
            safeUpdateState(runId, {
              stageMessage:
                "Generating Kling start frame from the opening beat...",
            });

            generatedStartImageUrl = await generateImage(
              prompts.base_image_prompt,
              imageModel,
            );

            if (generatedStartImageUrl && isRunActive(runId)) {
              safeUpdateState(runId, { generatedStartImageUrl });
            }
          }
        }

        if (!isRunActive(runId)) return;

        // ── Stage 4: Generate video ─────────────────
        safeUpdateState(runId, {
          stage: "generating-video",
          stageMessage: `Generating video with ${videoModel.label}...`,
        });

        // Collect all image references
        const allImageUrls: string[] = [];
        if (refImageUrl) allImageUrls.push(refImageUrl);
        allImageUrls.push(...generatedImageUrls);

        const resolvedTotalDuration =
          constraints.fixedTotalDuration !== null
            ? String(constraints.fixedTotalDuration)
            : prompts.total_duration;

        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });

        let videoInput: any;
        let videoEndpoint: string;

        if (config.videoModelId === "kling-v3") {
          // ── Kling v3 Pro ──────────────────────────────
          // Required: start_image_url
          // Uses multi_prompt for multi-shot (NOT prompt — they conflict)
          // Elements: character/object refs → @Element1, @Element2 in prompts
          const startImage = allImageUrls[0] || generatedStartImageUrl;
          if (!startImage) {
            throw new Error(
              "Kling v3 requires a start frame. The planner could not produce one.",
            );
          }

          videoEndpoint = videoModel.endpoint;

          // ALL images become elements (including start_image) so @Image1 → @Element1 throughout.
          // Without this, @Image1 (the main character) would be stripped from prompts, leaving shots subjectless.
          const elementUrls = allImageUrls;
          const elementCount = elementUrls.length;

          // Convert LLM's @ImageN refs to Kling's @ElementN (1-to-1, no offset):
          // @Image1 → @Element1, @Image2 → @Element2, etc.
          const adaptKlingPrompt = (text: string) => {
            let result = text;
            result = result.replace(/@Image(\d+)/g, (_match, num) => {
              const n = Number.parseInt(num, 10);
              return n <= elementCount ? `@Element${n}` : "";
            });
            // Validate existing @ElementN references
            result = result.replace(/@Element(\d+)/g, (match, num) => {
              return Number.parseInt(num, 10) <= elementCount ? match : "";
            });
            return normalizeWhitespace(result);
          };

          // Hard-truncate any shot prompt that still exceeds 512 chars (Kling API hard limit)
          const truncateToLimit = (text: string, limit: number) => {
            if (text.length <= limit) return text;
            // Cut at last sentence boundary within limit
            const truncated = text.slice(0, limit);
            const lastPeriod = truncated.lastIndexOf('.');
            return lastPeriod > limit * 0.5 ? truncated.slice(0, lastPeriod + 1) : truncated;
          };

          videoInput = {
            start_image_url: startImage,
            duration: resolvedTotalDuration,
            cfg_scale: 0.5,
            negative_prompt:
              "blur, distort, low quality, shaky camera, cartoon, anime, text, watermark, deformed face, extra limbs",
            generate_audio: config.generateAudio,
            multi_prompt: prompts.shots.map((shot) => ({
              prompt: truncateToLimit(adaptKlingPrompt(shot.prompt), 512),
              duration: shot.duration,
            })),
            shot_type: "customize",
            elements: elementUrls.map((url) => ({
              frontal_image_url: url,
              reference_image_urls: [url],
            })),
          };
        } else {
          // ── Seedance 2.0 ──────────────────────────────
          // Pick the right endpoint based on available references:
          //   - No images, no video/audio refs → text-to-video
          //   - Single image, no other refs    → image-to-video
          //   - Multiple images or mixed refs  → reference-to-video
          const imgCount = allImageUrls.length;
          const hasVideoRef = !!refVideoUrl;
          const hasAudioRef = !!refAudioUrl;
          const hasMultiRef = imgCount > 1 || hasVideoRef || hasAudioRef;

          // Clean @refs that exceed available counts
          const cleanSeedancePrompt = (text: string) => {
            return normalizeWhitespace(
              text
                .replace(/@Image(\d+)/g, (match, num) =>
                  parseInt(num) <= imgCount ? match : "",
                )
                .replace(/@Video(\d+)/g, (match, num) =>
                  hasVideoRef && parseInt(num) === 1 ? match : "",
                )
                .replace(/@Audio(\d+)/g, (match, num) =>
                  hasAudioRef && parseInt(num) === 1 ? match : "",
                )
                .replace(/@Element\d+/g, ""),
            );
          };

          const combinedPrompt = prompts.shots
            .map((s) => {
              const cleaned = cleanSeedancePrompt(s.prompt).trim();
              return cleaned.replace(/\.+$/, "");
            })
            .filter(Boolean)
            .join(". ");

          if (hasMultiRef) {
            // reference-to-video: supports @Image, @Video, @Audio refs
            videoEndpoint = "bytedance/seedance-2.0/reference-to-video";
            videoInput = {
              prompt: combinedPrompt,
              duration: resolvedTotalDuration,
              aspect_ratio: config.videoAspectRatio,
              generate_audio: config.generateAudio,
            };
            if (imgCount > 0) videoInput.image_urls = allImageUrls.slice(0, 9);
            if (hasVideoRef) videoInput.video_urls = [refVideoUrl];
            if (hasAudioRef) videoInput.audio_urls = [refAudioUrl];
          } else if (imgCount === 1) {
            // image-to-video: single start image
            videoEndpoint = "bytedance/seedance-2.0/image-to-video";
            videoInput = {
              prompt: normalizeWhitespace(
                combinedPrompt.replace(/@Image\d+/g, ""),
              ),
              image_url: allImageUrls[0],
              duration: resolvedTotalDuration,
              aspect_ratio: config.videoAspectRatio,
              generate_audio: config.generateAudio,
            };
          } else {
            // text-to-video: no images at all
            videoEndpoint = "bytedance/seedance-2.0/text-to-video";
            videoInput = {
              prompt: combinedPrompt,
              duration: resolvedTotalDuration,
              aspect_ratio: config.videoAspectRatio,
              generate_audio: config.generateAudio,
            };
          }
        }

        // Try video generation with retry on content policy violations
        let videoUrl: string | null = null;
        const maxVideoRetries = 2;

        for (let videoAttempt = 0; videoAttempt < maxVideoRetries; videoAttempt++) {
          if (!isRunActive(runId)) return;

          try {
            const videoResult = await (fal as any).subscribe(videoEndpoint, {
              input: videoInput,
              logs: true,
            });

            videoUrl = videoResult?.data?.video?.url || videoResult?.video?.url || null;
            break; // Success — exit retry loop
          } catch (videoErr: any) {
            const errMsg = extractErrorMessage(videoErr);
            const isContentPolicy = errMsg.includes('content_policy_violation') ||
              errMsg.includes('sensitive content') ||
              errMsg.includes('partner_validation_failed') ||
              errMsg.includes('likenesses of real people');

            if (isContentPolicy && videoAttempt < maxVideoRetries - 1) {
              // Retry: disable audio (common cause of "Output audio has sensitive content")
              console.warn('Content policy violation — retrying with audio disabled...');
              videoInput.generate_audio = false;

              safeUpdateState(runId, {
                stageMessage: `Content policy issue — retrying without audio (attempt ${videoAttempt + 2}/${maxVideoRetries})...`,
              });
              continue;
            }
            throw videoErr; // Re-throw if not retryable or last attempt
          }
        }

        safeUpdateState(runId, {
          stage: "complete",
          videoUrl,
          stageMessage: "Pipeline complete!",
        });
      } catch (err: any) {
        console.error("Pipeline error:", err);
        if (activeRunRef.current === runId) {
          // Extract the most useful error message from fal/API errors
          const errorMessage = extractErrorMessage(err);
          updateState({
            stage: "error",
            error: errorMessage,
          });
        }
      }
    },
    [
      generateImage,
      generatePlan,
      isRunActive,
      safeUpdateState,
      updateState,
      uploadToFal,
    ],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    activeRunRef.current += 1;
    setState({
      stage: "idle",
      prompts: null,
      generatedImageUrls: [],
      generatedStartImageUrl: null,
      uploadedRefImageUrl: null,
      uploadedRefVideoUrl: null,
      uploadedRefAudioUrl: null,
      videoUrl: null,
      error: null,
      stageMessage: "",
    });
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    activeRunRef.current += 1;
  }, []);

  return { state, runPipeline, reset, abort };
}
