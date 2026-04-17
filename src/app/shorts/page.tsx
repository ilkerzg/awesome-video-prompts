"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/topbar";
import { getFal } from "@/lib/fal-client";
import { CustomSelect } from "@/components/custom-select";
import { HowItWorks } from "@/components/how-it-works";
import {
  generateScript, generateTTS, generateSTT, planProduction,
  generateSceneImage, generateSceneVideo, trimVideo, trimSegment,
  generateMusic, fadeMusic, mergeVideos, addAudioToVideo,
  addSubtitles, createEndCard,
  STAGE_ORDER, STAGE_LABELS,
  IMAGE_MODEL_OPTIONS, VIDEO_MODEL_OPTIONS, VOICE_OPTIONS,
  type PipelineStage, type PipelineConfig, type ScriptResult, type ProductionPlan, type SceneAsset,
} from "@/lib/shorts-pipeline";
import {
  Play, Pause, Square, Loader2, Upload, X, Check,
  Film, Mic, Brain, Image as ImageIcon, Merge, Volume2, Type,
  AlertCircle, Download, RotateCcw, VolumeX,
} from "lucide-react";

// ─── Custom Audio Player ────────────────────────────────────

function AudioPlayer({ src, label }: { src: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("ended", onEnd); };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrent(t);
  };

  const changeVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVol(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-foreground/25">{label}</p>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors">
          {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>
        <span className="w-[70px] shrink-0 font-mono text-[10px] text-foreground/30">{fmt(currentTime)} / {fmt(duration)}</span>
        <div className="relative flex-1 h-5 flex items-center">
          <div className="absolute inset-x-0 h-1 rounded-full bg-foreground/5">
            <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
          <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
            onChange={seek} className="absolute inset-x-0 h-5 w-full cursor-pointer opacity-0" />
        </div>
        <button onClick={toggleMute} className="shrink-0 text-foreground/20 hover:text-foreground/50">
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <div className="relative w-14 h-5 flex items-center shrink-0">
          <div className="absolute inset-x-0 h-1 rounded-full bg-foreground/5">
            <div className="h-full rounded-full bg-foreground/20" style={{ width: `${(muted ? 0 : vol) * 100}%` }} />
          </div>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol}
            onChange={changeVol} className="absolute inset-x-0 h-5 w-full cursor-pointer opacity-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────

const ASPECT_OPTIONS = [
  { id: "9:16", label: "9:16 Vertical" },
  { id: "16:9", label: "16:9 Landscape" },
];

const STAGE_ICONS: Partial<Record<PipelineStage, React.ComponentType<{ size?: number; className?: string }>>> = {
  script: Brain, voice: Mic, planning: Brain, assets: ImageIcon,
  merge: Merge, audio: Volume2, subtitles: Type, completed: Check,
};

const BEAT_COLORS: Record<string, string> = {
  hook: "bg-red-500/15 text-red-400 border-red-500/20",
  ground: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  core: "bg-foreground/5 text-foreground/40 border-foreground/10",
  synthesis: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  anchor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

// ─── Page ───────────────────────────────────────────────────

export default function ShortsPage() {
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [voice, setVoice] = useState("Rachel");
  const [imageModel, setImageModel] = useState("nano-banana-pro");
  const [videoModel, setVideoModel] = useState("veo3.1-lite");
  // music model fixed to elevenlabs
  const [endCardUrl, setEndCardUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<PipelineStage>("idle");
  const [stageDetail, setStageDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const [script, setScript] = useState<ScriptResult | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);
  const [production, setProduction] = useState<ProductionPlan | null>(null);
  const [sceneAssets, setSceneAssets] = useState<SceneAsset[]>([]);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [scenesCompleted, setScenesCompleted] = useState(0);

  const isRunning = stage !== "idle" && stage !== "completed" && stage !== "failed";

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try { setEndCardUrl(await getFal().storage.upload(file)); } catch { /* */ }
    setUploading(false);
  }, []);

  // ─── Pipeline ───────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    if (!topic.trim()) return;
    cancelRef.current = false;
    setError(null); setScript(null); setTtsUrl(null); setProduction(null);
    setSceneAssets([]); setMusicUrl(null); setMergedUrl(null); setFinalUrl(null);
    setScenesCompleted(0); setStageDetail("");

    const ar = aspectRatio as "9:16" | "16:9";

    try {
      // 1: Script
      setStage("script"); setStageDetail("AI is writing a 10-scene script...");
      const scriptResult = await generateScript(topic);
      if (cancelRef.current) return;
      if (!scriptResult?.scenes?.length) throw new Error("Script generation returned empty");
      setScript(scriptResult);

      // 2: Voice
      setStage("voice"); setStageDetail("Generating narration audio...");
      const audioUrl = await generateTTS(scriptResult.tts_script, voice);
      if (cancelRef.current) return;
      setTtsUrl(audioUrl);

      setStageDetail("Extracting word timestamps...");
      const sttResult = await generateSTT(audioUrl);
      if (cancelRef.current) return;

      // 3: Planning
      setStage("planning"); setStageDetail(`Planning for ${videoModel}...`);
      const wordsStr = JSON.stringify(sttResult.words);
      const scriptStr = JSON.stringify({ scenes: scriptResult.scenes });
      const plan = await planProduction(wordsStr, scriptStr, videoModel, sttResult.totalDuration);
      if (cancelRef.current) return;
      if (!plan?.scenes?.length) throw new Error("Production planning returned empty");
      setProduction(plan);

      // 4: Assets
      setStage("assets"); setStageDetail("Generating images, videos, and music...");
      const initialAssets: SceneAsset[] = plan.scenes.map(() => ({
        imageUrl: null, videoUrl: null, trimmedUrl: null, status: "pending",
      }));
      setSceneAssets(initialAssets);
      setScenesCompleted(0);

      const scenePromises = plan.scenes.map(async (scene, idx) => {
        try {
          setSceneAssets((p) => { const n = [...p]; n[idx] = { ...n[idx], status: "image" }; return n; });
          const imgUrl = await generateSceneImage(scene.image_prompt, ar, imageModel);
          if (cancelRef.current) return null;
          setSceneAssets((p) => { const n = [...p]; n[idx] = { ...n[idx], imageUrl: imgUrl, status: "video" }; return n; });

          const vidUrl = await generateSceneVideo(scene.video_prompt, imgUrl, scene.gen_duration, videoModel, ar);
          if (cancelRef.current) return null;
          setSceneAssets((p) => { const n = [...p]; n[idx] = { ...n[idx], videoUrl: vidUrl, status: "trimming" }; return n; });

          const trimmedUrl = await trimVideo(vidUrl, scene.trim_duration);
          if (cancelRef.current) return null;
          setSceneAssets((p) => { const n = [...p]; n[idx] = { ...n[idx], trimmedUrl, status: "done" }; return n; });
          setScenesCompleted((c) => c + 1);
          return trimmedUrl;
        } catch (e) {
          setSceneAssets((p) => { const n = [...p]; n[idx] = { ...n[idx], status: "error", error: e instanceof Error ? e.message : "Failed" }; return n; });
          return null;
        }
      });

      const musicPromise = (async () => {
        try {
          const raw = await generateMusic(scriptResult.music_prompt, plan.music_duration_ms);
          if (cancelRef.current || !raw) return null;
          const faded = await fadeMusic(raw);
          if (cancelRef.current) return null;
          setMusicUrl(faded);
          return faded;
        } catch { return null; }
      })();

      const [sceneResults, fadedMusicUrl] = await Promise.all([Promise.all(scenePromises), musicPromise]);
      if (cancelRef.current) return;

      const trimmedUrls = sceneResults.filter(Boolean) as string[];
      if (trimmedUrls.length < 3) throw new Error(`Only ${trimmedUrls.length}/10 scenes — need at least 3`);

      // 5: Merge
      setStage("merge"); setStageDetail(`Merging ${trimmedUrls.length} clips...`);
      const merged = await mergeVideos(trimmedUrls);
      if (cancelRef.current) return;
      setMergedUrl(merged);

      // 5b: Audio — first call: keepOriginal=false (video is silent), second: true (keep narration)
      setStage("audio"); setStageDetail("Adding narration...");
      let withAudio = await addAudioToVideo(merged, audioUrl, false);
      if (cancelRef.current) return;
      if (fadedMusicUrl) {
        setStageDetail("Adding music...");
        withAudio = await addAudioToVideo(withAudio, fadedMusicUrl, true);
        if (cancelRef.current) return;
      }

      // 6: Subtitles
      setStage("subtitles"); setStageDetail("Adding subtitles...");
      try {
        const [hookVid, middleVid, anchorVid] = await Promise.all([
          trimVideo(withAudio, plan.hook_duration).then((url) =>
            addSubtitles(url, { fontSize: 100, fontWeight: "black", position: "center", wordsPerSubtitle: 1, strokeWidth: 3, highlightColor: "#FF6B35" }),
          ),
          trimSegment(withAudio, plan.middle_start, plan.middle_duration).then((url) =>
            addSubtitles(url, { fontSize: 48, fontWeight: "bold", position: "bottom", wordsPerSubtitle: 3, strokeWidth: 2, highlightColor: "purple" }),
          ),
          trimSegment(withAudio, plan.anchor_start, plan.anchor_duration).then((url) =>
            addSubtitles(url, { fontSize: 100, fontWeight: "black", position: "center", wordsPerSubtitle: 1, strokeWidth: 3, highlightColor: "#22C55E" }),
          ),
        ]);
        if (cancelRef.current) return;

        let endCardVid: string | null = null;
        if (endCardUrl) {
          setStageDetail("Creating end card...");
          endCardVid = await createEndCard(endCardUrl);
          if (cancelRef.current) return;
        }

        const finalParts = [hookVid, middleVid, anchorVid];
        if (endCardVid) finalParts.push(endCardVid);
        setStageDetail("Final merge...");
        setFinalUrl(await mergeVideos(finalParts));
      } catch {
        setFinalUrl(withAudio); // fallback
      }

      setStage("completed"); setStageDetail("");
    } catch (e) {
      if (cancelRef.current) return;
      setError(e instanceof Error ? e.message : "Pipeline failed");
      setStage("failed");
    }
  }, [topic, voice, aspectRatio, imageModel, videoModel, endCardUrl]);

  // Persist completed shorts to history
  useEffect(() => {
    if (stage === "completed" && finalUrl) {
      import("@/lib/history-store").then(({ addHistoryItem, getHistory }) => {
        // Avoid duplicate for same URL
        if (getHistory().some((h) => h.mediaUrl === finalUrl)) return;
        try {
          addHistoryItem({
            source: "shorts",
            mediaType: "video",
            prompt: topic || "Shorts",
            title: topic?.slice(0, 60),
            modelName: "Shorts pipeline",
            aspectRatio,
            mediaUrl: finalUrl,
          });
        } catch { /* */ }
      });
    }
  }, [stage, finalUrl, topic, aspectRatio]);

  const cancel = () => { cancelRef.current = true; setStage("idle"); };
  const reset = () => {
    cancelRef.current = true; setStage("idle"); setError(null); setStageDetail("");
    setScript(null); setTtsUrl(null); setProduction(null);
    setSceneAssets([]); setMusicUrl(null); setMergedUrl(null); setFinalUrl(null);
  };

  const currentIdx = STAGE_ORDER.indexOf(stage);
  const progress = stage === "completed" ? 100 : stage === "failed" || stage === "idle" ? 0
    : Math.round(((currentIdx + (stage === "assets" ? scenesCompleted / 10 : 0.5)) / STAGE_ORDER.length) * 100);

  return (
    <>
      <TopBar title="Shorts Studio" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* ── Input ── */}
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Topic</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, How black holes form, Why the sky is blue..."
                disabled={isRunning}
                className="h-10 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-50" />
            </div>
            <div className="flex items-end">
              {isRunning ? (
                <button onClick={cancel} className="flex h-10 items-center gap-2 rounded-xl bg-red-500/80 px-5 text-sm font-semibold text-white">
                  <Square size={14} /> Stop
                </button>
              ) : (
                <button onClick={runPipeline} disabled={!topic.trim()}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[color:var(--accent)] px-6 text-sm font-semibold text-black disabled:opacity-30">
                  <Play size={14} /> Create Short
                </button>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Aspect</label>
              <CustomSelect options={ASPECT_OPTIONS} value={aspectRatio} onChange={(v) => v && setAspectRatio(v)} placeholder="Ratio" />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Voice</label>
              <CustomSelect options={VOICE_OPTIONS} value={voice} onChange={(v) => v && setVoice(v)} placeholder="Voice" />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Image Model</label>
              <CustomSelect options={IMAGE_MODEL_OPTIONS} value={imageModel} onChange={(v) => v && setImageModel(v)} placeholder="Image" />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Video Model</label>
              <CustomSelect options={VIDEO_MODEL_OPTIONS} value={videoModel} onChange={(v) => v && setVideoModel(v)} placeholder="Video" />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Music</label>
              <div className="flex h-9 items-center rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 text-sm text-foreground/50">
                ElevenLabs Music
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">End Card</label>
              {endCardUrl ? (
                <div className="flex h-9 items-center gap-2">
                  <img src={endCardUrl} alt="" className="h-9 w-14 rounded-lg object-cover border border-[color:var(--border-soft)]" />
                  <button onClick={() => setEndCardUrl(null)} className="text-foreground/20 hover:text-red-400"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[color:var(--border-soft)] text-[10px] text-foreground/25 hover:border-[color:var(--accent)]/40">
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                  {uploading ? "..." : "Upload"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
            </div>
          </div>
        </div>

        {/* ── Pipeline Progress ── */}
        {stage !== "idle" && (
          <div className="mt-5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
                <div className={`h-full rounded-full transition-all duration-700 ${stage === "failed" ? "bg-red-500" : stage === "completed" ? "bg-emerald-500" : "bg-[color:var(--accent)]"}`}
                  style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-mono text-foreground/25 tabular-nums w-10 text-right">{progress}%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_ORDER.map((s, i) => {
                const Icon = STAGE_ICONS[s] || Film;
                const isDone = i < currentIdx || stage === "completed";
                const isCurrent = s === stage || (stage === "failed" && i === currentIdx);
                const isFailed = stage === "failed" && isCurrent;
                return (
                  <div key={s} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
                    isFailed ? "bg-red-500/10 text-red-400"
                    : isDone ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                    : isCurrent ? "bg-foreground/8 text-foreground"
                    : "text-foreground/12"
                  }`}>
                    {isDone ? <Check size={11} />
                    : isCurrent && !isFailed ? <Loader2 size={11} className="animate-spin" />
                    : isFailed ? <AlertCircle size={11} />
                    : <Icon size={11} />}
                    {STAGE_LABELS[s]}
                  </div>
                );
              })}
            </div>
            {stageDetail && <p className="mt-2.5 text-[11px] text-foreground/25">{stageDetail}</p>}
            {stage === "assets" && (
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => {
                    const a = sceneAssets[i];
                    return <div key={i} className={`size-2 rounded-full transition-colors ${
                      !a || a.status === "pending" ? "bg-foreground/8"
                      : a.status === "done" ? "bg-emerald-500"
                      : a.status === "error" ? "bg-red-500"
                      : "bg-[color:var(--accent)] animate-pulse"
                    }`} />;
                  })}
                </div>
                <span className="text-[10px] font-mono text-foreground/20">{scenesCompleted}/10</span>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/5 border border-red-500/10 p-3">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="flex-1 text-xs text-red-400">{error}</p>
            <button onClick={reset} className="shrink-0 text-[10px] text-red-400 underline">Reset</button>
          </div>
        )}

        {/* ── Script ── */}
        {script && (
          <div className="mt-5">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-foreground/20">Script</h2>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
              {script.scenes.map((scene, i) => (
                <div key={scene.id} className={`rounded-xl border p-2.5 ${BEAT_COLORS[scene.beat] || "bg-foreground/5 text-foreground/40 border-foreground/10"}`}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[8px] font-bold uppercase">{scene.beat}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-80">{scene.narration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Audio Players ── */}
        {(ttsUrl || musicUrl) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ttsUrl && <AudioPlayer src={ttsUrl} label="Narration" />}
            {musicUrl && <AudioPlayer src={musicUrl} label="Music" />}
          </div>
        )}

        {/* ── Scene Assets ── */}
        {sceneAssets.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-foreground/20">Scenes</h2>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
              {sceneAssets.map((asset, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
                  <div className="relative aspect-video bg-foreground/3">
                    {asset.imageUrl ? (
                      <img src={asset.imageUrl} alt={`Scene ${i + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {asset.status === "pending"
                          ? <span className="text-[10px] font-bold text-foreground/8">{i + 1}</span>
                          : <Loader2 size={14} className="animate-spin text-foreground/10" />}
                      </div>
                    )}
                    <span className={`absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[7px] font-bold ${
                      asset.status === "done" ? "bg-emerald-500 text-white"
                      : asset.status === "error" ? "bg-red-500 text-white"
                      : asset.status === "pending" ? "bg-foreground/10 text-foreground/15"
                      : "bg-[color:var(--accent)] text-black"
                    }`}>
                      {asset.status === "done" ? "OK"
                      : asset.status === "error" ? "ERR"
                      : asset.status === "pending" ? `${i + 1}`
                      : asset.status === "image" ? "IMG"
                      : asset.status === "video" ? "VID"
                      : "TRIM"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Final Video ── */}
        {finalUrl && (
          <div className="mt-6">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)]">Result</h2>
            <div className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--surface)] p-3">
              <video src={finalUrl} controls autoPlay className="mx-auto w-full rounded-lg" style={{ maxHeight: 520 }} />
              <div className="mt-3 flex items-center gap-2">
                <a href={finalUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black">
                  <Download size={12} /> Download
                </a>
                <button onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-4 py-2 text-xs text-foreground/40 hover:text-foreground">
                  <RotateCcw size={12} /> New Short
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Pre-subtitle preview ── */}
        {mergedUrl && !finalUrl && stage !== "completed" && (
          <div className="mt-5">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/20">Preview (processing...)</h3>
            <video src={mergedUrl} controls className="w-full max-w-md rounded-lg" />
          </div>
        )}

        {/* ── How it works ── */}
        <HowItWorks
          title="How Shorts Studio works"
          description="A multi-stage pipeline that turns a topic or script into a vertical short with voice, subtitles, and stock footage — all through fal.ai."
          pipeline={[
            {
              label: "Script",
              model: "anthropic/claude-opus-4-6",
              modelUrl: "https://fal.ai/models/openrouter/router",
              description: "Claude writes a 30–60 second script from your topic, or you provide one directly.",
            },
            {
              label: "Voice-over",
              model: "fal-ai/gemini-3.1-flash-tts",
              modelUrl: "https://fal.ai/models/fal-ai/gemini-3.1-flash-tts",
              description: "Gemini TTS generates the narrator track with emotion cues.",
            },
            {
              label: "Timestamps",
              model: "fal-ai/elevenlabs/speech-to-text/scribe-v2",
              modelUrl: "https://fal.ai/models/fal-ai/elevenlabs/speech-to-text/scribe-v2",
              description: "ElevenLabs Scribe transcribes the audio with word-level timing for subtitles.",
            },
            {
              label: "Scene plan",
              model: "anthropic/claude-opus-4-6",
              description: "Claude breaks the script into visual scenes, each with its own image prompt.",
            },
            {
              label: "Images",
              model: "fal-ai/gemini-3.1-flash-image-preview",
              modelUrl: "https://fal.ai/models/fal-ai/gemini-3.1-flash-image-preview",
              description: "Nano Banana 2 generates vertical (9:16) keyframes for each scene.",
            },
            {
              label: "Animate",
              model: "bytedance/seedance-2.0/image-to-video",
              modelUrl: "https://fal.ai/models/bytedance/seedance-2.0/image-to-video",
              description: "Seedance animates each keyframe into a short video clip.",
            },
            {
              label: "Merge + subtitle",
              model: "fal-ai/ffmpeg-api",
              modelUrl: "https://fal.ai/models/fal-ai/ffmpeg-api",
              description: "FFmpeg joins clips, adds audio, and burns in the subtitles.",
            },
          ]}
          notes={[
            "All generation runs with your own fal.ai key (Settings → API Key).",
            "A 30-second short takes 3–5 minutes end-to-end depending on queue times.",
            "You can stop between stages and resume from any checkpoint.",
          ]}
        />
      </div>
    </>
  );
}
