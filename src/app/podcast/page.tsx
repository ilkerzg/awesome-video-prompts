"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/topbar";
import { FalKeyGuard } from "@/components/fal-key-guard";
import { getFal } from "@/lib/fal-client";
import { CustomSelect } from "@/components/custom-select";
import { HowItWorks } from "@/components/how-it-works";
import {
  generatePodcastScript, generateStudioPortrait, generateTTS, transcribeAudio,
  groupSpeakerSegments, splitAudio, generateLipsync, mergeVideos, addAudioToVideo,
  PODCAST_STAGES, PODCAST_STAGE_LABELS, GEMINI_VOICES, LANGUAGE_OPTIONS,
  STUDIO_REF_LEFT, STUDIO_REF_RIGHT, getVoiceMeta,
  LIPSYNC_MODELS, DEFAULT_LIPSYNC_MODEL, getLipsyncModel,
  type PodcastStage, type Speaker, type SpeakerSegment, type LipsyncModelId,
} from "@/lib/podcast-pipeline";
import {
  Play, Pause, Square, Loader2, Upload, X, Check, Mic, Brain,
  Scissors, Video, Merge, AlertCircle, Download, RotateCcw,
  User, Wand2, Image as ImageIcon, ChevronRight, Zap,
} from "lucide-react";

// ─── Audio Player ───────────────────────────────────────────

function AudioPlayer({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onT = () => setTime(a.currentTime);
    const onM = () => setDur(a.duration);
    const onE = () => setPlaying(false);
    a.addEventListener("timeupdate", onT);
    a.addEventListener("loadedmetadata", onM);
    a.addEventListener("ended", onE);
    return () => { a.removeEventListener("timeupdate", onT); a.removeEventListener("loadedmetadata", onM); a.removeEventListener("ended", onE); };
  }, [src]);

  const toggle = () => { const a = ref.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play(), setPlaying(true)); };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const pct = dur > 0 ? (time / dur) * 100 : 0;

  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
      <audio ref={ref} src={src} preload="metadata" />
      <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-foreground/25">{label}</p>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/60 hover:text-foreground">
          {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>
        <span className="w-16 shrink-0 font-mono text-[10px] text-foreground/30">{fmt(time)}/{fmt(dur)}</span>
        <div className="relative flex-1 h-5 flex items-center">
          <div className="absolute inset-x-0 h-1 rounded-full bg-foreground/5">
            <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
          <input type="range" min={0} max={dur || 0} step={0.1} value={time}
            onChange={(e) => { const t = +e.target.value; if (ref.current) ref.current.currentTime = t; setTime(t); }}
            className="absolute inset-x-0 h-5 w-full cursor-pointer opacity-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload ───────────────────────────────────────────

function ImageUpload({ value, onChange, label }: { value: string | null; onChange: (url: string | null) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try { onChange(await getFal().storage.upload(file)); } catch { /* */ }
    setUploading(false);
  }, [onChange]);

  return (
    <div>
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-foreground/25">{label}</p>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="h-20 w-20 rounded-xl border border-[color:var(--border-soft)] object-cover" />
          <button onClick={() => onChange(null)} className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background"><X size={10} /></button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--border-soft)] text-foreground/20 hover:border-[color:var(--accent)]/40 hover:text-foreground/40">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Approve Button ─────────────────────────────────────────

function ApproveButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="mt-3 flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-5 py-2.5 text-xs font-semibold text-black disabled:opacity-30 hover:brightness-110 transition-all">
      <Check size={13} /> {label}
    </button>
  );
}

// ─── Constants ──────────────────────────────────────────────

const VOICE_OPTIONS = GEMINI_VOICES.map((v) => ({
  id: v.id,
  label: `${v.id} — ${v.character} · ${v.gender}`,
}));

const LIPSYNC_OPTIONS = LIPSYNC_MODELS.map((m) => ({ id: m.id, label: m.name }));

const STAGE_ICONS: Partial<Record<PodcastStage, React.ComponentType<{ size?: number; className?: string }>>> = {
  script: Brain, portraits: ImageIcon, tts: Mic, stt: Brain, splitting: Scissors,
  lipsync: Video, merging: Merge, completed: Check,
};

const SPEAKER_COLORS = ["text-blue-400", "text-purple-400"];
const SPEAKER_BG = ["bg-blue-500/10 border-blue-500/20", "bg-purple-500/10 border-purple-500/20"];

