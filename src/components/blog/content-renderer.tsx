"use client";

import React from "react";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { BlogTable } from "./table";
import { KeyPoints, ModelCard, Steps, Step, Divider, TOC, Bookmark } from "./special";
import { PromptShowcase } from "./prompt-showcase";
import { ComparisonTable } from "./comparison";
import { H2, H3, H4 } from "./heading";
import { P, Lead, InlineCode, Strong, BlogLink } from "./text";
import { Quote } from "./quote";
import { UL, OL, LI } from "./list";
import { BlogImage, BlogVideo } from "./media";
import {
  Check, X as XIcon, ThumbsUp, ThumbsDown, AlertTriangle,
  Zap, BarChart3, Cpu, ArrowRight,
} from "lucide-react";

// ─── Attribute Parser ───────────────────────────────────────

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function extractTagContent(
  content: string,
  tagName: string,
): { attrs: Record<string, string>; children: string; fullMatch: string } | null {
  // Self-closing: <Tag attr="val" />
  const selfClose = new RegExp(`<${tagName}\\s+([^>]*?)\\s*/>`, "s");
  const scMatch = selfClose.exec(content);
  if (scMatch) {
    return { attrs: parseAttrs(scMatch[1]), children: "", fullMatch: scMatch[0] };
  }
  // Open+close: <Tag attr="val">children</Tag>
  const openClose = new RegExp(`<${tagName}(?:\\s+([^>]*))?>([\\s\\S]*?)</${tagName}>`, "s");
  const ocMatch = openClose.exec(content);
  if (ocMatch) {
    return { attrs: parseAttrs(ocMatch[1] || ""), children: ocMatch[2].trim(), fullMatch: ocMatch[0] };
  }
  return null;
}

