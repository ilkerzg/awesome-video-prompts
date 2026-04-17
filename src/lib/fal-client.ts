import { fal } from "@fal-ai/client";

/**
 * Fal client with secure key resolution.
 *
 * Priority:
 *   1. localStorage "fal_key" (user's personal key, never leaves the browser)
 *   2. NEXT_PUBLIC_FAL_KEY env var (project default for dev)
 *
 * All fal.ai calls run client-side with the user's key.
 * The key is NEVER sent to our server or logged.
 *
 * For server components that need fal, use NEXT_PUBLIC_FAL_KEY only.
 */

let lastKey = "";

export function getFalKey(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_FAL_KEY || "";
  return localStorage.getItem("fal_key") || process.env.NEXT_PUBLIC_FAL_KEY || "";
}

export function setFalKey(key: string) {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem("fal_key", key);
  } else {
    localStorage.removeItem("fal_key");
  }
  lastKey = "";
}

export function hasFalKey(): boolean {
  return !!getFalKey();
}

export function isUsingUserKey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("fal_key");
}

export function getFal() {
  const key = getFalKey();
  // Reconfigure whenever the key changes (supports live update after Settings save)
  if (key !== lastKey) {
    if (key) fal.config({ credentials: key });
    lastKey = key;
  }
  return fal;
}

export async function runLLM(prompt: string, model = "openai/gpt-4o"): Promise<string> {
  const client = getFal();
  const result = await client.subscribe("fal-ai/any-llm", { input: { prompt, model } });
  return (result.data as { output: string }).output || "";
}

export async function runOpenRouter(
  prompt: string,
  opts: { model?: string; system_prompt?: string; max_tokens?: number } = {},
): Promise<string> {
  const client = getFal();
  const result = await client.subscribe("openrouter/router" as string, {
    input: {
      prompt,
      model: opts.model ?? "anthropic/claude-opus-4-6",
      system_prompt: opts.system_prompt ?? "",
      max_tokens: opts.max_tokens ?? 4096,
      reasoning: false,
    },
  });
  return (result.data as { output: string }).output || "";
}
