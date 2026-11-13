"use client";

import { useEffect, useRef } from "react";
import type { Olay } from "@/lib/poker/engine";
import { entryLabel, fmt, type Replay, type Seat } from "@/lib/poker/replay";
import { aksiyonEtiketi } from "@/app/alistirma/lib/gorunum";
import { PlayingCard } from "../Cards";

const SOKAK = { flop: "Flop", turn: "Turn", river: "River" } as const;

type Satir =
  | { t: "sokak"; ad: string; kartlar: string[]; pot: number }
  | { t: "aksiyon"; koltuk: Seat; metin: string; fold: boolean; hero: boolean }
  | { t: "not"; metin: string }
  | { t: "showdown"; eller: { koltuk: Seat; kartlar: string[]; elAdi: string }[] };

/**
 * Aksiyon geçmişi: spotun karar anına kadarki aksiyonları ve ekranda oynatılmış motor olayları.
 * Yalnızca oynatılmış olaylar listelenir; showdown satırı showdown olayı oynatıldıktan sonra görünür.
 */
export function AksiyonGecmisi({ r, heroPos, olaylar, onKapat }: { r: Replay; heroPos: Seat; olaylar: readonly Olay[]; onKapat?: () => void }) {
  const satirlar: Satir[] = [{ t: "sokak", ad: "Preflop", kartlar: [], pot: 1.5 }];
  for (const e of r.entries) {
    if (e.kind === "street") satirlar.push({ t: "sokak", ad: SOKAK[e.street], kartlar: e.cards.match(/.{2}/g) ?? [], pot: e.pot });
    else if (!e.auto) satirlar.push({ t: "aksiyon", koltuk: e.pos, metin: entryLabel(e), fold: e.act === "fold", hero: e.pos === heroPos });
  }
  const oto = r.entries.filter((e) => e.kind === "act" && e.auto).length;
  if (oto) satirlar.splice(1, 0, { t: "not", metin: `${oto} oyuncu fold etti` });
  for (const o of olaylar) {
    if (o.tür === "aksiyon")
      satirlar.push({ t: "aksiyon", koltuk: o.koltuk, metin: aksiyonEtiketi(o), fold: o.aksiyon === "fold", hero: o.koltuk === heroPos });
    else if (o.tür === "sokak") satirlar.push({ t: "sokak", ad: SOKAK[o.sokak], kartlar: o.kartlar, pot: o.pot });
    else if (o.tür === "iade") satirlar.push({ t: "not", metin: `${o.koltuk}: ${fmt(o.miktar)} BB karşılanmadı, geri döndü` });
    else if (o.tür === "showdown") satirlar.push({ t: "showdown", eller: o.eller });
    else if (o.tür === "sonuç")
      satirlar.push({
        t: "not",
        metin: o.kazananlar.length
          ? `Pot: ${o.kazananlar.map((k) => `${k.koltuk} +${fmt(k.miktar)} BB`).join(", ")}`
          : "El oynatılmadı; pot dağıtılmadı",
      });
  }

  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [olaylar.length]);

  return (
    <section aria-labelledby="gecmis-baslik" className="flex h-full min-h-0 flex-col bg-t-panel">
      <header className="flex items-center gap-2 border-b border-t-line px-3 py-1.5">
        <h2 id="gecmis-baslik" className="flex-1 text-sm font-bold text-t-ink">
          Aksiyon geçmişi
        </h2>
        {onKapat && (
          <button type="button" onClick={onKapat} aria-label="Aksiyon geçmişini kapat" className="grid size-11 place-items-center rounded-lg text-t-muted hover:text-t-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </header>
      <ol ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2 text-[13px]">
        {satirlar.map((s, i) =>
          s.t === "sokak" ? (
            <li key={i} className="flex items-center gap-2 pt-2 first:pt-0">
              <span className="text-[11px] font-bold tracking-wider text-t-muted uppercase">{s.ad}</span>
              {s.kartlar.length > 0 && (
                <span className="flex gap-0.5">
                  {s.kartlar.map((c) => (
                    <PlayingCard key={c} card={c} size="xs" />
                  ))}
                </span>
              )}
              {s.ad !== "Preflop" && <span className="ml-auto text-xs font-semibold text-t-muted tabular-nums">Pot {fmt(s.pot)}</span>}
            </li>
          ) : s.t === "aksiyon" ? (
            <li key={i} className={`flex justify-between rounded-md px-2 py-1 ${s.hero ? "bg-t-accent/10" : "bg-t-panel-2"} ${s.fold ? "opacity-60" : ""}`}>
              <span className={`font-semibold ${s.hero ? "text-t-accent" : "text-t-muted"}`}>{s.hero ? `${s.koltuk} (sen)` : s.koltuk}</span>
              <span className="font-bold text-t-ink tabular-nums">{s.metin}</span>
            </li>
          ) : s.t === "not" ? (
            <li key={i} className="px-2 text-xs text-t-muted">
              {s.metin}
            </li>
          ) : (
            <li key={i} className="space-y-1 pt-2">
              <span className="text-[11px] font-bold tracking-wider text-t-muted uppercase">Showdown</span>
              {s.eller.map((e) => (
                <span key={e.koltuk} className="flex items-center gap-2 px-2">
                  <span className="w-20 font-semibold text-t-muted">{e.koltuk === heroPos ? `${e.koltuk} (sen)` : e.koltuk}</span>
                  <span className="flex gap-0.5">
                    {e.kartlar.map((c) => (
                      <PlayingCard key={c} card={c} size="xs" />
                    ))}
                  </span>
                  <span className="text-xs text-t-ink">{e.elAdi}</span>
                </span>
              ))}
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