// ─── Inline Markdown ────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Bold **text**, inline code `text`, links [text](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Image: ![alt](url) — must be checked BEFORE link so `!` prefix is not stripped
    const imgMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    // Link
    const linkMatch = remaining.match(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: "bold", index: boldMatch.index!, match: boldMatch } : null,
      codeMatch ? { type: "code", index: codeMatch.index!, match: codeMatch } : null,
      imgMatch ? { type: "image", index: imgMatch.index!, match: imgMatch } : null,
      linkMatch ? { type: "link", index: linkMatch.index!, match: linkMatch } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === "bold") {
      parts.push(<strong key={key++} className="font-semibold text-foreground/80">{first.match![1]}</strong>);
      remaining = remaining.slice(first.index + first.match![0].length);
    } else if (first.type === "code") {
      parts.push(
        <code key={key++} className="rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[13px] text-[color:var(--accent)]">
          {first.match![1]}
        </code>,
      );
      remaining = remaining.slice(first.index + first.match![0].length);
    } else if (first.type === "link") {
      parts.push(
        <a key={key++} href={first.match![2]} className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-2 hover:decoration-[color:var(--accent)]" target={first.match![2].startsWith("http") ? "_blank" : undefined} rel={first.match![2].startsWith("http") ? "noopener noreferrer" : undefined}>
          {first.match![1]}
        </a>,
      );
      remaining = remaining.slice(first.index + first.match![0].length);
    } else if (first.type === "image") {
      parts.push(
        <img
          key={key++}
          src={first.match![2]}
          alt={first.match![1]}
          loading="lazy"
          className="my-4 block h-auto w-full rounded-xl border border-[color:var(--border-soft)]"
        />,
      );
      remaining = remaining.slice(first.index + first.match![0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─── Markdown Table Parser ──────────────────────────────────

function parseMarkdownTable(block: string): { headers: string[]; rows: string[][] } | null {
  const lines = block.split("\n").filter((l) => l.trim());
  if (lines.length < 3) return null;
  if (!lines[1].match(/^\|[\s-:|]+\|$/)) return null;

  const parse = (line: string) =>
    line.split("|").map((c) => c.trim()).filter(Boolean);

  return {
    headers: parse(lines[0]),
    rows: lines.slice(2).map(parse),
  };
}

// ─── Component Tag Renderers ────────────────────────────────

function renderComponentTag(block: string, key: number): React.ReactNode | null {
  // <Callout type="..." title="...">...</Callout>
  const callout = extractTagContent(block, "Callout");
  if (callout) {
    return (
      <Callout key={key} variant={(callout.attrs.type as "info" | "tip" | "warning" | "danger" | "note") || "info"} title={callout.attrs.title}>
        {renderInline(callout.children)}
      </Callout>
    );
  }

  // <Recommendation type="do|dont|consider">...</Recommendation>
  const rec = extractTagContent(block, "Recommendation");
  if (rec) {
    const typeMap: Record<string, { variant: "tip" | "danger" | "note"; icon: string }> = {
      do: { variant: "tip", icon: "Do" },
      dont: { variant: "danger", icon: "Don't" },
      consider: { variant: "note", icon: "Consider" },
    };
    const cfg = typeMap[rec.attrs.type] || typeMap.consider;
    return (
      <Callout key={key} variant={cfg.variant} title={cfg.icon}>
        {renderInline(rec.children)}
      </Callout>
    );
  }

  // <StatsGrid> with <StatCard> children
  const stats = extractTagContent(block, "StatsGrid");
  if (stats) {
    const cards: { value: string; label: string; color?: string }[] = [];
    const cardRegex = /<StatCard\s+([^/>]*)\/?>/g;
    let cm;
    while ((cm = cardRegex.exec(stats.children)) !== null) {
      const a = parseAttrs(cm[1]);
      cards.push({ value: a.value || "", label: a.label || "", color: a.color });
    }
    if (cards.length > 0) {
      return (
        <div key={key} className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div key={i} className={`rounded-xl border p-4 ${
              c.color === "accent" ? "border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5"
              : c.color === "success" ? "border-emerald-500/20 bg-emerald-500/5"
              : c.color === "warning" ? "border-amber-500/20 bg-amber-500/5"
              : c.color === "danger" ? "border-red-500/20 bg-red-500/5"
              : "border-[color:var(--border-soft)] bg-[color:var(--surface)]"
            }`}>
              <p className={`text-2xl font-bold ${
                c.color === "accent" ? "text-[color:var(--accent)]"
                : c.color === "success" ? "text-emerald-400"
                : c.color === "warning" ? "text-amber-400"
                : c.color === "danger" ? "text-red-400"
                : "text-foreground"
              }`}>{c.value}</p>
              <p className="mt-1 text-xs text-foreground/40">{c.label}</p>
            </div>
          ))}
        </div>
      );
    }
  }

  // <MetricBar label="..." value={N} color="..." />
  const metric = extractTagContent(block, "MetricBar");
  if (metric) {
    const val = parseInt(metric.attrs.value) || 0;
    const color = metric.attrs.color || "accent";
    const barColor =
      color === "success" ? "bg-emerald-500" : color === "warning" ? "bg-amber-500"
      : color === "danger" ? "bg-red-500" : "bg-[color:var(--accent)]";
    return (
      <div key={key} className="my-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-foreground/50">{metric.attrs.label}</span>
          <span className="font-mono text-foreground/30">{val}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/5">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${val}%` }} />
        </div>
      </div>
    );
  }

  // <Comparison> with <ComparisonItem> children
  const comparison = extractTagContent(block, "Comparison");
  if (comparison) {
    const items: { title: string; pros: string[]; cons: string[] }[] = [];
    const itemRegex = /<ComparisonItem\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/ComparisonItem>)/g;
    let im;
    while ((im = itemRegex.exec(comparison.children)) !== null) {
      const a = parseAttrs(im[1]);
      const prosMatch = a.pros?.match(/\[([^\]]*)\]/);
      const consMatch = a.cons?.match(/\[([^\]]*)\]/);
      items.push({
        title: a.title || "",
        pros: prosMatch ? prosMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [],
        cons: consMatch ? consMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [],
      });
    }
    if (items.length > 0) {
      return (
        <div key={key} className="my-5 grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
              <h4 className="mb-3 text-sm font-bold text-foreground">{item.title}</h4>
              {item.pros.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {item.pros.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-emerald-400">
                      <Check size={12} className="mt-0.5 shrink-0" />
                      <span className="text-foreground/50">{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              {item.cons.length > 0 && (
                <ul className="space-y-1">
                  {item.cons.map((c, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-red-400">
                      <XIcon size={12} className="mt-0.5 shrink-0" />
                      <span className="text-foreground/50">{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return null;
}

// ─── Main Renderer ──────────────────────────────────────────

export function BlogContentRenderer({ content }: { content: string }) {
  // Strip frontmatter if present
  let cleaned = content;
  if (cleaned.startsWith("---")) {
    const end = cleaned.indexOf("---", 3);
    if (end !== -1) cleaned = cleaned.slice(end + 3).trim();
  }

  // Split into blocks by double newline, preserving code blocks and component tags
  const blocks: string[] = [];
  let current = "";
  let inCode = false;
  let inTag = false;
  let tagDepth = 0;

  for (const line of cleaned.split("\n")) {
    const trimmed = line.trim();

    // Track code blocks
    if (trimmed.startsWith("```")) {
      if (!inCode) {
        if (current.trim()) blocks.push(current.trim());
        current = line + "\n";
        inCode = true;
        continue;
      } else {
        current += line + "\n";
        blocks.push(current.trim());
        current = "";
        inCode = false;
        continue;
      }
    }
    if (inCode) { current += line + "\n"; continue; }

    // Track component tags
    if (trimmed.match(/^<(Callout|Recommendation|StatsGrid|Comparison|MetricBar)/)) {
      if (current.trim()) blocks.push(current.trim());
      current = line + "\n";
      if (trimmed.match(/\/>$/)) {
        blocks.push(current.trim());
        current = "";
      } else {
        inTag = true;
        tagDepth = 1;
      }
      continue;
    }
    if (inTag) {
      current += line + "\n";
      if (trimmed.match(/<\/(Callout|Recommendation|StatsGrid|Comparison|MetricBar)>/)) {
        tagDepth--;
        if (tagDepth <= 0) {
          blocks.push(current.trim());
          current = "";
          inTag = false;
        }
      }
      continue;
    }

    // Regular lines — split on empty lines
    if (trimmed === "") {
      if (current.trim()) {
        blocks.push(current.trim());
        current = "";
      }
    } else {
      current += line + "\n";
    }
  }
  if (current.trim()) blocks.push(current.trim());

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        // Component tags
        if (trimmed.startsWith("<")) {
          const rendered = renderComponentTag(trimmed, i);
          if (rendered) return rendered;
        }

        // Code block
        if (trimmed.startsWith("```")) {
          const langMatch = trimmed.match(/^```(\w+)?/);
          const lang = langMatch?.[1] || undefined;
          const code = trimmed
            .replace(/^```\w*\n?/, "")
            .replace(/\n?```$/, "")
            .trim();
          return <CodeBlock key={i} code={code} language={lang} />;
        }

        // Headings
        if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
          return <h1 key={i} className="mt-8 mb-4 text-xl font-bold text-foreground">{renderInline(trimmed.replace(/^#\s+/, ""))}</h1>;
        }
        if (trimmed.startsWith("## ")) {
          return <H2 key={i}>{renderInline(trimmed.replace(/^##\s+/, ""))}</H2>;
        }
        if (trimmed.startsWith("### ")) {
          return <H3 key={i}>{renderInline(trimmed.replace(/^###\s+/, ""))}</H3>;
        }
        if (trimmed.startsWith("#### ")) {
          return <H4 key={i}>{renderInline(trimmed.replace(/^####\s+/, ""))}</H4>;
        }

        // Horizontal rule
        if (trimmed.match(/^---+$/)) {
          return <Divider key={i} />;
        }

        // Standalone markdown image: ![alt](url)
        const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          const src = imgMatch[2];
          return (
            <figure key={i} className="my-6 overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="block h-auto w-full"
              />
              {alt && (
                <figcaption className="border-t border-[color:var(--separator)] px-4 py-2 text-[11px] text-foreground/35">
                  {alt}
                </figcaption>
              )}
            </figure>
          );
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
          const quoteText = trimmed.split("\n").map((l) => l.replace(/^>\s?/, "")).join(" ");
          return <Quote key={i}>{renderInline(quoteText)}</Quote>;
        }

        // Table
        if (trimmed.includes("|") && trimmed.split("\n").length >= 3) {
          const table = parseMarkdownTable(trimmed);
          if (table) {
            return <BlogTable key={i} headers={table.headers} rows={table.rows} />;
          }
        }

        // Unordered list
        if (trimmed.match(/^[-*]\s/m)) {
          const items = trimmed.split("\n").filter((l) => l.match(/^[-*]\s/));
          return (
            <ul key={i} className="my-3 space-y-1.5 pl-5">
              {items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed text-foreground/60 list-disc">
                  {renderInline(item.replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // Ordered list
        if (trimmed.match(/^\d+\.\s/m)) {
          const items = trimmed.split("\n").filter((l) => l.match(/^\d+\.\s/));
          return (
            <ol key={i} className="my-3 space-y-1.5 pl-5">
              {items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed text-foreground/60 list-decimal">
                  {renderInline(item.replace(/^\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        // Default paragraph
        return (
          <p key={i} className="text-[15px] leading-[1.8] text-foreground/60">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
