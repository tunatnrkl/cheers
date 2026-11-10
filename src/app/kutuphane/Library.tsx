"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CardRow } from "@/components/Cards";
import {
  GAMES,
  HANDS,
  POSITIONS,
  STACK_BUCKETS,
  STREETS,
  TOPICS,
  stackBucket,
} from "@/data/hands";

// Filtreler adres çubuğunda tutulur: bağlantı paylaşılabilir, geri tuşu çalışır.
const KEYS = { oyun: "oyun", sokak: "sokak", poz: "poz", stack: "stack", konu: "konu" } as const;

export function Library() {
  const params = useSearchParams();
  const router = useRouter();
  const f = {
    game: params.get(KEYS.oyun) ?? "",
    street: params.get(KEYS.sokak) ?? "",
    pos: params.get(KEYS.poz) ?? "",
    stack: params.get(KEYS.stack) ?? "",
    topic: params.get(KEYS.konu) ?? "",
  };

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/kutuphane${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const hands = HANDS.filter(
    (h) =>
      (!f.game || h.game === f.game) &&
      (!f.street || (f.street === "postflop" ? h.street !== "preflop" : h.street === f.street)) &&
      (!f.pos || h.heroPos === f.pos) &&
      (!f.stack || stackBucket(h.stackBB) === f.stack) &&
      (!f.topic || h.topic === f.topic),
  );
  const anyFilter = Object.values(f).some(Boolean);

  const select = (id: string, label: string, key: string, value: string, options: [string, string][]) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => setParam(key, e.target.value)}>
        <option value="">Hepsi</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Oyun tipi" className="flex gap-2">
        {[["", "Hepsi"], ...Object.entries(GAMES)].map(([v, l]) => (
          <button
            key={v}
            role="tab"
            type="button"
            aria-selected={f.game === v}
            className={`chip flex-1 justify-center sm:flex-none ${f.game === v ? "chip-on" : ""}`}
            onClick={() => setParam(KEYS.oyun, v)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {select("f-sokak", "Sokak", KEYS.sokak, f.street, [["preflop", "Preflop"], ["postflop", "Postflop (tümü)"], ...Object.entries(STREETS).slice(1)] as [string, string][])}
        {select("f-poz", "Pozisyon", KEYS.poz, f.pos, POSITIONS.map((p) => [p, p]))}
        {select("f-stack", "Stack derinliği", KEYS.stack, f.stack, Object.entries(STACK_BUCKETS))}
        {select("f-konu", "Konu", KEYS.konu, f.topic, Object.entries(TOPICS))}
      </div>

      <div className="flex min-h-11 items-center justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {hands.length} el
        </p>
        {anyFilter && (
          <button type="button" className="btn" onClick={() => router.replace("/kutuphane", { scroll: false })}>
            Filtreleri temizle
          </button>
        )}
      </div>

      {hands.length === 0 ? (
        <p className="card text-muted">Bu filtrelere uyan el yok. Bir filtreyi kaldırmayı dene.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {hands.map((h) => (
            <li key={h.id}>
              <Link href={`/kutuphane/${h.id}`} className="card flex h-full items-center gap-3 transition-colors hover:border-accent">
                <CardRow cards={h.hero} small />
                <span className="min-w-0">
                  <span className="block font-semibold">{h.title}</span>
                  <span className="block text-sm text-muted">
                    {GAMES[h.game]} · {STREETS[h.street]} · {h.heroPos} · {h.stackBB} BB
                  </span>
                  <span className="tag mt-1">{TOPICS[h.topic]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
