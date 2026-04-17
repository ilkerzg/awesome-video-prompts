"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Highlight, themes, type Language } from "prism-react-renderer";

// Normalize common aliases to a language Prism recognises
const LANG_ALIAS: Record<string, Language> = {
  ts: "tsx",
  tsx: "tsx",
  typescript: "tsx",
  js: "jsx",
  jsx: "jsx",
  javascript: "jsx",
  py: "python",
  python: "python",
  sh: "bash",
  bash: "bash",
  shell: "bash",
  zsh: "bash",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  html: "markup",
  xml: "markup",
  md: "markdown",
  markdown: "markdown",
  css: "css",
  scss: "scss",
  sql: "sql",
  rust: "rust",
  rs: "rust",
  go: "go",
  java: "java",
  swift: "swift",
  kotlin: "kotlin",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  php: "php",
  ruby: "ruby",
  rb: "ruby",
  docker: "docker",
  dockerfile: "docker",
  graphql: "graphql",
  toml: "toml",
  diff: "diff",
  ini: "ini",
};

function normalizeLang(raw?: string): Language {
  if (!raw) return "tsx";
  const key = raw.trim().toLowerCase();
  return LANG_ALIAS[key] ?? (key as Language);
}

function displayLang(raw?: string): string {
  if (!raw) return "CODE";
  return raw.trim().toUpperCase();
}

export function CodeBlock({
  code,
  language,
  filename,
  caption,
}: {
  code: string;
  language?: string;
  filename?: string;
  caption?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lang = normalizeLang(language);
  const label = displayLang(language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <figure className="my-5">
      <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[#0b0e14]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Dots */}
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-white/8" />
              <span className="size-2.5 rounded-full bg-white/8" />
              <span className="size-2.5 rounded-full bg-white/8" />
            </div>
            {filename && (
              <span className="ml-2 font-mono text-[11px] text-white/40">
                {filename}
              </span>
            )}
            {!filename && (
              <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
                {label}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/30 transition-colors hover:text-white/80"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Highlighted code */}
        <Highlight
          theme={themes.nightOwl}
          code={code.replace(/\n+$/, "")}
          language={lang}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"
              style={{ ...style, background: "transparent" }}
            >
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineRest } = getLineProps({ line });
                return (
                  <div key={i} {...lineRest}>
                    <span className="mr-4 inline-block w-6 select-none text-right text-[11px] text-white/15">
                      {i + 1}
                    </span>
                    {line.map((token, j) => {
                      const { key: _tkKey, ...tokenRest } = getTokenProps({ token });
                      return <span key={j} {...tokenRest} />;
                    })}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
