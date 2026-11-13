"use client";

import { useEffect, useRef } from "react";
import { PlayingCard } from "@/components/Cards";
import type { ElOzeti } from "@/lib/poker/engine";
import { fmt, type Seat } from "@/lib/poker/replay";
import { KADEME_ETIKET } from "./lib/ilkKarar";

const SOKAK_TR: Record<string, string> = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River", son: "Son" };
const AKSIYON_TR: Record<string, string> = { fold: "Fold", check: "Check", call: "Call", bet: "Bet", raise: "Raise", allin: "All-in" };
const KADEME_RENK = { "en-iyi": "bg-[#173a2a] text-[#8be0b4]", kabul: "bg-[#41270f] text-[#ffc27a]", hata: "bg-[#3a2321] text-[#ffb4a6]" };

type Props = {
  ozet: ElOzeti;
  heroPos: Seat;
  /** Hero fold ettiyse: kalan board (yalnızca board) */
  kalan: string[] | null;
  kalanGoster: (() => void) | null;
  onKapat?: () => void;
};

export function ElSonu({ ozet, heroPos, kalan, kalanGoster, onKapat }: Props) {
  const r = ozet.sonuc;
  const oynatilmadi = r?.neden === "hero-fold" && r.kazananlar.length === 0;
  const baslik = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    baslik.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section aria-labelledby="el-sonu-baslik" className="flex h-full min-h-0 flex-col bg-t-panel">
      <header className="flex items-center gap-2 border-b border-t-line px-3 py-1.5">
        <h2 id="el-sonu-baslik" ref={baslik} tabIndex={-1} className="flex-1 text-base font-bold text-t-ink outline-none">
          El özeti
        </h2>
        {onKapat && (
          <button type="button" onClick={onKapat} aria-label="El özetini küçült, masayı göster" className="grid min-h-11 place-items-center rounded-lg px-3 text-sm font-bold text-t-muted hover:text-t-ink">
            Masayı gör
          </button>
        )}
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 text-sm">
        <p className="rounded-xl bg-t-panel-2 px-3 py-2 font-semibold text-t-ink">
          {oynatilmadi ? "El oynatılmadı: fold ettin ve elde birden çok rakip kaldı; pot dağıtılmadı, rakip kartları açılmadı." : ozet.sonucMetni}
        </p>

        {ozet.showdown && (
          <div>
            <h3 className="mb-1 font-sans text-xs font-bold tracking-wider text-t-muted uppercase">Showdown</h3>
            <ul className="space-y-1">
              {ozet.showdown.map((e) => {
                const kazandi = r?.kazananlar.some((k) => k.koltuk === e.koltuk);
                return (
                  <li key={e.koltuk} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${kazandi ? "bg-t-accent/10 ring-1 ring-t-accent/50" : ""}`}>
                    <span className="w-16 font-semibold text-t-muted">{e.koltuk === heroPos ? `${e.koltuk} (sen)` : e.koltuk}</span>
                    <span className="flex gap-0.5">
                      {e.kartlar.map((c) => (
                        <PlayingCard key={c} card={c} size="xs" />
                      ))}
                    </span>
                    <span className="text-t-ink">{e.elAdi}</span>
                    {kazandi && <span className="ml-auto text-xs font-bold text-t-accent">Kazandı</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <h3 className="mb-1 font-sans text-xs font-bold tracking-wider text-t-muted uppercase">Kararların</h3>
          <ol className="space-y-1">
            {ozet.kararlar.map((k, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-t-panel-2 px-2 py-1.5">
                <span className="w-14 text-xs font-bold text-t-muted uppercase">{SOKAK_TR[k.sokak]}</span>
                <span className="font-bold text-t-ink tabular-nums">
                  {AKSIYON_TR[k.aksiyon]}
                  {k.aksiyon !== "fold" && k.aksiyon !== "check" ? ` ${fmt(k.miktar)}` : ""}
                </span>
                <span className="text-xs text-t-muted tabular-nums">pot {fmt(k.potOnce)}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${KADEME_RENK[k.kademe]}`}>{KADEME_ETIKET[k.kademe]}</span>
                {k.tahmini && <span className="w-full text-[11px] text-t-muted">Tahmini değerlendirme</span>}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="mb-1 font-sans text-xs font-bold tracking-wider text-t-muted uppercase">Pot büyümesi</h3>
          <p className="flex flex-wrap items-center gap-1 text-t-ink tabular-nums">
            {ozet.potSeyri.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <span aria-hidden="true" className="text-t-muted">→</span>}
                <span className="rounded-md bg-t-panel-2 px-1.5 py-0.5">
                  <span className="text-xs text-t-muted">{SOKAK_TR[p.sokak]} </span>
                  {fmt(p.pot)}
                </span>
              </span>
            ))}
            <span className="text-xs text-t-muted">BB</span>
          </p>
        </div>

        <p className="text-t-ink/90">{ozet.ders}</p>

        {kalanGoster && !kalan && (
          <button type="button" onClick={kalanGoster} className="min-h-11 rounded-xl border border-t-line bg-t-panel-2 px-4 font-bold text-t-ink hover:border-t-accent">
            Kartlar nasıl gelecekti?
          </button>
        )}
        {kalan && (
          <div>
            <h3 className="mb-1 font-sans text-xs font-bold tracking-wider text-t-muted uppercase">Kalan board</h3>
            <div className="flex gap-1" role="group" aria-label="Elin devamında açılacak board">
              {kalan.map((c) => (
                <PlayingCard key={c} card={c} size="sm" />
              ))}
            </div>
            <p className="mt-1 text-xs text-t-muted">Yalnızca board gösterilir; rakip kartları açılmaz.</p>
          </div>
        )}

        <p className="rounded-lg border border-t-line px-3 py-2 text-xs text-t-muted">
          Bu bir solver değildir; sonraki sokak değerlendirmeleri tahminidir.
        </p>
      </div>
    </section>
  );
}
