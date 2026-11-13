import type { Hand } from "@/data/hands";
import { splitCards } from "@/lib/poker/cards";
import { SEATS, entryLabel, fmt, type ActKind, type Replay, type Seat } from "@/lib/poker/replay";
import { CardBack, PlayingCard } from "./Cards";

// 6 kişilik masa. Kahraman her zaman altta ortada, diğerleri saat yönünde.
// Koordinatlar masa kutusuna göre yüzde (sol, üst).
const SLOTS: [number, number][] = [
  [50, 87],
  [11, 67],
  [11, 27],
  [50, 12],
  [89, 27],
  [89, 67],
];
const CENTER: [number, number] = [50, 47];

export const KIND_BG: Record<ActKind, string> = {
  fold: "bg-t-fold",
  check: "bg-t-call",
  call: "bg-t-call",
  limp: "bg-t-call",
  raise: "bg-t-raise",
  bet: "bg-t-raise",
  allin: "bg-t-allin",
};
export const KIND_TEXT: Record<ActKind, string> = {
  fold: "text-[#9fb0c6]",
  check: "text-[#5fd497]",
  call: "text-[#5fd497]",
  limp: "text-[#5fd497]",
  raise: "text-[#ff9a5c]",
  bet: "text-[#ff9a5c]",
  allin: "text-[#ff7076]",
};

/** Seçenek metninden aksiyon türü: buton rengi için. */
export function optionKind(option: string): ActKind {
  const o = option.toLocaleLowerCase("tr");
  if (o.startsWith("fold")) return "fold";
  if (o.includes("all-in")) return "allin";
  if (o.startsWith("check-raise")) return "raise";
  if (o.startsWith("check")) return "check";
  if (o.startsWith("call") || o.startsWith("limp")) return "call";
  if (o.includes("bahis") || o.startsWith("bet")) return "bet";
  return "raise";
}

function lastAction(r: Replay, s: Seat) {
  for (let i = r.entries.length - 1; i >= 0; i--) {
    const e = r.entries[i];
    if (e.kind === "street") return null;
    if (e.pos === s) return e;
  }
  return null;
}

export function PokerTable({ hand, r }: { hand: Hand; r: Replay }) {
  const heroIdx = SEATS.indexOf(hand.heroPos);
  const board = splitCards(hand.board);

  return (
    // Masaüstünde masa, butonlar ekrana sığacak şekilde ekran yüksekliğine göre ölçeklenir.
    <div
      className="relative mx-auto aspect-[6/5] w-full sm:aspect-[16/10]"
      style={{ maxWidth: "min(860px, max(440px, calc((100dvh - 390px) * 1.6)))" }}
    >
      {/* Masa */}
      <div className="absolute inset-x-[13%] inset-y-[17%] rounded-[999px] bg-[#0a0d0c] p-[1.2%] shadow-[0_20px_60px_rgb(0_0_0/0.5)] sm:inset-x-[15%]">
        <div className="size-full rounded-[999px] border border-white/5 bg-[radial-gradient(ellipse_at_50%_40%,#1d5c45_0%,#154535_55%,#0f3428_100%)] shadow-[inset_0_0_50px_rgb(0_0_0/0.5)]" />
      </div>

      {/* Orta: pot ve board */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 sm:gap-2"
        style={{ left: `${CENTER[0]}%`, top: `${CENTER[1]}%` }}
      >
        <p className="rounded-full bg-black/35 px-3 py-0.5 text-xs font-bold text-white tabular-nums sm:text-sm">
          Pot {fmt(r.pot)} BB
        </p>
        {board.length > 0 && (
          <div className="flex gap-1" aria-label="Board">
            {board.map((c, i) => (
              <PlayingCard key={i} card={c} size="sm" />
            ))}
          </div>
        )}
      </div>

      {SLOTS.map(([x, y], slot) => {
        const pos = SEATS[(heroIdx + slot) % SEATS.length];
        const st = r.seats[pos];
        if (!st.present) return null;
        const hero = slot === 0;
        const last = lastAction(r, pos);
        const out = st.folded;
        // Bahis fişi: koltuktan merkeze doğru
        const bx = x + (CENTER[0] - x) * (hero ? 0.42 : 0.4);
        const by = y + (CENTER[1] - y) * (hero ? 0.42 : 0.4);
        return (
          <div key={pos}>
            {st.bet > 0 && (
              <div
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-black/45 py-0.5 pr-2 pl-0.5 text-[11px] font-bold text-white tabular-nums sm:text-xs"
                style={{ left: `${bx}%`, top: `${by}%` }}
              >
                <span aria-hidden="true" className="size-3.5 rounded-full border-2 border-dashed border-white/80 bg-[#c0392b] sm:size-4" />
                {fmt(st.bet)}
              </div>
            )}

            <div className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 sm:gap-2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className="relative flex flex-col items-center">
                {!hero && !out && (
                  <div className="absolute -top-4 flex -space-x-2 sm:-top-6">
                    <CardBack className="-rotate-6" />
                    <CardBack className="rotate-6" />
                  </div>
                )}
                <div
                  className={`relative z-10 flex min-w-[58px] flex-col items-center rounded-xl border px-1.5 py-0.5 text-center sm:min-w-[84px] sm:px-2 sm:py-1.5 ${
                    hero
                      ? "border-t-accent bg-t-panel-2 shadow-[0_0_0_3px_rgb(60_207_142/0.25)]"
                      : out
                        ? "border-dashed border-t-line bg-t-panel/70 opacity-80" // fold: soluk ama okunur (AA)
                        : "border-t-line bg-t-panel-2"
                  }`}
                >
                  <span className={`text-[11px] font-bold sm:text-xs ${hero ? "text-t-accent" : "text-t-muted"}`}>{hero ? `${pos} · Sen` : pos}</span>
                  <span className="text-[13px] font-bold text-t-ink tabular-nums sm:text-[15px]">{st.allin ? "All-in" : fmt(st.stack)}</span>
                  {last && !hero && (
                    <span className={`text-[10px] font-semibold sm:text-[11px] ${KIND_TEXT[last.act]}`}>{entryLabel(last)}</span>
                  )}
                </div>
                {pos === "BTN" && (
                  <span
                    aria-label="Dağıtıcı butonu"
                    className="absolute -right-2 -bottom-1.5 z-20 grid size-5 place-items-center rounded-full bg-white text-[10px] font-extrabold text-black shadow sm:size-6 sm:text-[11px]"
                  >
                    D
                  </span>
                )}
              </div>
              {hero && (
                <div className="flex gap-1" aria-label="Senin kartların">
                  {splitCards(hand.hero).map((c, i) => (
                    <PlayingCard key={i} card={c} size="lg" />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
