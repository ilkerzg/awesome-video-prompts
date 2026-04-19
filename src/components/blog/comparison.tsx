import { Check, X as XIcon, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "partial" | string;

export function ComparisonTable({
  models,
  features,
  caption,
}: {
  models: { id: string; name: string; provider: string }[];
  features: { label: string; values: Record<string, CellValue> }[];
  caption?: string;
}) {
  function renderCell(value: CellValue) {
    if (value === "yes") return <Check size={14} className="text-emerald-400" />;
    if (value === "no") return <XIcon size={14} className="text-red-400/50" />;
    if (value === "partial") return <Minus size={14} className="text-amber-400" />;
    return <span className="text-[12px] text-foreground/50">{value}</span>;
  }

  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-xl border border-[color:var(--border-soft)]">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[color:var(--separator)] bg-[color:var(--surface)]">
              <th className="px-4 py-3 text-xs font-semibold text-foreground/40">Feature</th>
              {models.map((m) => (
                <th key={m.id} className="px-4 py-3 text-center">
                  <span className="block text-xs font-bold text-foreground">{m.name}</span>
                  <span className="block text-[9px] text-foreground/25">{m.provider}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr
                key={i}
                className="border-b border-[color:var(--separator)] last:border-0"
              >
                <td className="px-4 py-2.5 text-[12px] font-medium text-foreground/50">
                  {f.label}
                </td>
                {models.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center">
                      {renderCell(f.values[m.id] ?? "-")}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
