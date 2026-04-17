export function Quote({
  children,
  cite,
  author,
}: {
  children: React.ReactNode;
  cite?: string;
  author?: string;
}) {
  return (
    <figure className="my-6">
      <blockquote
        cite={cite}
        className="border-l-[3px] border-[color:var(--accent)]/40 pl-5 italic"
      >
        <p className="text-[15px] leading-[1.8] text-foreground/50">
          {children}
        </p>
      </blockquote>
      {author && (
        <figcaption className="mt-2 pl-5 text-xs text-foreground/25">
          — {author}
        </figcaption>
      )}
    </figure>
  );
}
