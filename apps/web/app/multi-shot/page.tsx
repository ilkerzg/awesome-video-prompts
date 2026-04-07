"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { Input } from "@workspace/ui/components/ui/input";
import { Label } from "@workspace/ui/components/ui/label";
import { Dialog, DialogContent } from "@workspace/ui/components/ui/dialog";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Film02Icon,
  Image01Icon,
  Video01Icon,
  MusicNote01Icon,
  CopyIcon,
  Clock01Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Upload01Icon,
  Delete02Icon,
  Settings01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { DashboardSubheader } from "@workspace/ui/components/dashboard-subheader";
import {
  useMultiShotPipeline,
  IMAGE_MODELS,
  LLM_MODELS,
  VIDEO_MODELS,
  type LlmModel,
  type ImageModelId,
  type VideoModelId,
  type PipelineStage,
} from "@workspace/ui/hooks/use-multi-shot-generator";
import { getFalApiKey } from "@workspace/ui/lib/fal-api-utils";
import {
  createGitHubIssueUrl,
  buildMultiShotContribution,
} from "@workspace/ui/lib/github-issue";

// ── Small components ──────────────────────────────────

function Btn({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted/50"} ${className}`}
    >
      {children}
    </button>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

// Map of reference tags to their media URLs
type RefMap = Record<
  string,
  { url: string; type: "image" | "video" | "audio" }
>;

function RefTag({
  tag,
  refMap,
  onClickRef,
}: {
  tag: string;
  refMap: RefMap;
  onClickRef: (tag: string) => void;
}) {
  const ref = refMap[tag];
  const [showPreview, setShowPreview] = useState(false);

  if (!ref) {
    return <span className="text-primary font-medium">{tag}</span>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <button
        type="button"
        onClick={() => onClickRef(tag)}
        className="text-primary font-semibold underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer"
      >
        {tag}
      </button>
      {showPreview && ref.type === "image" && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none block">
          <span className="rounded-lg overflow-hidden border border-border shadow-xl bg-background p-1 block">
            <img src={ref.url} alt={tag} className="w-40 h-28 object-cover rounded" />
            <span className="text-[10px] text-center text-muted-foreground mt-1 pb-0.5 block">{tag}</span>
          </span>
        </span>
      )}
      {showPreview && ref.type === "video" && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none block">
          <span className="rounded-lg overflow-hidden border border-border shadow-xl bg-background p-1 block">
            <video src={ref.url} className="w-40 h-28 object-cover rounded" muted autoPlay loop playsInline />
            <span className="text-[10px] text-center text-muted-foreground mt-1 pb-0.5 block">{tag}</span>
          </span>
        </span>
      )}
      {showPreview && ref.type === "audio" && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none block">
          <span className="rounded-lg border border-border shadow-xl bg-background p-2 inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={MusicNote01Icon} className="size-4 text-primary" />
            <span className="text-xs text-foreground">{tag}</span>
          </span>
        </span>
      )}
    </span>
  );
}

