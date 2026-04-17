import { Cpu, ExternalLink, ArrowRight, Hash } from "lucide-react";

/** Model info card — showcase a specific AI model */
export function ModelCard({
  name,
  provider,
  description,
  capabilities,
  href,
}: {
  name: string;
  provider: string;
  description: string;
  capabilities?: string[];
  href?: string;
}) {
  const Wrapper = href ? "a" : "div";
  const props = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...props}
      className={`my-5 block rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 transition-colors ${href ? "hover:border-[color:var(--accent)]/30 cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
          <Cpu size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">{name}</h4>
            <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[9px] font-medium text-foreground/30">
              {provider}
            </span>
            {href && <ExternalLink size={11} className="ml-auto text-foreground/15" />}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-foreground/40">
            {description}
          </p>
          {capabilities && capabilities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[9px] text-foreground/30"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

/** Step-by-step guide */
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-6 space-y-4 [counter-reset:step]">{children}</ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 [counter-increment:step]">
      <div className="flex flex-col items-center">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-black [content:counter(step)] before:content-[counter(step)]" />
        <span className="mt-1 flex-1 w-px bg-[color:var(--separator)]" />
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
        <div className="text-[13px] leading-relaxed text-foreground/50">
          {children}
        </div>
      </div>
    </li>
  );
}

/** Key takeaways / summary box */
export function KeyPoints({
  title = "Key Takeaways",
  points,
}: {
  title?: string;
  points: string[];
}) {
  return (
    <div className="my-6 rounded-xl border border-[color:var(--accent)]/15 bg-[color:var(--accent)]/5 p-5">
      <p className="mb-3 text-sm font-bold text-[color:var(--accent)]">
        {title}
      </p>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/55">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-[color:var(--accent)]" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bookmark / link card */
export function Bookmark({
  url,
  title,
  description,
  favicon,
}: {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
}) {
  const domain = new URL(url).hostname;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-5 flex items-start gap-4 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 transition-colors hover:border-[color:var(--accent)]/30"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-foreground/35 line-clamp-2">{description}</p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-foreground/20">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={favicon} alt="" className="size-3.5 rounded" />
          )}
          {domain}
          <ExternalLink size={10} />
        </p>
      </div>
    </a>
  );
}

/** Divider with optional label */
export function Divider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="my-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-[color:var(--separator)]" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/15">
          {label}
        </span>
        <span className="h-px flex-1 bg-[color:var(--separator)]" />
      </div>
    );
  }
  return <hr className="my-8 border-[color:var(--separator)]" />;
}

/** Table of contents — pass heading items */
export function TOC({
  items,
}: {
  items: { id: string; text: string; level: 2 | 3 }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Table of contents" className="my-6 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-foreground/25">
        <Hash size={11} />
        Contents
      </p>
      <ol className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className="text-xs text-foreground/40 transition-colors hover:text-[color:var(--accent)]"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
