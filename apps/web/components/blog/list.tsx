export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-4 space-y-2 pl-5 text-[15px] leading-[1.8] text-foreground/60 [&>li]:relative [&>li]:pl-2 [&>li]::marker:text-foreground/20">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-4 space-y-2 pl-5 text-[15px] leading-[1.8] text-foreground/60 list-decimal [&>li]:pl-2 [&>li]::marker:text-foreground/30 [&>li]::marker:font-semibold">
      {children}
    </ol>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function CheckList({
  items,
}: {
  items: { label: string; checked: boolean }[];
}) {
  return (
    <ul className="my-4 space-y-2" role="list">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground/60">
          <span
            className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-[5px] border text-[10px] ${
              item.checked
                ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                : "border-foreground/15"
            }`}
            aria-hidden="true"
          >
            {item.checked && "✓"}
          </span>
          <span className={item.checked ? "" : "text-foreground/35"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
