import Link from "next/link";
import { AiPanel } from "./AiPanel";
import { RichText } from "./RichText";

export type ModuleSection = { title: string; text: string; links?: [string, string][] };

/** Cash game ve Turnuva modül sayfalarının ortak düzeni. */
export function ModulePage({
  title,
  lead,
  other,
  sections,
  table,
  suggestions,
}: {
  title: string;
  lead: string;
  other: { href: string; label: string };
  sections: ModuleSection[];
  table?: { caption: string; head: string[]; rows: string[][] };
  suggestions: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Oyun tipi" className="flex gap-2">
        <span role="tab" aria-selected="true" className="chip chip-on flex-1 justify-center sm:flex-none">{title}</span>
        <Link role="tab" aria-selected="false" href={other.href} className="chip flex-1 justify-center sm:flex-none">{other.label}</Link>
      </div>
      <header>
        <h1 className="h1">{title}</h1>
        <p className="lead mt-1">{lead}</p>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {sections.map((s) => (
            <section key={s.title} className="card">
              <h2 className="h2">{s.title}</h2>
              <RichText text={s.text} className="mt-1" />
              {s.links && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.links.map(([href, label]) => (
                    <Link key={href} href={href} className="btn">
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
          {table && (
            <section className="card overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="h2 mb-2 text-left">{table.caption}</caption>
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    {table.head.map((h) => (
                      <th key={h} scope="col" className="py-2 pr-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r) => (
                    <tr key={r[0]} className="border-b border-line align-top last:border-0">
                      {r.map((c, i) => (
                        <td key={i} className={`py-2 pr-3 ${i === 0 ? "whitespace-nowrap font-semibold" : ""}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
        <div className="md:sticky md:top-20">
          <AiPanel suggestions={suggestions} />
        </div>
      </div>
    </div>
  );
}
