"use client";

import { useEffect, useState } from "react";
import { Alan, Rozet } from "@/components/ui";
import { CATEGORIES, GLOSSARY, type Term } from "@/data/glossary";

const fold = (s: string) => s.toLocaleLowerCase("tr");

export function GlossaryList() {
  const [q, setQ] = useState("");
  const [target, setTarget] = useState("");

  // Bağlantıyla gelinen terimi vurgula (/sozluk#spr)
  useEffect(() => {
    const read = () => setTarget(decodeURIComponent(location.hash.slice(1)));
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);

  const needle = fold(q.trim());
  const match = (g: Term) =>
    !needle || fold(g.term).includes(needle) || fold(g.def).includes(needle) || (g.aliases ?? []).some((a) => fold(a).includes(needle));
  const count = GLOSSARY.filter(match).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-xl">
        <Alan
          id="ara"
          etiket="Terim ara"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Örn: equity, bubble, 3-bet"
          autoComplete="off"
        />
        <p className="mt-1 min-h-5 text-sm text-muted" aria-live="polite">
          {needle ? `${count} sonuç` : ""}
        </p>
      </div>

      {(Object.keys(CATEGORIES) as Term["cat"][]).map((cat) => {
        const items = GLOSSARY.filter((g) => g.cat === cat && match(g)).sort((a, b) => a.term.localeCompare(b.term, "tr"));
        if (!items.length) return null;
        return (
          <section key={cat} aria-labelledby={`kat-${cat}`}>
            <div className="flex items-baseline gap-3">
              <h2 id={`kat-${cat}`} className="h2">
                {CATEGORIES[cat]}
              </h2>
              <Rozet ton="notr">{items.length} terim</Rozet>
            </div>
            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              {items.map((g) => (
                <div key={g.slug} id={g.slug} className={`card card-flat !p-4 sm:!p-5 ${target === g.slug ? "border-accent ring-2 ring-accent" : ""}`}>
                  <dt className="font-bold text-ink">{g.term}</dt>
                  <dd className="mt-1 text-[15px]">{g.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
      {count === 0 && <p className="not-kutu text-muted">Bu aramayla eşleşen terim yok. Farklı bir yazımla ya da daha kısa bir kelimeyle dene.</p>}
    </div>
  );
}
