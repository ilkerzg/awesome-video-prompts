"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/topbar";
import { FalKeyGuard } from "@/components/fal-key-guard";
import { HowItWorks } from "@/components/how-it-works";
import {
  Loader2, Sparkles, AlertCircle, Check, RotateCcw, Play,
  Users, MapPin, Film, ChevronRight, Pencil, Square, Download, User,
} from "lucide-react";
import {
  analyzeScenario, generateReferenceImage, generateSceneKeyframe,
  generateSceneVideo, reviseScene, mergeSceneVideos,
  AGENT_STAGES, AGENT_STAGE_LABELS,
  type SmartScene, type CharacterRef, type EnvironmentRef, type AgentStage,
} from "@/lib/scenario-agent";
import { hasFalKey } from "@/lib/fal-client";

// ─── Small reusable components ──────────────────────────────

function RefCard({
  item: r,
  kind,
}: {
  item: CharacterRef | EnvironmentRef;
  kind: "character" | "environment";
}) {
  return (
    <div className={`overflow-hidden rounded-xl border p-2 ${
      r.status === "done"
        ? "border-[color:var(--border-soft)] bg-[color:var(--surface)]"
        : r.status === "generating"
        ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/5"
        : r.status === "failed"
        ? "border-red-500/20 bg-red-500/5"
        : "border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)]"
    }`}>
      <div className="aspect-square relative overflow-hidden rounded-lg bg-black/10">
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/20">
            {kind === "character" ? <User size={28} /> : <MapPin size={28} />}
          </div>
        )}
        {r.status === "generating" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="mt-2 px-1">
        <p className="truncate text-xs font-semibold text-foreground">{r.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-foreground/35">
          {r.description.slice(0, 80)}...
        </p>
      </div>
    </div>
  );
}

