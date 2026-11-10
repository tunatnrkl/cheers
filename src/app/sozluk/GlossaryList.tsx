"use client";

import { useEffect, useState } from "react";
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
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="ara" className="label">
          Terim ara
        </label>
        <input id="ara" type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Örn: equity, bubble, 3-bet" />
        <p className="mt-1 text-sm text-muted" aria-live="polite">
          {needle ? `${count} sonuç` : ""}
        </p>
      </div>

      {(Object.keys(CATEGORIES) as Term["cat"][]).map((cat) => {
        const items = GLOSSARY.filter((g) => g.cat === cat && match(g)).sort((a, b) => a.term.localeCompare(b.term, "tr"));
        if (!items.length) return null;
        return (
          <section key={cat}>
            <h2 className="h2">{CATEGORIES[cat]}</h2>
            <dl className="mt-2 grid gap-2 md:grid-cols-2">
              {items.map((g) => (
                <div key={g.slug} id={g.slug} className={`card ${target === g.slug ? "border-accent ring-2 ring-accent" : ""}`}>
                  <dt className="font-semibold">{g.term}</dt>
                  <dd className="mt-0.5 text-sm">{g.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
      {count === 0 && <p className="card text-muted">Bu aramayla eşleşen terim yok.</p>}
    </div>
  );
}
