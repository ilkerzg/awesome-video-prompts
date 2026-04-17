export function BlogTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-xl border border-[color:var(--border-soft)]">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[color:var(--separator)] bg-[color:var(--surface)]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold text-foreground/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-[color:var(--separator)] last:border-0"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-3 text-[13px] text-foreground/60"
                  >
                    {cell}
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