function SceneCard({
  scene,
  characters,
  environments,
  onRevise,
}: {
  scene: SmartScene;
  characters: CharacterRef[];
  environments: EnvironmentRef[];
  onRevise: (id: string) => void;
}) {
  const chars = characters.filter((c) => scene.characterIds.includes(c.id));
  const env = environments.find((e) => e.id === scene.environmentId);

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
      {/* Preview */}
      <div className="relative aspect-video overflow-hidden bg-black/20">
        {scene.videoUrl ? (
          <video src={scene.videoUrl} muted loop playsInline controls className="h-full w-full object-cover" />
        ) : scene.imageUrl ? (
          <img src={scene.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/15">
            <Film size={32} />
          </div>
        )}
        {(scene.status === "image_generating" || scene.status === "video_generating") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
              <Loader2 size={12} className="animate-spin" />
              {scene.status === "image_generating" ? "Image..." : "Video..."}
            </div>
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
          #{scene.index + 1}
        </div>
        {scene.status === "video_done" && (
          <div className="absolute right-2 top-2 rounded-md bg-emerald-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Check size={10} className="inline" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{scene.title}</h3>
          <span className="shrink-0 rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-foreground/35">
            {scene.duration}s
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-foreground/45">{scene.action}</p>

        {/* Ref badges */}
        {(chars.length > 0 || env) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {chars.map((c) => (
              <span key={c.id} className="flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-400">
                <User size={8} /> {c.name}
              </span>
            ))}
            {env && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                <MapPin size={8} /> {env.name}
              </span>
            )}
          </div>
        )}

        {/* Revise */}
        <button
          onClick={() => onRevise(scene.id)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-foreground/5 py-1.5 text-[11px] text-foreground/40 hover:text-foreground"
        >
          <Pencil size={10} /> Revise
        </button>

        {scene.error && (
          <p className="mt-2 text-[10px] text-red-400">{scene.error}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function ScenarioPage() {
  const [concept, setConcept] = useState("");
  const [title, setTitle] = useState("");
  const [characters, setCharacters] = useState<CharacterRef[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentRef[]>([]);
  const [scenes, setScenes] = useState<SmartScene[]>([]);

  const [stage, setStage] = useState<AgentStage>("idle");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [finalVideo, setFinalVideo] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(true);
  const cancelRef = useRef(false);

  // Revise modal
  const [reviseSceneId, setReviseSceneId] = useState<string | null>(null);
  const [reviseText, setReviseText] = useState("");
  const [reviseBusy, setReviseBusy] = useState(false);

  useEffect(() => {
    setHasKey(hasFalKey());
  }, []);

  const isRunning = stage !== "idle" && stage !== "completed" && stage !== "failed";
  const currentIdx = AGENT_STAGES.indexOf(stage);

  // ─── Pipeline steps ─────────────────────────────────────

  const runStep1_Analyze = async (): Promise<{
    chars: CharacterRef[];
    envs: EnvironmentRef[];
    scn: SmartScene[];
  } | null> => {
    setStage("analyzing");
    setDetail("Director reading the story...");
    try {
      const result = await analyzeScenario(concept);
      if (cancelRef.current) return null;
      setTitle(result.title);
      setCharacters(result.characters);
      setEnvironments(result.environments);
      setScenes(result.scenes);
      return { chars: result.characters, envs: result.environments, scn: result.scenes };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStage("failed");
      return null;
    }
  };

  const runStep2_Characters = async (chars: CharacterRef[]): Promise<CharacterRef[]> => {
    setStage("characters");
    const updated = [...chars];
    for (let i = 0; i < updated.length; i++) {
      if (cancelRef.current) return updated;
      setDetail(`Generating portrait ${i + 1}/${updated.length}: ${updated[i].name}`);
      updated[i] = { ...updated[i], status: "generating" };
      setCharacters([...updated]);
      try {
        const url = await generateReferenceImage(updated[i].description, "character");
        updated[i] = { ...updated[i], imageUrl: url, status: "done" };
      } catch {
        updated[i] = { ...updated[i], status: "failed" };
      }
      setCharacters([...updated]);
    }
    return updated;
  };

  const runStep3_Environments = async (envs: EnvironmentRef[]): Promise<EnvironmentRef[]> => {
    setStage("environments");
    const updated = [...envs];
    for (let i = 0; i < updated.length; i++) {
      if (cancelRef.current) return updated;
      setDetail(`Generating plate ${i + 1}/${updated.length}: ${updated[i].name}`);
      updated[i] = { ...updated[i], status: "generating" };
      setEnvironments([...updated]);
      try {
        const url = await generateReferenceImage(updated[i].description, "environment");
        updated[i] = { ...updated[i], imageUrl: url, status: "done" };
      } catch {
        updated[i] = { ...updated[i], status: "failed" };
      }
      setEnvironments([...updated]);
    }
    return updated;
  };

  const runStep4_Images = async (
    scn: SmartScene[],
    chars: CharacterRef[],
    envs: EnvironmentRef[],
  ): Promise<SmartScene[]> => {
    setStage("images");
    const updated = [...scn];
    // 2 in parallel
    for (let i = 0; i < updated.length; i += 2) {
      if (cancelRef.current) return updated;
      const batch = updated.slice(i, i + 2);
      setDetail(`Keyframe ${i + 1}–${Math.min(i + 2, updated.length)}/${updated.length}`);
      batch.forEach((s) => {
        const idx = updated.findIndex((x) => x.id === s.id);
        updated[idx] = { ...updated[idx], status: "image_generating" };
      });
      setScenes([...updated]);
      const results = await Promise.all(
        batch.map((s) =>
          generateSceneKeyframe(s, chars, envs)
            .then((url) => ({ id: s.id, url, ok: true as const }))
            .catch((e: Error) => ({ id: s.id, error: e.message, ok: false as const })),
        ),
      );
      results.forEach((r) => {
        const idx = updated.findIndex((x) => x.id === r.id);
        if (r.ok) {
          updated[idx] = { ...updated[idx], imageUrl: r.url, status: "image_done" };
        } else {
          updated[idx] = { ...updated[idx], status: "failed", error: r.error };
        }
      });
      setScenes([...updated]);
    }
    return updated;
  };

  const runStep5_Videos = async (scn: SmartScene[]): Promise<SmartScene[]> => {
    setStage("videos");
    const updated = [...scn];
    for (let i = 0; i < updated.length; i += 2) {
      if (cancelRef.current) return updated;
      const batch = updated.slice(i, i + 2).filter((s) => s.imageUrl);
      if (batch.length === 0) continue;
      setDetail(`Animating ${i + 1}–${Math.min(i + 2, updated.length)}/${updated.length}`);
      batch.forEach((s) => {
        const idx = updated.findIndex((x) => x.id === s.id);
        updated[idx] = { ...updated[idx], status: "video_generating" };
      });
      setScenes([...updated]);
      const results = await Promise.all(
        batch.map((s) =>
          generateSceneVideo(s, s.imageUrl!)
            .then((url) => ({ id: s.id, url, ok: true as const }))
            .catch((e: Error) => ({ id: s.id, error: e.message, ok: false as const })),
        ),
      );
      results.forEach((r) => {
        const idx = updated.findIndex((x) => x.id === r.id);
        if (r.ok) {
          updated[idx] = { ...updated[idx], videoUrl: r.url, status: "video_done" };
        } else {
          updated[idx] = { ...updated[idx], status: "failed", error: r.error };
        }
      });
      setScenes([...updated]);
    }
    return updated;
  };

  const runPipeline = useCallback(async () => {
    if (!concept.trim()) { setError("Please write a story concept"); return; }
    if (!hasKey) { setError("Add your fal.ai key in Settings first"); return; }

    cancelRef.current = false;
    setError(null);
    setFinalVideo(null);
    setStage("analyzing");

    try {
      const initial = await runStep1_Analyze();
      if (!initial || cancelRef.current) return;

      const finalChars = await runStep2_Characters(initial.chars);
      if (cancelRef.current) return;

      const finalEnvs = await runStep3_Environments(initial.envs);
      if (cancelRef.current) return;

      const scenesWithImages = await runStep4_Images(initial.scn, finalChars, finalEnvs);
      if (cancelRef.current) return;

      const scenesWithVideos = await runStep5_Videos(scenesWithImages);
      if (cancelRef.current) return;

      setDetail("Merging final video...");
      const videoUrls = scenesWithVideos.filter((s) => s.videoUrl).map((s) => s.videoUrl!);
      if (videoUrls.length > 0) {
        try {
          const merged = await mergeSceneVideos(videoUrls);
          setFinalVideo(merged);
        } catch {
          // If merge fails, user still has individual clips
        }
      }

      setStage("completed");
      setDetail("");
    } catch (e) {
      if (cancelRef.current) return;
      setError(e instanceof Error ? e.message : "Pipeline failed");
      setStage("failed");
    }
  }, [concept, hasKey]);

  // Persist completed scenario to history
  useEffect(() => {
    if (stage === "completed" && finalVideo) {
      import("@/lib/history-store").then(({ addHistoryItem, getHistory }) => {
        if (getHistory().some((h) => h.mediaUrl === finalVideo)) return;
        try {
          addHistoryItem({
            source: "scenario",
            mediaType: "video",
            prompt: concept.slice(0, 300),
            title: title || "Scenario",
            modelName: "Scene Builder",
            mediaUrl: finalVideo,
          });
        } catch { /* */ }
      });
    }
  }, [stage, finalVideo, concept, title]);

  const cancel = () => { cancelRef.current = true; setStage("idle"); };

  const reset = () => {
    cancelRef.current = true;
    setStage("idle");
    setCharacters([]);
    setEnvironments([]);
    setScenes([]);
    setFinalVideo(null);
    setError(null);
  };

  // ─── Revise scene ───────────────────────────────────────

  const openRevise = (id: string) => {
    setReviseSceneId(id);
    setReviseText("");
  };

  const submitRevise = async () => {
    if (!reviseSceneId || !reviseText.trim()) return;
    const scene = scenes.find((s) => s.id === reviseSceneId);
    if (!scene) return;
    setReviseBusy(true);
    try {
      const revised = await reviseScene(scene, reviseText, characters, environments);
      setScenes((prev) => prev.map((s) => (s.id === reviseSceneId ? revised : s)));
      setReviseSceneId(null);
      setReviseText("");

      // Regenerate just this scene's image and video
      const sceneUpdated = { ...revised };
      setScenes((prev) => prev.map((s) => (s.id === sceneUpdated.id ? { ...sceneUpdated, status: "image_generating" } : s)));
      try {
        const imageUrl = await generateSceneKeyframe(sceneUpdated, characters, environments);
        setScenes((prev) => prev.map((s) => (s.id === sceneUpdated.id ? { ...s, imageUrl, status: "video_generating" } : s)));
        const videoUrl = await generateSceneVideo(sceneUpdated, imageUrl);
        setScenes((prev) => prev.map((s) => (s.id === sceneUpdated.id ? { ...s, videoUrl, status: "video_done" } : s)));
      } catch (e) {
        setScenes((prev) =>
          prev.map((s) =>
            s.id === sceneUpdated.id
              ? { ...s, status: "failed", error: e instanceof Error ? e.message : "failed" }
              : s,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revise failed");
    }
    setReviseBusy(false);
  };

  const reviseTarget = scenes.find((s) => s.id === reviseSceneId);

  return (
    <>
      <TopBar title="Scene Builder" />
      <FalKeyGuard toolName="Scene Builder">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* Concept Input */}
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-[color:var(--accent)]" />
            <h2 className="text-sm font-semibold text-foreground">Your story concept</h2>
          </div>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            disabled={isRunning}
            rows={5}
            placeholder="A lone samurai returns to her village after a long war, only to find it abandoned. She finds her family's sword buried in the garden, and as she pulls it from the earth, the village briefly appears around her as it once was — her mother cooking, her father training her as a child — before fading back to the ruins. She sheathes the sword and walks into the forest alone."
            className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] p-3 text-sm text-foreground placeholder:text-foreground/20 focus:border-[color:var(--accent)]/40 focus:outline-none disabled:opacity-50"
          />
          <div className="mt-3 flex items-center gap-2">
            {isRunning ? (
              <button onClick={cancel} className="flex items-center gap-1.5 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold text-white">
                <Square size={12} /> Stop
              </button>
            ) : (
              <button
                onClick={runPipeline}
                disabled={!concept.trim() || !hasKey}
                className="flex items-center gap-1.5 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:opacity-30"
              >
                <Sparkles size={12} /> Generate
              </button>
            )}
            {(scenes.length > 0 || finalVideo) && !isRunning && (
              <button onClick={reset} className="flex items-center gap-1.5 rounded-xl bg-foreground/5 px-4 py-2 text-xs text-foreground/40 hover:text-foreground">
                <RotateCcw size={12} /> New
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {stage !== "idle" && (
          <div className="mt-5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
            <div className="flex flex-wrap gap-1.5">
              {AGENT_STAGES.map((s, i) => {
                const isDone = i < currentIdx || stage === "completed";
                const isCurrent = s === stage;
                const isFailed = stage === "failed" && i === currentIdx;
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
                      isFailed
                        ? "bg-red-500/10 text-red-400"
                        : isDone
                        ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                        : isCurrent
                        ? "bg-foreground/8 text-foreground"
                        : "text-foreground/15"
                    }`}
                  >
                    {isDone ? <Check size={11} />
                      : isCurrent ? <Loader2 size={11} className="animate-spin" />
                      : isFailed ? <AlertCircle size={11} />
                      : <ChevronRight size={11} />}
                    {AGENT_STAGE_LABELS[s]}
                  </div>
                );
              })}
            </div>
            {detail && <p className="mt-2.5 text-[11px] text-foreground/30">{detail}</p>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/5 border border-red-500/10 p-3">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="flex-1 text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="mt-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          </div>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                Characters ({characters.length})
              </h3>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {characters.map((c) => (
                <RefCard key={c.id} item={c} kind="character" />
              ))}
            </div>
          </div>
        )}

        {/* Environments */}
        {environments.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                Environments ({environments.length})
              </h3>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {environments.map((e) => (
                <RefCard key={e.id} item={e} kind="environment" />
              ))}
            </div>
          </div>
        )}

        {/* Scenes */}
        {scenes.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Film size={14} className="text-[color:var(--accent)]" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                Scenes ({scenes.length})
              </h3>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {scenes.map((s) => (
                <SceneCard
                  key={s.id}
                  scene={s}
                  characters={characters}
                  environments={environments}
                  onRevise={openRevise}
                />
              ))}
            </div>
          </div>
        )}

        {/* Final video */}
        {finalVideo && (
          <div className="mt-6">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)]">
              Final Scenario Video
            </h3>
            <div className="rounded-2xl border border-[color:var(--accent)]/20 bg-[color:var(--surface)] p-3">
              <video src={finalVideo} controls autoPlay className="mx-auto w-full rounded-xl" style={{ maxHeight: 520 }} />
              <a
                href={finalVideo}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black"
              >
                <Download size={12} /> Download
              </a>
            </div>
          </div>
        )}

        {/* How it works */}
        <HowItWorks
          title="How Smart Mode works"
          description="An AI director reads your story, identifies characters and locations that recur, generates a canonical reference for each, then builds every scene using those references so identities stay consistent throughout."
          pipeline={[
            {
              label: "Analyze story",
              model: "anthropic/claude-opus-4-6",
              description: "Breaks the concept into scenes, extracts recurring characters and environments with detailed descriptions.",
            },
            {
              label: "Character references",
              model: "fal-ai/gemini-3.1-flash-image-preview",
              modelUrl: "https://fal.ai/models/fal-ai/gemini-3.1-flash-image-preview",
              description: "Nano Banana 2 generates a canonical portrait for each character — one image reused in every scene they appear in.",
            },
            {
              label: "Environment plates",
              model: "fal-ai/gemini-3.1-flash-image-preview",
              description: "Each distinct location gets a reference plate used to ground the scenes visually.",
            },
            {
              label: "Scene keyframes",
              model: "fal-ai/bytedance/seedream/v5/lite/edit",
              modelUrl: "https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/edit",
              description: "Seedream Edit composes each scene using the character + environment references, keeping identities consistent.",
            },
            {
              label: "Animate",
              model: "bytedance/seedance-2.0/image-to-video",
              modelUrl: "https://fal.ai/models/bytedance/seedance-2.0/image-to-video",
              description: "Seedance turns each keyframe into a video clip with the motion described for that scene.",
            },
            {
              label: "Merge",
              model: "fal-ai/ffmpeg-api/merge-videos",
              description: "Individual clips are concatenated into a single scenario video.",
            },
          ]}
          notes={[
            "Character references are reused across every scene, so a character keeps the same face and outfit throughout.",
            "Click 'Revise' on any scene to describe a change — the agent updates just that scene's prompts and regenerates it.",
            "Runs fully on your fal.ai key. No images or story content are uploaded to our servers.",
          ]}
        />
      </div>

      {/* Revise Modal */}
      {reviseSceneId && reviseTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !reviseBusy && setReviseSceneId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <Pencil size={14} className="text-[color:var(--accent)]" />
              <h3 className="text-sm font-semibold text-foreground">Revise Scene {reviseTarget.index + 1}</h3>
            </div>
            <p className="mb-3 text-xs text-foreground/40">{reviseTarget.title}</p>
            <textarea
              value={reviseText}
              onChange={(e) => setReviseText(e.target.value)}
              disabled={reviseBusy}
              rows={4}
              placeholder="e.g. Make it night time, add more rain, swap the character's outfit for a leather jacket"
              className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] p-3 text-xs text-foreground placeholder:text-foreground/25 focus:border-[color:var(--accent)]/40 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setReviseSceneId(null)}
                disabled={reviseBusy}
                className="rounded-lg bg-foreground/5 px-4 py-2 text-xs text-foreground/60"
              >
                Cancel
              </button>
              <button
                onClick={submitRevise}
                disabled={!reviseText.trim() || reviseBusy}
                className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                {reviseBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {reviseBusy ? "Revising..." : "Revise & regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
      </FalKeyGuard>
    </>
  );
}
