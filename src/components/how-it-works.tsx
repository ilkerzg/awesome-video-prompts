"use client";

import { ArrowRight, ExternalLink, Cpu, DollarSign, Clock as ClockIcon } from "lucide-react";

export interface PipelineStep {
  label: string;
  model?: string;
  modelUrl?: string;
  description: string;
}

export function HowItWorks({
  title = "How it works",
  description,
  pipeline,
  notes,
}: {
  title?: string;
  description?: string;
  pipeline: PipelineStep[];
  notes?: string[];
}) {
  // Unique model list for pricing links
  const models = Array.from(
    new Map(
      pipeline
        .filter((s) => s.model)
        .map((s) => [s.model!, { model: s.model!, url: s.modelUrl }]),
    ).values(),
  );

  return (
    <section className="mt-10 border-t border-[color:var(--separator)] pt-10">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/45">{description}</p>
        )}
      </div>

      {/* Pipeline */}
      <div className="mt-5 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Cpu size={12} className="text-[color:var(--accent)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Pipeline</h3>
        </div>
        <div className="space-y-2">
          {pipeline.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] p-3"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[10px] font-bold text-[color:var(--accent)]">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{step.label}</span>
                  {step.model && (
                    step.modelUrl ? (
                      <a
                        href={step.modelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md bg-[color:var(--accent)]/10 px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--accent)] hover:underline"
                      >
                        {step.model}
                        <ExternalLink size={8} />
                      </a>
                    ) : (
                      <span className="rounded-md bg-[color:var(--accent)]/10 px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--accent)]">
                        {step.model}
                      </span>
                    )
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground/45">{step.description}</p>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight size={10} className="mt-2 shrink-0 text-foreground/15" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing — just link out to fal.ai, never invent numbers */}
      {models.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign size={12} className="text-emerald-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Pricing</h3>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-foreground/45">
            Each model has its own pricing on fal.ai. Check the model page for the live rate — charges appear on your fal.ai account.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {models.map((m) =>
              m.url ? (
                <a
                  key={m.model}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] px-2 py-1 font-mono text-[10px] text-foreground/50 hover:border-[color:var(--accent)]/30 hover:text-[color:var(--accent)]"
                >
                  {m.model}
                  <ExternalLink size={8} />
                </a>
              ) : (
                <span
                  key={m.model}
                  className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--surface-secondary)] px-2 py-1 font-mono text-[10px] text-foreground/50"
                >
                  {m.model}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClockIcon size={12} className="text-foreground/40" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Notes</h3>
          </div>
          <ul className="space-y-1.5">
            {notes.map((note, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/50">
                <span className="text-foreground/25">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
