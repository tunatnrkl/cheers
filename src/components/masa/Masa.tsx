"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { splitCards } from "@/lib/poker/cards";
import { SEATS, fmt, type Seat } from "@/lib/poker/replay";
import { aksiyonEtiketi, type Gorunum, type RakipAksiyonu } from "@/app/alistirma/lib/gorunum";
import { CardBack, PlayingCard } from "../Cards";

// Oval masa: koltuklar çizginin üzerinde. Hero her zaman altta ortada, diğerleri saat yönünde.
// Konumlar .masa kutusunun yüzdesi; oval %12/%13 içeride (globals.css .masa-oval).
const RX = 38;
const RY = 37;
const ACILAR = [90, 150, 210, 270, 330, 30];
const SLOTLAR: [number, number][] = ACILAR.map((a) => [
  Math.round((50 + RX * Math.cos((a * Math.PI) / 180)) * 10) / 10,
  Math.round((50 + RY * Math.sin((a * Math.PI) / 180)) * 10) / 10,
]);
const MERKEZ: [number, number] = [50, 47];

/** Bahis çipinin konumu: koltuktan merkeze doğru. Hero'nunki kartlarının solunda. */
function bahisKonumu(slot: number, x: number, y: number): [number, number] {
  if (slot === 0) return [31, 77];
  return [x + 0.38 * (50 - x), y + (x === 50 ? 0.45 : 0.14) * (MERKEZ[1] - y)];
}

const RENK_SINIFI: Record<string, string> = {
  fold: "bg-[#3a2321] text-[#ffb4a6]",
  check: "bg-[#173a2a] text-[#8be0b4]",
  call: "bg-[#173a2a] text-[#8be0b4]",
  bet: "bg-[#41270f] text-[#ffc27a]",
  raise: "bg-[#41270f] text-[#ffc27a]",
  allin: "bg-[#4a1418] text-[#ff9da2]",
};

