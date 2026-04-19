export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[15px] leading-[1.8] text-foreground/60">
      {children}
    </p>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 text-lg leading-relaxed text-foreground/50">
      {children}
    </p>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground/80">{children}</strong>;
}

export function Em({ children }: { children: React.ReactNode }) {
  return <em className="italic text-foreground/50">{children}</em>;
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[13px] text-[color:var(--accent)]">
      {children}
    </code>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-[color:var(--accent)]/10 px-1 text-foreground/70">
      {children}
    </mark>
  );
}

export function BlogLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-2 transition-colors hover:decoration-[color:var(--accent)]"
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
