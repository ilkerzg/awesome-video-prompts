import { Link2 } from "lucide-react";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function H2({ children }: { children: React.ReactNode }) {
  const id = typeof children === "string" ? slugify(children) : undefined;
  return (
    <h2 id={id} className="group mt-10 mb-4 scroll-mt-20 text-xl font-bold tracking-tight text-foreground md:text-2xl">
      {children}
      {id && (
        <a href={`#${id}`} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100" aria-label={`Link to ${children}`}>
          <Link2 size={16} className="text-foreground/20" />
        </a>
      )}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  const id = typeof children === "string" ? slugify(children) : undefined;
  return (
    <h3 id={id} className="group mt-8 mb-3 scroll-mt-20 text-lg font-bold text-foreground">
      {children}
      {id && (
        <a href={`#${id}`} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100" aria-label={`Link to ${children}`}>
          <Link2 size={14} className="text-foreground/20" />
        </a>
      )}
    </h3>
  );
}

export function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-6 mb-2 text-base font-semibold text-foreground">
      {children}
    </h4>
  );
}
