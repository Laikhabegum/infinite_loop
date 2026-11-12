// Small presentational pieces shared across pages.

export function Section({ eyebrow, title, intro, children, id }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2 className="mt-2 text-3xl font-light tracking-tight text-ink md:text-4xl">{title}</h2>}
      {intro && <p className="mt-3 max-w-2xl text-ink-2">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, intro }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 md:pt-20">
      <p className="eyebrow rise">{eyebrow}</p>
      <h1 className="hero-title rise mt-3 max-w-3xl pb-2 text-4xl sm:text-5xl md:text-6xl">{title}</h1>
      <p className="rise mt-4 max-w-2xl text-lg text-ink-2">{intro}</p>
    </div>
  );
}

export function Stat({ label, value, unit, note }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-3">{label}</p>
      <p className="mt-2 text-4xl font-light tracking-tight text-ink">
        {value}
        {unit && <span className="ml-1.5 text-base text-ink-3">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-sm text-ink-2">{note}</p>}
    </div>
  );
}

export function SourceNote({ children }) {
  return <p className="mt-4 text-xs leading-relaxed text-ink-3">{children}</p>;
}

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ caption, columns, rows }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink">
        <span aria-hidden="true">▸</span> View as table
      </summary>
      <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-line">
        <table className="tabular w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface text-ink-3">
            <tr>
              {columns.map(col => (
                <th key={col} scope="col" className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-line text-ink-2">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