// Steps that pause for user approval
type ApprovalGate = "script" | "portraits" | "tts";
const APPROVAL_GATES = new Set<PodcastStage>(["script", "portraits", "tts"]);

// ─── Page ───────────────────────────────────────────────────

export default function PodcastPage() {
  // Input
  const [mode, setMode] = useState<"topic" | "script">("topic");
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [language, setLanguage] = useState("English (US)");
  const [styleInstructions, setStyleInstructions] = useState("Warm, enthusiastic podcast conversation tone. Natural pacing with genuine reactions.");
  const [autoMode, setAutoMode] = useState(false);
  const [lipsyncModel, setLipsyncModel] = useState<LipsyncModelId>(DEFAULT_LIPSYNC_MODEL);

  // Speakers
  const [speaker1, setSpeaker1] = useState<Speaker>({ id: "speaker_0", name: "Host", voice: "Charon", imageUrl: null });
  const [speaker2, setSpeaker2] = useState<Speaker>({ id: "speaker_1", name: "Guest", voice: "Kore", imageUrl: null });

  // Pipeline state
  const [stage, setStage] = useState<PodcastStage>("idle");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false); // true while an async step runs
  const [waitingApproval, setWaitingApproval] = useState<ApprovalGate | null>(null);
  const cancelRef = useRef(false);

  // Artifacts — persisted across steps
  const [studioPortrait1, setStudioPortrait1] = useState<string | null>(null);
  const [studioPortrait2, setStudioPortrait2] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<SpeakerSegment[]>([]);
  const [lipsyncProgress, setLipsyncProgress] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  // Refs to hold latest artifacts for pipeline continuations
  const artifactsRef = useRef({
    script: "", portrait1: "", portrait2: "", audioUrl: "", segments: [] as SpeakerSegment[],
  });

  const isRunning = working;

  // ─── Individual Step Runners ────────────────────────────

  const runStep = useCallback(async (step: PodcastStage) => {
    setWorking(true);
    setError(null);
    cancelRef.current = false;

    try {
      switch (step) {
        case "script": {
          let finalScript: string;
          if (mode === "topic") {
            setStage("script"); setDetail("AI is writing the podcast script...");
            finalScript = await generatePodcastScript(topic, speaker1.name, speaker2.name);
          } else {
            finalScript = script;
          }
          if (cancelRef.current) return;
          setGeneratedScript(finalScript);
          artifactsRef.current.script = finalScript;
          setStage("script"); setDetail("");
          if (!autoMode) { setWaitingApproval("script"); setWorking(false); return; }
          // fall through to next step
          break;
        }
        case "portraits": {
          setStage("portraits"); setDetail("Generating podcast studio portraits...");
          const [p1, p2] = await Promise.all([
            generateStudioPortrait(speaker1.imageUrl!, STUDIO_REF_LEFT, speaker1.name, "left"),
            generateStudioPortrait(speaker2.imageUrl!, STUDIO_REF_RIGHT, speaker2.name, "right"),
          ]);
          if (cancelRef.current) return;
          setStudioPortrait1(p1); setStudioPortrait2(p2);
          artifactsRef.current.portrait1 = p1;
          artifactsRef.current.portrait2 = p2;
          setDetail("");
          if (!autoMode) { setWaitingApproval("portraits"); setWorking(false); return; }
          break;
        }
        case "tts": {
          setStage("tts"); setDetail("Generating multi-speaker audio with Gemini TTS...");
          const ttsUrl = await generateTTS(
            artifactsRef.current.script, [speaker1, speaker2], language, styleInstructions,
          );
          if (cancelRef.current) return;
          setAudioUrl(ttsUrl);
          artifactsRef.current.audioUrl = ttsUrl;
          setDetail("");
          if (!autoMode) { setWaitingApproval("tts"); setWorking(false); return; }
          break;
        }
        case "stt": {
          setStage("stt"); setDetail("Analyzing speech with word-level timestamps...");
          const transcript = await transcribeAudio(artifactsRef.current.audioUrl);
          if (cancelRef.current) return;

          setStage("splitting"); setDetail("Grouping speaker segments...");
          const speakerSegments = groupSpeakerSegments(transcript.words);
          setSegments(speakerSegments);
          artifactsRef.current.segments = speakerSegments;
          break;
        }
        case "splitting": {
          setStage("splitting"); setDetail("Splitting audio into speaker segments...");
          const segs = artifactsRef.current.segments;
          const splitPoints = segs.slice(1).map((seg, i) => {
            const prevEnd = segs[i].endTime;
            const nextStart = seg.startTime;
            return prevEnd + (nextStart - prevEnd) / 2;
          });
          const audioChunks = await splitAudio(artifactsRef.current.audioUrl, splitPoints);
          if (cancelRef.current) return;

          // Lipsync
          const speakerMap: Record<string, Speaker> = {
            speaker_0: { ...speaker1, imageUrl: artifactsRef.current.portrait1 },
            speaker_1: { ...speaker2, imageUrl: artifactsRef.current.portrait2 },
          };

          setStage("lipsync"); setDetail(`Generating ${segs.length} lip-synced clips...`);
          setLipsyncProgress(0);

          const videoUrls: string[] = [];
          for (let i = 0; i < segs.length; i += 3) {
            const batch = segs.slice(i, Math.min(i + 3, segs.length));
            const batchResults = await Promise.all(
              batch.map(async (seg, batchIdx) => {
                const idx = i + batchIdx;
                const speaker = speakerMap[seg.speakerId];
                if (!speaker?.imageUrl) return null;
                const chunkUrl = audioChunks[idx];
                if (!chunkUrl) return null;
                try {
                  const videoUrl = await generateLipsync(speaker.imageUrl, chunkUrl, lipsyncModel);
                  if (cancelRef.current) return null;
                  setLipsyncProgress((p) => p + 1);
                  setDetail(`Lip-synced ${Math.min(idx + 1, segs.length)}/${segs.length} segments...`);
                  return videoUrl;
                } catch (e) {
                  console.error(`Segment ${idx} failed:`, e);
                  return null;
                }
              }),
            );
            videoUrls.push(...batchResults.filter(Boolean) as string[]);
            if (cancelRef.current) return;
          }

          if (videoUrls.length < 2) throw new Error(`Only ${videoUrls.length} segments generated — need at least 2`);

          // Merge
          setStage("merging"); setDetail("Merging all segments into final video...");
          const merged = await mergeVideos(videoUrls);
          if (cancelRef.current) return;

          setDetail("Adding original audio...");
          const final = await addAudioToVideo(merged, artifactsRef.current.audioUrl);
          if (cancelRef.current) return;

          setFinalVideoUrl(final);
          setStage("completed"); setDetail("");
          break;
        }
      }
    } catch (e) {
      if (cancelRef.current) return;
      setError(e instanceof Error ? e.message : "Pipeline failed");
      setStage("failed");
    } finally {
      setWorking(false);
    }
  }, [mode, topic, script, speaker1, speaker2, language, styleInstructions, autoMode, lipsyncModel]);

  // ─── Run Full Pipeline (from a given step) ─────────────

  const runFrom = useCallback(async (startStep: PodcastStage) => {
    const steps: PodcastStage[] = ["script", "portraits", "tts", "stt", "splitting"];
    const startIdx = steps.indexOf(startStep);
    if (startIdx === -1) return;

    for (let i = startIdx; i < steps.length; i++) {
      if (cancelRef.current) return;
      setWaitingApproval(null);
      await runStep(steps[i]);
      // If we paused for approval, stop the loop — user will call approveAndContinue
      if (!autoMode && APPROVAL_GATES.has(steps[i]) && i < steps.length - 1) return;
    }
  }, [runStep, autoMode]);

  // ─── Start Pipeline ─────────────────────────────────────

  const startPipeline = useCallback(() => {
    if (!speaker1.imageUrl || !speaker2.imageUrl) { setError("Please upload images for both speakers"); return; }
    if (mode === "topic" && !topic.trim()) { setError("Please enter a topic"); return; }
    if (mode === "script" && !script.trim()) { setError("Please enter a script"); return; }

    // Reset everything
    cancelRef.current = false;
    setError(null); setStudioPortrait1(null); setStudioPortrait2(null);
    setGeneratedScript(""); setAudioUrl(null); setSegments([]);
    setLipsyncProgress(0); setFinalVideoUrl(null); setWaitingApproval(null);
    artifactsRef.current = { script: "", portrait1: "", portrait2: "", audioUrl: "", segments: [] };

    runFrom("script");
  }, [mode, topic, script, speaker1, speaker2, runFrom]);

  // ─── Approve & Continue ─────────────────────────────────

  const approveAndContinue = useCallback(() => {
    const nextMap: Record<ApprovalGate, PodcastStage> = {
      script: "portraits",
      portraits: "tts",
      tts: "stt",
    };
    const next = waitingApproval ? nextMap[waitingApproval] : null;
    if (!next) return;
    setWaitingApproval(null);
    runFrom(next);
  }, [waitingApproval, runFrom]);

  // Persist completed podcast to history
  useEffect(() => {
    if (stage === "completed" && finalVideoUrl) {
      import("@/lib/history-store").then(({ addHistoryItem, getHistory }) => {
        if (getHistory().some((h) => h.mediaUrl === finalVideoUrl)) return;
        try {
          addHistoryItem({
            source: "podcast",
            mediaType: "video",
            prompt: artifactsRef.current.script?.slice(0, 200) || (mode === "topic" ? topic : "Podcast"),
            title: `${speaker1.name} × ${speaker2.name}`,
            modelName: "Podcast pipeline",
            mediaUrl: finalVideoUrl,
          });
        } catch { /* */ }
      });
    }
  }, [stage, finalVideoUrl, mode, topic, speaker1.name, speaker2.name]);

  const cancel = () => { cancelRef.current = true; setWorking(false); setWaitingApproval(null); setStage("idle"); };
  const reset = () => {
    cancelRef.current = true; setWorking(false); setWaitingApproval(null);
    setStage("idle"); setError(null); setDetail("");
    setGeneratedScript(""); setAudioUrl(null); setSegments([]);
    setStudioPortrait1(null); setStudioPortrait2(null);
    setLipsyncProgress(0); setFinalVideoUrl(null);
  };

  const currentIdx = PODCAST_STAGES.indexOf(stage);
  const totalSegs = segments.length || 1;
  const progress = stage === "completed" ? 100 : stage === "failed" || stage === "idle" ? 0
    : Math.round(((currentIdx + (stage === "lipsync" ? lipsyncProgress / totalSegs : 0.5)) / PODCAST_STAGES.length) * 100);

  return (
    <>
      <TopBar title="Podcast Studio" />
      <FalKeyGuard toolName="Podcast Studio">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* ── Input Section ── */}
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
          {/* Speaker Setup */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            {/* Speaker 1 */}
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <User size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-400">Speaker 1</span>
              </div>
              <div className="grid gap-3 grid-cols-[80px_1fr]">
                <ImageUpload value={speaker1.imageUrl} onChange={(url) => setSpeaker1((s) => ({ ...s, imageUrl: url }))} label="Photo" />
                <div className="space-y-2">
                  <input value={speaker1.name} onChange={(e) => setSpeaker1((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Name (e.g. Host)" className="h-8 w-full rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 text-xs text-foreground focus:outline-none" />
                  <CustomSelect options={VOICE_OPTIONS} value={speaker1.voice} onChange={(v) => v && setSpeaker1((s) => ({ ...s, voice: v }))} placeholder="Voice" />
                  {getVoiceMeta(speaker1.voice) && (
                    <p className="text-[10px] leading-snug text-foreground/40">{getVoiceMeta(speaker1.voice)!.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Speaker 2 */}
            <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <User size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-400">Speaker 2</span>
              </div>
              <div className="grid gap-3 grid-cols-[80px_1fr]">
                <ImageUpload value={speaker2.imageUrl} onChange={(url) => setSpeaker2((s) => ({ ...s, imageUrl: url }))} label="Photo" />
                <div className="space-y-2">
                  <input value={speaker2.name} onChange={(e) => setSpeaker2((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Name (e.g. Guest)" className="h-8 w-full rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 text-xs text-foreground focus:outline-none" />
                  <CustomSelect options={VOICE_OPTIONS} value={speaker2.voice} onChange={(v) => v && setSpeaker2((s) => ({ ...s, voice: v }))} placeholder="Voice" />
                  {getVoiceMeta(speaker2.voice) && (
                    <p className="text-[10px] leading-snug text-foreground/40">{getVoiceMeta(speaker2.voice)!.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setMode("topic")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${mode === "topic" ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/40"}`}>
              <Wand2 size={11} className="mr-1 inline" />Topic
            </button>
            <button onClick={() => setMode("script")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${mode === "script" ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/40"}`}>
              <Mic size={11} className="mr-1 inline" />Script
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => setAutoMode(!autoMode)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${autoMode ? "bg-[color:var(--accent)]/15 text-[color:var(--accent)]" : "bg-foreground/5 text-foreground/25"}`}>
                <Zap size={10} />
                {autoMode ? "Auto" : "Step-by-step"}
              </button>
            </div>
          </div>

          {/* Input */}
          {mode === "topic" ? (
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} disabled={isRunning}
              placeholder="Enter a topic... e.g. 'The future of AI video generation in 2026'"
              className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none disabled:opacity-50" />
          ) : (
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={8} disabled={isRunning}
              placeholder={`Host: Welcome back to the show!\nGuest: [excited] Great to be here.\nHost: So tell us about...\nGuest: Well, the thing is...`}
              className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-foreground/20 focus:outline-none disabled:opacity-50" />
          )}

          {/* Settings */}
          <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Language</label>
              <CustomSelect options={LANGUAGE_OPTIONS} value={language} onChange={(v) => v && setLanguage(v)} placeholder="Language" />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Lip-sync</label>
              <CustomSelect options={LIPSYNC_OPTIONS} value={lipsyncModel} onChange={(v) => v && setLipsyncModel(v as LipsyncModelId)} placeholder="Model" />
              <p className="mt-1 text-[10px] leading-snug text-foreground/40">{getLipsyncModel(lipsyncModel).description}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground/20">Style</label>
              <input value={styleInstructions} onChange={(e) => setStyleInstructions(e.target.value)}
                className="h-9 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 text-xs text-foreground focus:outline-none" />
            </div>
            <div className="flex items-end">
              {isRunning ? (
                <button onClick={cancel} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-500/80 text-xs font-semibold text-white">
                  <Square size={12} /> Stop
                </button>
              ) : (
                <button onClick={startPipeline} disabled={(!topic.trim() && mode === "topic") || (!script.trim() && mode === "script") || !speaker1.imageUrl || !speaker2.imageUrl || !!waitingApproval}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] text-xs font-semibold text-black disabled:opacity-30">
                  <Mic size={12} /> Create Podcast
                </button>
              )}
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
              {PODCAST_STAGES.map((s, i) => {
                const Icon = STAGE_ICONS[s] || Mic;
                const isDone = i < currentIdx || stage === "completed";
                const isCurrent = s === stage || (stage === "failed" && i === currentIdx);
                const isFailed = stage === "failed" && isCurrent;
                const isPaused = waitingApproval === s;
                return (
                  <div key={s} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
                    isFailed ? "bg-red-500/10 text-red-400"
                    : isPaused ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                    : isDone ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                    : isCurrent && working ? "bg-foreground/8 text-foreground"
                    : "text-foreground/12"
                  }`}>
                    {isDone && !isPaused ? <Check size={11} />
                      : isPaused ? <Pause size={11} />
                      : isCurrent && working ? <Loader2 size={11} className="animate-spin" />
                      : isFailed ? <AlertCircle size={11} />
                      : <Icon size={11} />}
                    {PODCAST_STAGE_LABELS[s]}
                  </div>
                );
              })}
            </div>
            {detail && <p className="mt-2.5 text-[11px] text-foreground/25">{detail}</p>}
            {stage === "lipsync" && segments.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {segments.map((_, i) => (
                    <div key={i} className={`size-2 rounded-full ${i < lipsyncProgress ? "bg-emerald-500" : "bg-foreground/8"}`} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-foreground/20">{lipsyncProgress}/{segments.length}</span>
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

        {/* ── Script Preview (with approval gate) ── */}
        {generatedScript && (
          <div className="mt-5">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/20">Script</h2>
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/50">{generatedScript}</pre>
            </div>
            {waitingApproval === "script" && (
              <ApproveButton onClick={approveAndContinue} label="Approve Script & Generate Portraits" />
            )}
          </div>
        )}

        {/* ── Studio Portraits (with approval gate) ── */}
        {(studioPortrait1 || studioPortrait2) && (
          <div className="mt-5">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/20">Studio Portraits</h2>
            <div className="flex gap-3">
              {studioPortrait1 && (
                <div className="text-center">
                  <img src={studioPortrait1} alt={speaker1.name} className="h-28 w-auto rounded-xl border border-blue-500/20" />
                  <p className="mt-1 text-[9px] font-semibold text-blue-400">{speaker1.name}</p>
                </div>
              )}
              {studioPortrait2 && (
                <div className="text-center">
                  <img src={studioPortrait2} alt={speaker2.name} className="h-28 w-auto rounded-xl border border-purple-500/20" />
                  <p className="mt-1 text-[9px] font-semibold text-purple-400">{speaker2.name}</p>
                </div>
              )}
            </div>
            {waitingApproval === "portraits" && (
              <ApproveButton onClick={approveAndContinue} label="Approve Portraits & Generate Audio" />
            )}
          </div>
        )}

        {/* ── Audio (with approval gate) ── */}
        {audioUrl && (
          <div className="mt-4">
            <AudioPlayer src={audioUrl} label="Generated Podcast Audio" />
            {waitingApproval === "tts" && (
              <ApproveButton onClick={approveAndContinue} label="Approve Audio & Generate Video" />
            )}
          </div>
        )}

        {/* ── Segments ── */}
        {segments.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/20">
              Segments ({segments.length})
            </h2>
            <div className="space-y-1">
              {segments.map((seg, i) => {
                const speakerIdx = seg.speakerId === "speaker_0" ? 0 : 1;
                const speaker = speakerIdx === 0 ? speaker1 : speaker2;
                return (
                  <div key={i} className={`flex items-start gap-2 rounded-lg border p-2 ${SPEAKER_BG[speakerIdx]}`}>
                    {speaker.imageUrl && (
                      <img src={speaker.imageUrl} alt="" className="size-6 shrink-0 rounded-full object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold ${SPEAKER_COLORS[speakerIdx]}`}>{speaker.name}</span>
                        <span className="text-[8px] font-mono text-foreground/15">
                          {seg.startTime.toFixed(1)}s — {seg.endTime.toFixed(1)}s
                        </span>
                        {i < lipsyncProgress && <Check size={10} className="text-emerald-500" />}
                      </div>
                      <p className="text-[10px] leading-relaxed text-foreground/40 line-clamp-2">{seg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Final Video ── */}
        {finalVideoUrl && (
          <div className="mt-6">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)]">Podcast Video</h2>
            <div className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--surface)] p-3">
              <video src={finalVideoUrl} controls autoPlay className="mx-auto w-full rounded-lg" style={{ maxHeight: 400 }} />
              <div className="mt-3 flex items-center gap-2">
                <a href={finalVideoUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-black">
                  <Download size={12} /> Download
                </a>
                <button onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-4 py-2 text-xs text-foreground/40 hover:text-foreground">
                  <RotateCcw size={12} /> New Podcast
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── How it works ── */}
        <HowItWorks
          title="How Podcast Studio works"
          description="Two photos + a topic or script become a full video podcast with synchronized lip-sync per speaker — all through fal.ai."
          pipeline={[
            {
              label: "Script",
              model: "anthropic/claude-opus-4-6",
              description: "If you give a topic, Claude writes a natural 2-speaker conversation. You can also paste your own script.",
            },
            {
              label: "Studio portraits",
              model: "fal-ai/bytedance/seedream/v5/lite/edit",
              modelUrl: "https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/edit",
              description: "Seedream Edit places each speaker's face into a podcast studio scene (left for Host, right for Guest) while keeping their appearance.",
            },
            {
              label: "Multi-speaker audio",
              model: "fal-ai/gemini-3.1-flash-tts",
              modelUrl: "https://fal.ai/models/fal-ai/gemini-3.1-flash-tts",
              description: "Gemini TTS renders the entire conversation with two distinct voices and emotional cues.",
            },
            {
              label: "Diarization",
              model: "fal-ai/elevenlabs/speech-to-text/scribe-v2",
              modelUrl: "https://fal.ai/models/fal-ai/elevenlabs/speech-to-text/scribe-v2",
              description: "Scribe labels every word with a speaker ID and precise timestamps.",
            },
            {
              label: "Split audio",
              model: "fal-ai/workflow-utilities/split-audio",
              modelUrl: "https://fal.ai/models/fal-ai/workflow-utilities",
              description: "Audio is cut into clean per-speaker segments at the midpoint between turns to prevent bleed.",
            },
            {
              label: "Lip-sync",
              model: getLipsyncModel(lipsyncModel).endpoint,
              modelUrl: getLipsyncModel(lipsyncModel).endpointUrl,
              description: `${getLipsyncModel(lipsyncModel).name} animates each studio portrait to match its audio chunk (3 segments in parallel).`,
            },
            {
              label: "Merge",
              model: "fal-ai/ffmpeg-api",
              description: "FFmpeg concatenates all clips and overlays the original high-quality audio for the final video.",
            },
          ]}
          notes={[
            "Step-by-step mode pauses after script, portraits, and audio for your approval. Auto mode runs the whole pipeline without stopping.",
            "Audio is split exactly halfway through silence gaps so no speaker bleeds into another's segment.",
            "Runs entirely with your fal.ai key — we never see your portraits or audio.",
          ]}
        />
      </div>
      </FalKeyGuard>
    </>
  );
}
