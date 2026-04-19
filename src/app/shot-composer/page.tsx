"use client";

import { useState, useMemo, useRef } from "react";
import { TopBar } from "@/components/topbar";
import { SHOT_CATEGORIES } from "@/lib/shot-categories";
import { ArrowRight, ArrowLeft, Check, Copy, Wand2, Play, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ShotComposerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = SHOT_CATEGORIES[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === SHOT_CATEGORIES.length - 1;
  const selectedInStep = selections[step.id];

  const select = (optId: string) => {
    setSelections((prev) => (prev[step.id] === optId ? { ...prev, [step.id]: "" } : { ...prev, [step.id]: optId }));
  };

  const next = () => { if (!isLast) setCurrentStep(currentStep + 1); };
  const prev = () => { if (!isFirst) setCurrentStep(currentStep - 1); };

  const prompt = useMemo(() => {
    return SHOT_CATEGORIES.map((cat) => {
      const sel = selections[cat.id];
      if (!sel) return null;
      const opt = cat.options.find((o) => o.id === sel);
      return opt ? opt.label : null;
    }).filter(Boolean).join(", ");
  }, [selections]);

  const handleCopy = () => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const activeCount = Object.values(selections).filter(Boolean).length;

  // Scroll step pills
  const scrollPills = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <>
      <TopBar title="Shot Composer" />
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
        {/* TOP — Category pills with scroll */}
        <div className="shrink-0 border-b border-[color:var(--separator)] px-2 py-2.5 md:px-4">
          <div className="flex items-center gap-1">
            <button onClick={() => scrollPills("left")} className="shrink-0 rounded-md p-1 text-foreground/20 hover:text-foreground/50">
              <ChevronLeft size={14} />
            </button>
            <div ref={scrollRef} className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
              {SHOT_CATEGORIES.map((cat, i) => {
                const done = !!selections[cat.id];
                const active = i === currentStep;
                return (
                  <button key={cat.id} onClick={() => setCurrentStep(i)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all whitespace-nowrap ${
                      active ? "bg-foreground text-background" : done ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]" : "text-foreground/20 hover:text-foreground/40"
                    }`}
                  >
                    {done && !active && <Check size={10} />}
                    {cat.name}
                  </button>
                );
              })}
            </div>
            <button onClick={() => scrollPills("right")} className="shrink-0 rounded-md p-1 text-foreground/20 hover:text-foreground/50">
              <ChevronRight size={14} />
            </button>
            <span className="ml-2 shrink-0 text-[10px] text-foreground/20">{SHOT_CATEGORIES.length} categories</span>
          </div>
        </div>

        {/* MIDDLE — scrollable options */}
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{step.name}</h2>
            <p className="mt-0.5 text-xs text-foreground/30">{step.description} · {step.options.length} options</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {step.options.map((opt) => {
              const active = selectedInStep === opt.id;
              const isHovered = hoveredVideo === opt.id;
              return (
                <button key={opt.id} onClick={() => select(opt.id)}
                  onMouseEnter={() => setHoveredVideo(opt.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  className={`group overflow-hidden rounded-2xl border text-left transition-all ${
                    active ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/[0.04] ring-1 ring-[color:var(--accent)]/20" : "border-[color:var(--border-soft)] bg-[color:var(--surface)] hover:border-[color:var(--border-soft-strong)]"
                  }`}
                >
                  {/* Video/Image preview */}
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {opt.video && isHovered ? (
                      <video src={opt.video} muted loop autoPlay playsInline className="size-full object-cover" />
                    ) : opt.thumbnail ? (
                      <img src={opt.thumbnail} alt={opt.label} className="size-full object-cover transition-transform group-hover:scale-105" draggable={false} />
                    ) : opt.video ? (
                      <video src={opt.video} muted preload="metadata" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-[color:var(--surface-secondary)]">
                        <Play size={20} className="text-foreground/10" />
                      </div>
                    )}
                    {opt.video && !isHovered && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex size-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                          <Play size={12} className="ml-0.5 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    {active && <div className="absolute inset-0 ring-2 ring-inset ring-[color:var(--accent)] rounded-t-2xl" />}
                  </div>
                  {/* Label */}
                  <div className="p-3">
                    <p className={`text-xs font-semibold capitalize ${active ? "text-[color:var(--accent)]" : "text-foreground/70"}`}>{opt.label}</p>
                    <p className={`mt-0.5 line-clamp-2 text-[10px] leading-relaxed ${active ? "text-[color:var(--accent)]/50" : "text-foreground/20"}`}>{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM — fixed nav + prompt */}
        <div className="shrink-0 space-y-2 border-t border-[color:var(--separator)] px-4 py-3 md:px-6">
          {prompt && (
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--accent)]/15 bg-[color:var(--surface)] px-3 py-2">
              <span className="shrink-0 text-[10px] font-semibold text-[color:var(--accent)]">{activeCount}/{SHOT_CATEGORIES.length}</span>
              <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/40">{prompt}</p>
              <button onClick={handleCopy} className="shrink-0 rounded-md bg-[color:var(--default)] px-2 py-1 text-[10px] font-medium text-foreground/50">
                <Copy size={10} className="inline mr-1" />{copied ? "Copied!" : "Copy"}
              </button>
              <Link href="/generate" className="shrink-0 rounded-md bg-[color:var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-black">
                <Wand2 size={10} className="inline mr-1" />Generate
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={prev} disabled={isFirst} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-foreground/40 hover:text-foreground disabled:opacity-20">
              <ArrowLeft size={16} />Back
            </button>
            <span className="text-[10px] text-foreground/15">Step {currentStep + 1} of {SHOT_CATEGORIES.length}</span>
            {selectedInStep && !isLast ? (
              <button onClick={next} className="flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90">
                Next<ArrowRight size={16} />
              </button>
            ) : isLast && prompt ? (
              <Link href="/generate" className="flex items-center gap-1.5 rounded-xl bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:opacity-90">
                <Wand2 size={16} />Generate
              </Link>
            ) : (
              <button onClick={next} disabled={isLast} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-foreground/20 disabled:opacity-20">
                Skip<ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
