import { AiPanel } from "./AiPanel";
import { RichText } from "./RichText";
import { ButonBaglanti, HapBaglanti, Kart, SayfaBasligi, Tablo } from "./ui";

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
  const sira = [
    { href: other.href === "/cash" ? "/turnuva" : "/cash", label: title, secili: true },
    { href: other.href, label: other.label, secili: false },
  ].sort((a, b) => (a.href === "/cash" ? -1 : b.href === "/cash" ? 1 : 0));

  return (
    <div className="flex flex-col gap-6">
      {/* Rehberler arasında geçiş: sekme değil, iki sayfa arasında gezinme */}
      <nav aria-label="Rehberler" className="flex gap-2">
        {sira.map((s) => (
          <HapBaglanti key={s.href} href={s.href} secili={s.secili} className="flex-1 justify-center sm:flex-none">
            {s.label}
          </HapBaglanti>
        ))}
      </nav>
      <SayfaBasligi ust="Rehber" baslik={title} aciklama={lead} />

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {sections.map((s) => (
            <Kart key={s.title} baslik={s.title}>
              <RichText text={s.text} className="mt-2" />
              {s.links && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.links.map(([href, label]) => (
                    <ButonBaglanti key={href} href={href} boyut="kucuk">
                      {label}
                    </ButonBaglanti>
                  ))}
                </div>
              )}
            </Kart>
          ))}
          {table && (
            <Kart>
              <Tablo baslik={table.caption} sutunlar={table.head} satirlar={table.rows} satirBasligi />
            </Kart>
          )}
        </div>
        <div className="md:sticky md:top-20">
          <AiPanel suggestions={suggestions} />
        </div>
      </div>
    </div>
  );
}