function useSayac(hedef: number, sure = 420) {
  const [deger, setDeger] = useState(hedef);
  const onceki = useRef(hedef);
  useEffect(() => {
    const bas = onceki.current;
    onceki.current = hedef;
    if (bas === hedef || sure <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDeger(hedef);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const adim = (t: number) => {
      const p = Math.min(1, (t - t0) / sure);
      setDeger(Math.round((bas + (hedef - bas) * (1 - (1 - p) ** 3)) * 100) / 100);
      if (p < 1) raf = requestAnimationFrame(adim);
    };
    raf = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(raf);
  }, [hedef, sure]);
  return deger;
}

export type MasaProps = {
  heroPos: Seat;
  heroKartlar: string;
  gorunum: Gorunum;
  /** El başına değişen anahtar: dağıtım animasyonu yeniden oynar */
  dagitim: string;
  siraSende: boolean;
  /** Hero kararından önceki son rakip aksiyonu (kalıcı vurgu) */
  sonRakip: RakipAksiyonu | null;
  /** "Son aksiyonu tekrar oynat" sayacı */
  tekrar: number;
  /** Oynatma hızı çarpanı (0: anında) */
  hiz: number;
  /** Oynatılan olay sayısı: vurgu halkasının yeniden oynaması için */
  olayNo: number;
};

export function Masa({ heroPos, heroKartlar, gorunum: g, dagitim, siraSende, sonRakip, tekrar, hiz, olayNo }: MasaProps) {
  const heroIdx = SEATS.indexOf(heroPos);
  const pot = useSayac(g.pot, hiz === 0 ? 0 : 420 * hiz);
  const kazananlar = new Set(g.sonuc?.kazananlar.map((k) => k.koltuk) ?? []);
  const acik = new Map(g.acik?.map((e) => [e.koltuk, e]) ?? []);
  const sdSira = g.acik?.map((e) => e.koltuk) ?? [];
  const yuvalar = Array.from({ length: 5 }, (_, i) => g.board[i] ?? null);
  const yeniKart = (i: number) => {
    // Flop üç kart art arda (~250 ms arayla); turn ve river tek kart
    if (g.board.length === 3) return i * 250 * Math.max(hiz, 0.4);
    return 0;
  };

  return (
    <div className="masa" key={dagitim}>
      <div className="masa-oval" aria-hidden="true" />

      {/* Orta: pot ve board */}
      <div className="masa-poz flex flex-col items-center gap-[1.4cqmin]" style={{ "--x": `${MERKEZ[0]}%`, "--y": `${MERKEZ[1]}%` } as CSSProperties}>
        <p className="masa-yazi rounded-full bg-black/40 px-3 py-0.5 font-bold text-t-ink tabular-nums" aria-live="off">
          Pot <span className="text-t-act">{fmt(pot)}</span> BB
        </p>
        <div className="flex gap-[1cqmin]" role="group" aria-label={g.board.length ? `Board: ${g.board.length} kart açık` : "Board: henüz kart açılmadı"}>
          {yuvalar.map((c, i) =>
            c ? (
              <PlayingCard
                key={c}
                card={c}
                size="fluid"
                className="anim-cevir"
                style={{ animationDelay: `${yeniKart(i)}ms` }}
              />
            ) : (
              <span key={`y${i}`} className="kart-yuva" aria-hidden="true">
                ♠
              </span>
            ),
          )}
        </div>
      </div>

      {SLOTLAR.map(([x, y], slot) => {
        const pos = SEATS[(heroIdx + slot) % SEATS.length];
        const st = g.seats[pos];
        if (!st.present) return null;
        const hero = slot === 0;
        const kazandi = kazananlar.has(pos);
        const vurgulu = g.vurgu === pos || (sonRakip?.koltuk === pos && siraSende);
        const kalici = sonRakip?.koltuk === pos && siraSende;
        const sd = acik.get(pos);
        const [bx, by] = bahisKonumu(slot, x, y);
        const dx = `${(MERKEZ[0] - x).toFixed(1)}cqw`;
        const dy = `${(MERKEZ[1] - y).toFixed(1)}cqh`;
        const etiket = st.son ? aksiyonEtiketi(st.son) : null;
        const ariaKoltuk = [
          hero ? `${pos}, sen` : pos,
          st.allin ? "all-in" : `stack ${fmt(st.stack)} BB`,
          st.folded ? "fold etti" : etiket ? `son aksiyon ${etiket}` : "",
          pos === "BTN" ? "dağıtıcı" : "",
          kazandi ? "potu kazandı" : "",
        ]
          .filter(Boolean)
          .join(", ");
        const kazanc = g.sonuc?.kazananlar.find((k) => k.koltuk === pos);
        return (
          <div key={pos}>
            {st.bet > 0 && (
              <div
                key={`${pos}-${st.bet}-${kalici ? tekrar : 0}`}
                className="masa-poz masa-yazi anim-cip flex items-center gap-1 rounded-full bg-black/55 py-0.5 pr-2 pl-0.5 font-bold text-t-ink tabular-nums"
                style={{ "--x": `${bx}%`, "--y": `${by}%`, "--dx": `${(x - bx).toFixed(1)}cqw`, "--dy": `${(y - by).toFixed(1)}cqh` } as CSSProperties}
                aria-hidden="true"
              >
                <span className="size-[1.1em] rounded-full border-2 border-dashed border-[#f6ebd0]/80 bg-[#b97f0c]" />
                {fmt(st.bet)}
              </div>
            )}

            <div className="masa-poz" style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties}>
              <div role="group" aria-label={ariaKoltuk} className={`relative ${st.folded && !hero ? "opacity-40" : ""} transition-opacity duration-300`}>
                {/* Rakip kartları: showdown olayından önce yalnızca kart sırtı */}
                {!hero && !st.folded && !sd && (
                  <div
                    className="absolute bottom-[78%] left-1/2 flex -translate-x-1/2 -space-x-[35%]"
                    aria-hidden="true"
                  >
                    {[0, 1].map((i) => (
                      <CardBack
                        key={`${dagitim}-${i}`}
                        fluid
                        className={`anim-dagit ${i ? "rotate-6" : "-rotate-6"}`}
                        style={{ "--dx": dx, "--dy": dy, animationDelay: `${(slot * 2 + i) * 40}ms` } as CSSProperties}
                      />
                    ))}
                  </div>
                )}
                {sd && !hero && (
                  <div className="absolute bottom-[70%] left-1/2 z-20 flex -translate-x-1/2 gap-[2px]">
                    {sd.kartlar.map((c, i) => (
                      <PlayingCard
                        key={c}
                        card={c}
                        size="fluid"
                        className="kart-sd anim-cevir"
                        style={{ animationDelay: `${(sdSira.indexOf(pos) * 380 + i * 120) * Math.max(hiz, 0.3)}ms` }}
                      />
                    ))}
                  </div>
                )}

                <div
                  className={`koltuk relative z-10 flex flex-col items-center justify-center rounded-full border-2 leading-tight ${
                    hero
                      ? "border-t-accent bg-[#2a2212] shadow-[0_0_0_4px_rgb(224_165_38/0.18)]"
                      : kazandi
                        ? "border-t-act bg-t-panel-2"
                        : "border-[#3b4640] bg-t-panel-2"
                  }`}
                >
                  <span key={`h-${g.vurgu === pos ? olayNo : "x"}-${kalici ? tekrar : 0}`} className="koltuk-halka" data-on={vurgulu ? "1" : "0"} />
                  <span className={`koltuk-yazi font-bold ${hero ? "text-t-accent" : "text-t-muted"}`}>{pos}</span>
                  <span className="koltuk-yazi font-extrabold text-t-ink tabular-nums">{st.allin ? "All-in" : fmt(st.stack)}</span>
                </div>

                {hero ? (
                  <span className="koltuk-yazi absolute top-full left-1/2 z-20 -translate-x-1/2 -translate-y-[45%] rounded-full bg-t-accent px-2 font-extrabold text-[#1c1404]">
                    Hero
                  </span>
                ) : (
                  etiket && (
                    <span
                      key={`${etiket}-${kalici ? tekrar : 0}`}
                      className={`koltuk-yazi anim-rozet absolute top-full left-1/2 z-20 -translate-x-1/2 -translate-y-[40%] rounded-full px-1.5 font-bold whitespace-nowrap ${
                        RENK_SINIFI[st.son!.aksiyon]
                      } ${kalici ? "ring-2 ring-t-act" : ""}`}
                    >
                      {etiket}
                    </span>
                  )
                )}

                {pos === "BTN" && (
                  <span
                    aria-hidden="true"
                    className={`absolute -top-[6%] z-20 grid size-[clamp(14px,3.6cqmin,20px)] place-items-center rounded-full bg-white text-[clamp(8px,2cqmin,11px)] font-extrabold text-black shadow ${
                      x > 50 ? "-left-[14%]" : "-right-[14%]"
                    }`}
                  >
                    D
                  </span>
                )}

                {kazanc && kazanc.miktar > 0 && (
                  <span
                    className="masa-yazi anim-cip absolute top-1/2 z-30 -translate-y-1/2 rounded-full bg-t-accent px-2 font-extrabold whitespace-nowrap text-[#1c1404] tabular-nums"
                    style={
                      {
                        [x > 50 ? "right" : "left"]: "calc(100% + 4px)",
                        "--dx": `${(MERKEZ[0] - x).toFixed(1)}cqw`,
                        "--dy": `${(MERKEZ[1] - y).toFixed(1)}cqh`,
                      } as CSSProperties
                    }
                  >
                    +{fmt(kazanc.miktar)}
                  </span>
                )}

                {hero && siraSende && (
                  <span className="masa-yazi anim-belir absolute top-1/2 left-[calc(100%+8px)] -translate-y-1/2 rounded-full border border-t-accent/60 bg-t-accent/15 px-2 py-0.5 font-bold whitespace-nowrap text-t-accent">
                    Sıra sende
                  </span>
                )}
              </div>
            </div>

            {hero && (
              <div
                className="masa-poz flex gap-[3px]"
                style={{ "--x": `${x}%`, "--y": `${y}%`, translate: "-50% calc(-100% - var(--koltuk) / 2 - 3px)" } as CSSProperties}
                role="group"
                aria-label="Senin kartların"
              >
                {splitCards(heroKartlar).map((c, i) => (
                  <PlayingCard
                    key={`${dagitim}-${c}`}
                    card={c}
                    size="fluid"
                    className="kart-hero anim-dagit"
                    style={{ "--dx": dx, "--dy": dy, animationDelay: `${(i + 1) * 60}ms` } as CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