function PromptWithRefs({
  text,
  refMap,
  onClickRef,
}: {
  text: string;
  refMap: RefMap;
  onClickRef: (tag: string) => void;
}) {
  const refPattern = /(@(?:Image|Element|Video|Audio)\d+)/g;
  const parts = text.split(refPattern);

  return (
    <>
      {parts.map((part, i) => {
        const isRef = /^@(?:Image|Element|Video|Audio)\d+$/.test(part);
        return isRef ? (
          <RefTag key={i} tag={part} refMap={refMap} onClickRef={onClickRef} />
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

function StageIndicator({
  stage,
  message,
}: {
  stage: PipelineStage;
  message: string;
}) {
  const stages: { key: PipelineStage; label: string }[] = [
    { key: "uploading-files", label: "Upload" },
    { key: "generating-prompts", label: "Prompts" },
    { key: "generating-images", label: "Images" },
    { key: "generating-video", label: "Video" },
  ];
  const order = [
    "uploading-files",
    "generating-prompts",
    "generating-images",
    "generating-video",
    "complete",
  ];
  const cur = order.indexOf(stage);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {stages.map((s, i) => {
          const idx = order.indexOf(s.key);
          const done = cur > idx;
          const active = stage === s.key;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && (
                <div
                  className={`h-px w-4 ${done ? "bg-primary" : "bg-border"}`}
                />
              )}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${done ? "bg-primary/10 text-primary" : active ? "bg-orange/10 text-orange border border-orange/30" : "bg-muted text-muted-foreground"}`}
              >
                {done ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-3"
                  />
                ) : active ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="size-3 animate-spin"
                  />
                ) : null}
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

const SHOT_COLORS = [
  {
    bg: "bg-blue/10",
    border: "border-blue/30",
    text: "text-blue",
    dot: "bg-blue",
  },
  {
    bg: "bg-purple/10",
    border: "border-purple/30",
    text: "text-purple",
    dot: "bg-purple",
  },
  {
    bg: "bg-orange/10",
    border: "border-orange/30",
    text: "text-orange",
    dot: "bg-orange",
  },
] as const;

// ── Page ──────────────────────────────────────────────

export default function MultiShotPage() {
  const { toast } = useToast();
  const { state, runPipeline, reset } = useMultiShotPipeline();

  const [sceneDescription, setSceneDescription] = useState("");
  const [llmModel, setLlmModel] = useState<LlmModel>("google/gemini-3-flash-preview");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [referenceVideoFile, setReferenceVideoFile] = useState<File | null>(
    null,
  );
  const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(
    null,
  );
  const [additionalImageCount, setAdditionalImageCount] = useState(2);
  const [imageModelId, setImageModelId] =
    useState<ImageModelId>("nano-banana-2");
  const [videoDuration, setVideoDuration] = useState("auto");
  const [videoModelId, setVideoModelId] = useState<VideoModelId>("seedance-2");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [hasFalKey, setHasFalKey] = useState(false);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    setHasFalKey(!!getFalApiKey());
  }, []);

  const isRunning =
    state.stage !== "idle" &&
    state.stage !== "complete" &&
    state.stage !== "error";
  const hasUserImage = !!(referenceImage || referenceImageUrl.trim());
  const hasResults = !!(
    state.prompts ||
    state.generatedImageUrls.length ||
    state.generatedStartImageUrl ||
    state.videoUrl
  );
  const showRight = isRunning || hasResults || state.error;

  const handleGenerate = () => {
    const currentHasFalKey = !!getFalApiKey();
    setHasFalKey(currentHasFalKey);
    if (!currentHasFalKey) {
      toast({
        title: "FAL API key required",
        description: "Use the key icon in the header.",
        variant: "destructive",
      });
      return;
    }
    runPipeline({
      sceneDescription,
      llmModel,
      referenceImage,
      referenceImageUrl,
      referenceVideoFile,
      referenceAudioFile,
      additionalImageCount,
      imageModelId,
      videoModelId,
      videoDuration,
      videoAspectRatio,
      generateAudio,
    });
  };

  const handleClear = () => {
    setSceneDescription("");
    setReferenceImage(null);
    setReferenceImageUrl("");
    setReferenceVideoFile(null);
    setReferenceAudioFile(null);
    reset();
  };

  const copy = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: label });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  // Modal state for reference preview
  const [modalRef, setModalRef] = useState<{
    tag: string;
    url: string;
    type: "image" | "video" | "audio";
  } | null>(null);

  // Build reference map: @Image1 → url, @Element1 → url, @Video1 → url, @Audio1 → url
  const refMap: RefMap = {};
  {
    let imgIdx = 1;
    let elementIdx = 1;
    if (state.uploadedRefImageUrl) {
      refMap[`@Image${imgIdx}`] = {
        url: state.uploadedRefImageUrl,
        type: "image",
      };
      refMap[`@Element${elementIdx}`] = {
        url: state.uploadedRefImageUrl,
        type: "image",
      };
      imgIdx++;
      elementIdx++;
    }
    for (const url of state.generatedImageUrls) {
      refMap[`@Image${imgIdx}`] = { url, type: "image" };
      refMap[`@Element${elementIdx}`] = { url, type: "image" };
      imgIdx++;
      elementIdx++;
    }
    if (state.uploadedRefVideoUrl) {
      refMap["@Video1"] = { url: state.uploadedRefVideoUrl, type: "video" };
    }
    if (state.uploadedRefAudioUrl) {
      refMap["@Audio1"] = { url: state.uploadedRefAudioUrl, type: "audio" };
    }
  }

  const handleClickRef = useCallback(
    (tag: string) => {
      const ref = refMap[tag];
      if (ref) setModalRef({ tag, ...ref });
    },
    [refMap],
  );

  const shotColor = (i: number) => {
    return SHOT_COLORS[i % SHOT_COLORS.length]!;
  };

  return (
    <div className="w-full">
      <DashboardSubheader
        title="Multi-Shot Generator"
        description="Design cinematic multi-shot video sequences with AI — prompts, reference images, and video in one pipeline"
        icon={Film02Icon}
        iconBoxVariant="cyan"
      />

      <div className="px-6 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* ════════ LEFT: Forms ════════ */}
            <div className="space-y-4">
              {/* Scene Description */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                      Scene Description
                    </CardTitle>
                    {!hasFalKey && (
                      <span className="text-xs text-orange-400 border border-orange/30 bg-orange/10 px-2 py-0.5 rounded-md">
                        Set FAL API key in header
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="e.g., A lone astronaut discovers an ancient alien structure on Mars during a dust storm..."
                    value={sceneDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setSceneDescription(e.target.value)
                    }
                    rows={4}
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Label className="text-xs text-muted-foreground">
                        LLM:
                      </Label>
                      {LLM_MODELS.map((m) => (
                        <Btn
                          key={m.id}
                          active={llmModel === m.id}
                          onClick={() => setLlmModel(m.id)}
                          className="text-xs px-2 py-1"
                        >
                          {m.label}
                        </Btn>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sceneDescription.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HugeiconsIcon icon={Image01Icon} className="size-4" />
                    References
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Your Image (optional)
                      </Label>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        id="ref-img"
                        onChange={(e) =>
                          setReferenceImage(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="ref-img"
                        className="flex items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/20 transition-colors"
                      >
                        {referenceImage ? (
                          <span className="flex items-center gap-2 text-xs">
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-4 text-primary"
                            />
                            <span className="truncate max-w-[140px]">
                              {referenceImage.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                setReferenceImage(null);
                              }}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                className="size-3"
                              />
                            </Button>
                          </span>
                        ) : (
                          <div className="text-center">
                            <HugeiconsIcon
                              icon={Upload01Icon}
                              className="size-5 text-muted-foreground mb-0.5 mx-auto"
                            />
                            <p className="text-xs text-muted-foreground">
                              Upload image
                            </p>
                          </div>
                        )}
                      </label>
                      {!referenceImage && (
                        <Input
                          type="url"
                          placeholder="Or paste URL..."
                          value={referenceImageUrl}
                          onChange={(e) => setReferenceImageUrl(e.target.value)}
                          className="text-xs h-8"
                        />
                      )}
                    </div>

                    {/* AI refs */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          AI-Generated References
                        </Label>
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4].map((n) => (
                            <Btn
                              key={n}
                              active={additionalImageCount === n}
                              onClick={() => setAdditionalImageCount(n)}
                              className="w-8 text-xs px-0 py-1"
                            >
                              {n}
                            </Btn>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {additionalImageCount === 0
                            ? "No additional images"
                            : hasUserImage
                              ? `${additionalImageCount} via editing`
                              : `${additionalImageCount} from text`}
                        </p>
                      </div>
                      {additionalImageCount > 0 && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            Image Model
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {IMAGE_MODELS.map((m) => (
                              <Btn
                                key={m.id}
                                active={imageModelId === m.id}
                                onClick={() => setImageModelId(m.id)}
                                className="text-xs px-2 py-1"
                              >
                                {m.label}
                              </Btn>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video & Audio refs */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <HugeiconsIcon icon={Video01Icon} className="size-3" />{" "}
                        Video (optional)
                      </Label>
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        id="ref-vid"
                        onChange={(e) =>
                          setReferenceVideoFile(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="ref-vid"
                        className="flex items-center justify-center w-full h-10 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/20 text-xs text-muted-foreground"
                      >
                        {referenceVideoFile ? (
                          <span className="flex items-center gap-1">
                            {referenceVideoFile.name.slice(0, 20)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                setReferenceVideoFile(null);
                              }}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                className="size-2.5"
                              />
                            </Button>
                          </span>
                        ) : (
                          "MP4/MOV"
                        )}
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <HugeiconsIcon
                          icon={MusicNote01Icon}
                          className="size-3"
                        />{" "}
                        Audio (optional)
                      </Label>
                      <input
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        id="ref-aud"
                        onChange={(e) =>
                          setReferenceAudioFile(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="ref-aud"
                        className="flex items-center justify-center w-full h-10 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/20 text-xs text-muted-foreground"
                      >
                        {referenceAudioFile ? (
                          <span className="flex items-center gap-1">
                            {referenceAudioFile.name.slice(0, 20)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                setReferenceAudioFile(null);
                              }}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                className="size-2.5"
                              />
                            </Button>
                          </span>
                        ) : (
                          "MP3/WAV"
                        )}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Settings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HugeiconsIcon icon={Settings01Icon} className="size-4" />
                    Video Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Model</Label>
                      <div className="flex flex-col gap-1">
                        {VIDEO_MODELS.map((m) => (
                          <Btn
                            key={m.id}
                            active={videoModelId === m.id}
                            onClick={() => setVideoModelId(m.id)}
                            className="text-xs px-2 py-1"
                          >
                            {m.label}
                          </Btn>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Duration</Label>
                      <div className="flex flex-wrap gap-1">
                        {["auto", "5", "8", "10", "12", "15"].map((d) => (
                          <Btn
                            key={d}
                            active={videoDuration === d}
                            onClick={() => setVideoDuration(d)}
                            className="text-xs px-2 py-1"
                          >
                            {d === "auto" ? "Auto" : `${d}s`}
                          </Btn>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Aspect Ratio
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {["16:9", "9:16", "1:1", "21:9", "4:3"].map((ar) => (
                          <Btn
                            key={ar}
                            active={videoAspectRatio === ar}
                            onClick={() => setVideoAspectRatio(ar)}
                            className="text-xs px-2 py-1"
                          >
                            {ar}
                          </Btn>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Audio</Label>
                      <div className="flex gap-1">
                        <Btn
                          active={generateAudio}
                          onClick={() => setGenerateAudio(true)}
                          className="text-xs px-2 py-1"
                        >
                          On
                        </Btn>
                        <Btn
                          active={!generateAudio}
                          onClick={() => setGenerateAudio(false)}
                          className="text-xs px-2 py-1"
                        >
                          Off
                        </Btn>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {videoModelId === "kling-v3"
                      ? "Kling v3 Pro — multi_prompt shots, @Image1→@Element1 character references"
                      : "Seedance 2.0 — shots merged into a single flowing narrative prompt with @Image references"}
                  </div>
                </CardContent>
              </Card>

              {/* Generate */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isRunning || !sceneDescription.trim() || !hasFalKey}
                  className="gap-2 h-9"
                >
                  <HugeiconsIcon
                    icon={isRunning ? Loading03Icon : Film02Icon}
                    className={`size-4 ${isRunning ? "animate-spin" : ""}`}
                  />
                  {isRunning ? "Generating..." : "Generate Multi-Shot"}
                </Button>
                {(sceneDescription || hasResults) && (
                  <Button variant="outline" onClick={handleClear} className="h-9">
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* ════════ RIGHT: Results ════════ */}
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">
             <div className="border border-border rounded-xl bg-background overflow-hidden divide-y divide-border">

              {/* Pipeline progress */}
              {state.stage !== "idle" && (
                <div className="px-4 py-3">
                  <StageIndicator
                    stage={state.stage}
                    message={state.stageMessage}
                  />
                </div>
              )}

              {/* Error */}
              {state.error && (
                <div className="px-4 py-3 text-sm text-red-400 bg-red/5">
                  {state.error}
                </div>
              )}

              {/* Shot Timeline — or skeleton */}
              {state.prompts ? (
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                      Shot Timeline — {state.prompts.shots.length} shot
                      {state.prompts.shots.length > 1 ? "s" : ""} •{" "}
                      {state.prompts.total_duration}s
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() =>
                        copy(JSON.stringify(state.prompts, null, 2), "JSON")
                      }
                    >
                      <HugeiconsIcon icon={CopyIcon} className="size-3" /> JSON
                    </Button>
                  </div>
                    {/* Timeline bar */}
                    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                      {state.prompts.shots.map((shot, i) => {
                        const c = shotColor(i);
                        const w =
                          (Number.parseInt(shot.duration, 10) /
                            Number.parseInt(
                              state.prompts!.total_duration,
                              10,
                            )) *
                          100;
                        return (
                          <div
                            key={i}
                            className={`${c.dot} rounded-full`}
                            style={{ width: `${w}%` }}
                          />
                        );
                      })}
                    </div>
                    {/* Shot cards */}
                    <div className="space-y-2">
                      {state.prompts.shots.map((shot, i) => {
                        const c = shotColor(i);
                        return (
                          <div
                            key={i}
                            className={`rounded-lg border ${c.border} ${c.bg} p-3 space-y-1.5`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-2 h-2 rounded-full ${c.dot}`}
                                />
                                <span className="text-xs font-semibold">
                                  Shot {shot.shot_number}
                                </span>
                                <span className={`text-xs ${c.text}`}>
                                  {shot.duration}s
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() =>
                                  copy(shot.prompt, `Shot ${shot.shot_number}`)
                                }
                              >
                                <HugeiconsIcon
                                  icon={CopyIcon}
                                  className="size-2.5"
                                />
                              </Button>
                            </div>
                            <span className="text-xs leading-relaxed text-foreground/90 block">
                              <PromptWithRefs
                                text={shot.prompt}
                                refMap={refMap}
                                onClickRef={handleClickRef}
                              />
                            </span>
                            {shot.references.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {shot.references.map((ref) => (
                                  <button
                                    key={ref}
                                    type="button"
                                    onClick={() => handleClickRef(ref)}
                                    className="rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    {ref}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
              ) : showRight ? (
                <div className="px-4 py-3 space-y-3">
                  <span className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                    Shot Timeline
                  </span>
                  <Skeleton className="h-2 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <HugeiconsIcon icon={Film02Icon} className="size-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Results will appear here</p>
                  <p className="text-xs mt-1">Describe your scene and click Generate</p>
                </div>
              )}

              {/* Generated Images — or skeleton */}
              {state.generatedImageUrls.length > 0 ? (
                <div className="px-4 py-3 space-y-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={Image01Icon} className="size-4" />
                    Reference Images
                  </span>
                    <div className="grid grid-cols-2 gap-2">
                      {state.generatedImageUrls.map((url, i) => {
                        const tag = `@Image${(state.uploadedRefImageUrl ? 2 : 1) + i}`;
                        const role = state.prompts?.reference_image_roles.find(
                          (item) => item.tag === tag,
                        );

                        return (
                          <div
                            key={i}
                            className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted"
                          >
                            <img
                              src={url}
                              alt={`Ref ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                              {tag}
                            </div>
                            {role && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-2 text-white">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                  {role.role}
                                </p>
                                <p className="text-[10px] text-white/80 leading-relaxed">
                                  {role.purpose}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
              ) : isRunning &&
                state.stage !== "generating-prompts" &&
                additionalImageCount > 0 ? (
                <div className="px-4 py-3 space-y-2">
                  <span className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={Image01Icon} className="size-4" />
                    Reference Images
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: additionalImageCount }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video w-full" />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Base Image Prompt */}
              {state.prompts?.base_image_prompt && (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Base Image Prompt</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                      onClick={() => copy(state.prompts!.base_image_prompt, "Base prompt")}>
                      <HugeiconsIcon icon={CopyIcon} className="size-2.5" /> Copy
                    </Button>
                  </div>
                  {state.generatedStartImageUrl && (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={state.generatedStartImageUrl} alt="Generated start frame" className="aspect-video w-full object-cover" />
                    </div>
                  )}
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs leading-relaxed">{state.prompts.base_image_prompt}</p>
                  </div>
                </div>
              )}

              {/* Video */}
              {state.videoUrl ? (
                <div className="px-4 py-3 space-y-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={Film02Icon} className="size-4" />
                    Generated Video
                  </span>
                  <video src={state.videoUrl} controls className="w-full rounded-lg" />
                </div>
              ) : isRunning && state.stage === "generating-video" ? (
                <div className="px-4 py-3 space-y-2">
                  <span className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={Film02Icon} className="size-4" /> Video
                  </span>
                  <Skeleton className="aspect-video w-full" />
                </div>
              ) : null}

              {/* Share to Gallery */}
              {state.stage === "complete" && state.prompts && (
                <div className="px-4 py-3 space-y-2 bg-primary/5">
                  <p className="text-sm font-medium text-foreground">Share to Gallery</p>
                  <div className="flex gap-2">
                    <Input placeholder="Your name / username" value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)} className="text-xs h-8 flex-1" />
                    <Button size="sm" className="gap-1.5 h-8" disabled={!authorName.trim()}
                      onClick={() => {
                        const contribution = buildMultiShotContribution({
                          title: sceneDescription.slice(0, 80),
                          description: sceneDescription,
                          shots: state.prompts!.shots,
                          totalDuration: state.prompts!.total_duration,
                          baseImagePrompt: state.prompts!.base_image_prompt || "",
                          videoModelId,
                          videoUrl: state.videoUrl || undefined,
                          thumbnailUrl: state.generatedImageUrls[0] || state.uploadedRefImageUrl || undefined,
                          generatedImageUrls: state.generatedImageUrls,
                          author: authorName.trim(),
                          tags: ["multi-shot", videoModelId],
                        });
                        const url = createGitHubIssueUrl({
                          type: "multi-shot-prompt",
                          title: sceneDescription.slice(0, 60),
                          description: sceneDescription,
                          jsonData: contribution,
                          author: authorName.trim(),
                        });
                        window.open(url, "_blank");
                      }}>
                      Submit to Gallery
                    </Button>
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              {state.prompts && (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Raw JSON</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                      onClick={() => copy(JSON.stringify(state.prompts, null, 2), "JSON")}>
                      <HugeiconsIcon icon={CopyIcon} className="size-2.5" /> Copy
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-3 overflow-x-auto max-h-[200px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(state.prompts, null, 2)}</pre>
                  </div>
                </div>
              )}

             </div>{/* end stacked container */}
            </div>
          </div>
        </div>
      </div>

      {/* Reference preview modal */}
      <Dialog open={!!modalRef} onOpenChange={() => setModalRef(null)}>
        <DialogContent className="max-w-2xl p-2">
          {modalRef?.type === "image" && (
            <div>
              <img
                src={modalRef.url}
                alt={modalRef.tag}
                className="w-full rounded-lg"
              />
              <p className="text-sm text-center text-muted-foreground mt-2">
                {modalRef.tag}
              </p>
            </div>
          )}
          {modalRef?.type === "video" && (
            <div>
              <video
                src={modalRef.url}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
              <p className="text-sm text-center text-muted-foreground mt-2">
                {modalRef.tag}
              </p>
            </div>
          )}
          {modalRef?.type === "audio" && (
            <div className="p-6 text-center">
              <HugeiconsIcon
                icon={MusicNote01Icon}
                className="size-10 mx-auto mb-3 text-primary"
              />
              <p className="text-sm text-foreground mb-3">{modalRef.tag}</p>
              <audio src={modalRef.url} controls className="w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
