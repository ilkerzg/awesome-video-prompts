"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, Braces, Camera, MessageSquareText } from "lucide-react";

type SmallTool = {
  title: string;
  tag: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const SECONDARY: SmallTool[] = [
  {
    title: "Generate Video",
    tag: "quick t2v / i2v",
    href: "/generate",
    icon: Sparkles,
  },
  {
    title: "Prompt Generator",
    tag: "idea → prompt",
    href: "/prompt-gen",
    icon: MessageSquareText,
  },
  {
    title: "JSON Prompt",
    tag: "structured input",
    href: "/json-prompt",
    icon: Braces,
  },
  {
    title: "Shot Composer",
    tag: "layout shots",
    href: "/shot-composer",
    icon: Camera,
  },
];

export function SecondaryTools() {
  return (
    <section className="border-t border-[color:var(--separator)]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-3xl">
              More tools
            </h2>
            <p className="mt-1.5 text-sm text-foreground/50">
              Smaller primitives you'll reach for mid-workflow.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center gap-4 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 transition-colors hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--accent)]/5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                <tool.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {tool.title}
                  </h3>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-foreground/25 transition-colors group-hover:text-[color:var(--accent)]"
                  />
                </div>
                <p className="truncate text-[11px] uppercase tracking-wider text-foreground/35">
                  {tool.tag}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
