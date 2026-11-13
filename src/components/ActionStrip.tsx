"use client";

import { useEffect, useRef } from "react";
import { entryLabel, fmt, type Replay, type Seat } from "@/lib/poker/replay";
import { PlayingCard } from "./Cards";
import { KIND_TEXT } from "./PokerTable";

const STREET_TR = { flop: "Flop", turn: "Turn", river: "River" };

/** Elin tüm aksiyonları soldan sağa: kim, hangi stack'le, ne yaptı. Son kutu kahramanın sırası. */
export function ActionStrip({ r, heroPos }: { r: Replay; heroPos: Seat }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ left: el.scrollWidth });
  }, [r]);

  return (
    <ol ref={ref} aria-label="Aksiyon geçmişi" className="flex items-stretch gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:thin]">
      {r.entries.map((e, i) =>
        e.kind === "street" ? (
          <li key={i} className="flex shrink-0 items-center gap-2 rounded-lg border border-t-line bg-t-panel px-2.5 py-1">
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold tracking-wider text-t-muted uppercase">{STREET_TR[e.street]}</span>
              <span className="text-xs font-bold text-t-ink tabular-nums">{fmt(e.pot)} BB</span>
            </span>
            <span className="flex gap-0.5">
              {(e.cards.match(/.{2}/g) ?? []).map((c) => (
                <PlayingCard key={c} card={c} size="xs" />
              ))}
            </span>
          </li>
        ) : (
          <li
            key={i}
            className={`flex shrink-0 flex-col justify-center rounded-lg px-2.5 py-1 leading-tight ${e.act === "fold" ? "border border-dashed border-t-line bg-t-panel" : "bg-t-panel-2"}`}
          >
            <span className="text-[10px] font-semibold text-t-muted tabular-nums">
              {e.pos} <span>{fmt(e.stack)}</span>
            </span>
            <span className={`text-[13px] font-bold ${KIND_TEXT[e.act]}`}>{entryLabel(e)}</span>
          </li>
        ),
      )}
      <li className="flex shrink-0 flex-col justify-center rounded-lg border border-t-accent/70 bg-t-accent/10 px-2.5 py-1 leading-tight">
        <span className="text-[10px] font-semibold text-t-muted tabular-nums">
          {heroPos} <span>{fmt(r.seats[heroPos].stack)}</span>
        </span>
        <span className="text-[13px] font-bold text-t-accent">Sıra sende</span>
      </li>
    </ol>
  );
}
