"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Key, AlertCircle, ArrowRight, Shield, ExternalLink } from "lucide-react";
import { hasFalKey } from "@/lib/fal-client";

/**
 * Blocks children until a fal.ai API key is present in localStorage
 * (or NEXT_PUBLIC_FAL_KEY is set in dev). Shows a friendly CTA to /settings.
 */
export function FalKeyGuard({
  children,
  toolName = "this tool",
}: {
  children: React.ReactNode;
  toolName?: string;
}) {
  const [ready, setReady] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(hasFalKey());
    setReady(true);

    // Re-check when the tab regains focus or storage changes elsewhere
    const recheck = () => setHasKey(hasFalKey());
    window.addEventListener("focus", recheck);
    window.addEventListener("storage", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("storage", recheck);
    };
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-[color:var(--surface)]" />
      </div>
    );
  }

  if (hasKey) return <>{children}</>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <AlertCircle size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              fal.ai API key required
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/50">
              To use {toolName} you need to add your personal fal.ai API key first.
              All requests run directly from your browser to fal.ai — your key
              never touches our servers.
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
          <Shield size={13} className="mt-0.5 shrink-0 text-emerald-400" />
          <div className="text-[11px] leading-relaxed text-foreground/55">
            <strong className="text-foreground/75">Client-side only.</strong>{" "}
            Stored in your browser&apos;s localStorage and only sent to fal.ai.
            No server logging, no analytics on your key.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-xs font-semibold text-black hover:brightness-110 transition-all"
          >
            <Key size={13} /> Add your API key
            <ArrowRight size={13} />
          </Link>
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-2.5 text-xs text-foreground/60 hover:text-foreground"
          >
            Don&apos;t have a key? Create one
            <ExternalLink size={11} />
          </a>
        </div>

        <p className="mt-5 text-[10px] leading-relaxed text-foreground/30">
          Already saved a key? Refresh the page — we re-check on every focus.
        </p>
      </div>
    </div>
  );
}
