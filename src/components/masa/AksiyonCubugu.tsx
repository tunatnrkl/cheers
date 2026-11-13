"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HeroAksiyon, Kisayol, LegalActions } from "@/lib/poker/engine";
import { fmt } from "@/lib/poker/replay";
import { boyutSikistir } from "@/app/alistirma/lib/elAkisi";

// Renkler yalnızca destek: her butonda aksiyonun adı yazılı. Kontrast WCAG AA (≥ 4.5:1).
const RENK = {
  fold: "bg-[#c2412d] text-white",
  call: "bg-[#157347] text-white",
  raise: "bg-t-accent text-[#1c1404]",
  allin: "bg-[#8f1d24] text-white",
};

type Props = {
  legal: LegalActions;
  /** Sıra hero'da ve oynatma bitti */
  aktif: boolean;
  /** İlk kararda spotun kendi boyutları */
  ekKisayollar?: Kisayol[];
  onAksiyon: (a: HeroAksiyon) => void;
  /** Bilgi satırı (son rakip aksiyonu ya da geri bildirim) */
  bilgi?: ReactNode;
  /** El bitti: aksiyon yerine el sonu butonları */
  bitis?: ReactNode;
};

export function AksiyonCubugu({ legal, aktif, ekKisayollar = [], onAksiyon, bilgi, bitis }: Props) {
  const aralik = legal.bet ?? legal.raise;
  const kisayollar = useMemo(() => {
    if (!aralik) return [];
    const all = aralik.kısayollar.filter((k) => k.etiket !== "All-in");
    const allin = aralik.kısayollar.find((k) => k.etiket === "All-in");
    const ek = ekKisayollar.filter((k) => !all.some((a) => a.miktar === k.miktar) && k.miktar !== aralik.max);
    return [...all, ...ek].sort((a, b) => a.miktar - b.miktar).concat(allin ? [allin] : []);
  }, [aralik, ekKisayollar]);

  const varsayilan = useMemo(() => {
    if (!aralik) return 0;
    const ek = ekKisayollar[0];
    if (ek) return ek.miktar;
    return (kisayollar.find((k) => k.etiket === "1/2 pot") ?? kisayollar[0])?.miktar ?? aralik.min;
  }, [aralik, ekKisayollar, kisayollar]);

  const [boyut, setBoyut] = useState(varsayilan);
  const [yazi, setYazi] = useState(fmt(varsayilan));
  useEffect(() => {
    setBoyut(varsayilan);
    setYazi(fmt(varsayilan));
  }, [varsayilan]);

  function boyutSec(m: number) {
    const v = boyutSikistir(m, legal);
    setBoyut(v);
    setYazi(fmt(v));
  }

  const allinMi = !!aralik && boyut >= aralik.max - 1e-9;
  const artirAdi = legal.bet ? "Bet" : "Raise";

  function artir() {
    if (!aralik || !aktif) return;
    if (allinMi) onAksiyon({ tür: "allin" });
    else onAksiyon({ tür: legal.bet ? "bet" : "raise", miktar: boyut });
  }
  function call() {
    if (!aktif) return;
    if (legal.check) onAksiyon({ tür: "check" });
    else if (legal.call !== undefined) onAksiyon({ tür: "call" });
  }
  function fold() {
    if (aktif && legal.fold) onAksiyon({ tür: "fold" });
  }

  // Klavye: F fold, C check/call, R bet/raise, 1–9 boyut kısayolu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (!aktif || bitis || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t.closest("input, textarea, select, [role=dialog][aria-modal=false] form")) return;
      const k = e.key.toLocaleLowerCase("tr");
      if (k === "f" && legal.fold) {
        e.preventDefault();
        fold();
      } else if (k === "c" && (legal.check || legal.call !== undefined)) {
        e.preventDefault();
        call();
      } else if (k === "r" && aralik) {
        e.preventDefault();
        artir();
      } else if (/^[1-9]$/.test(k) && kisayollar[Number(k) - 1]) {
        e.preventDefault();
        boyutSec(kisayollar[Number(k) - 1].miktar);
      }
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const callEtiket = legal.check ? "Check" : legal.call !== undefined ? `Call ${fmt(legal.call)}` : "Call";
  const butonSayisi = (legal.fold ? 1 : 0) + 1 + (aralik ? 1 : 0);

  return (
    <div className="border-t border-t-line bg-t-panel px-2 pt-1.5 pb-2 sm:px-3" aria-label="Aksiyonlar" role="region">
      <div className="flex min-h-11 items-center gap-2 text-[13px] sm:text-sm">{bilgi}</div>

      {bitis ? (
        <div className="mt-1">{bitis}</div>
      ) : (
        <div className="aksiyon-duzen mt-1 grid gap-2">
          {aralik && (
            <div className={`flex min-w-0 items-center gap-1.5 ${aktif ? "" : "pointer-events-none opacity-35"}`} role="group" aria-label="Bahis boyutu">
              <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
                {kisayollar.map((k, i) => {
                  const on = Math.abs(k.miktar - boyut) < 1e-9;
                  return (
                    <button
                      key={`${k.etiket}-${k.miktar}`}
                      type="button"
                      disabled={!aktif}
                      aria-pressed={on}
                      onClick={() => boyutSec(k.miktar)}
                      title={`${k.etiket}: ${fmt(k.miktar)} BB${i < 9 ? ` (kısayol ${i + 1})` : ""}`}
                      className={`relative flex min-h-11 shrink-0 flex-col items-center justify-center rounded-lg border px-2 text-[12px] leading-tight font-bold transition ${
                        on ? "border-t-accent bg-t-accent/15 text-t-ink" : "border-t-line bg-t-panel-2 text-t-muted hover:text-t-ink"
                      }`}
                    >
                      <span>{k.etiket}</span>
                      <span className="text-[11px] font-semibold tabular-nums opacity-85">{fmt(k.miktar)}</span>
                    </button>
                  );
                })}
              </div>
              <label className="sr-only" htmlFor="boyut-kaydir">
                Bahis boyutu kaydırıcısı
              </label>
              <input
                id="boyut-kaydir"
                type="range"
                min={aralik.min}
                max={aralik.max}
                step={0.5}
                value={boyut}
                disabled={!aktif}
                onChange={(e) => boyutSec(Number(e.target.value))}
                className="hidden h-11 w-24 accent-[#e0a526] sm:block md:w-32"
              />
              <label className="sr-only" htmlFor="boyut-sayi">
                Bahis boyutu (BB, sokakta toplam)
              </label>
              <input
                id="boyut-sayi"
                inputMode="decimal"
                value={yazi}
                disabled={!aktif}
                onChange={(e) => setYazi(e.target.value)}
                onBlur={() => boyutSec(Number(yazi.replace(",", ".")))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    boyutSec(Number(yazi.replace(",", ".")));
                  }
                }}
                className="min-h-11 w-16 shrink-0 rounded-lg border border-t-line bg-t-bg px-2 text-center text-sm font-bold text-t-ink tabular-nums focus:border-t-accent"
              />
            </div>
          )}

          <div className={`grid gap-2 ${butonSayisi === 3 ? "grid-cols-3" : butonSayisi === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {legal.fold && (
              <button type="button" disabled={!aktif} onClick={fold} className={`aksiyon-btn ${RENK.fold} min-h-12 rounded-xl px-2 font-extrabold`}>
                Fold
                <kbd className="ml-1.5 hidden text-[11px] font-bold opacity-70 lg:inline">F</kbd>
              </button>
            )}
            <button type="button" disabled={!aktif} onClick={call} className={`aksiyon-btn ${RENK.call} min-h-12 rounded-xl px-2 font-extrabold tabular-nums`}>
              {callEtiket}
              <kbd className="ml-1.5 hidden text-[11px] font-bold opacity-70 lg:inline">C</kbd>
            </button>
            {aralik && (
              <button
                type="button"
                disabled={!aktif}
                onClick={artir}
                className={`aksiyon-btn ${allinMi ? RENK.allin : RENK.raise} min-h-12 rounded-xl px-2 font-extrabold tabular-nums`}
              >
                {allinMi ? `All-in ${fmt(aralik.max)}` : `${artirAdi} ${fmt(boyut)}`}
                <kbd className="ml-1.5 hidden text-[11px] font-bold opacity-70 lg:inline">R</kbd>
              </button>
            )}
          </div>
        </div>
      )}
      <p className="kisayol-ipucu mt-1 hidden text-center text-[11px] text-t-muted lg:block">
        Kısayollar: F fold · C check/call · R bet/raise · 1–{Math.max(1, Math.min(9, kisayollar.length))} boyut · Enter sonraki el · Esc paneli kapatır
      </p>
    </div>
  );
}
