import { POSITIONS, type Hand, type Pos } from "@/data/hands";
import { splitCards } from "@/lib/poker/cards";
import { PlayingCard } from "./Cards";

// 6 kişilik masa. Kahraman her zaman altta ortada; diğer koltuklar saat yönünde dizilir.
// Koordinatlar masa kutusuna göre yüzde (sol, üst).
const SLOTS: [number, number][] = [
  [50, 85], // kahraman
  [10, 64],
  [10, 26],
  [50, 12],
  [90, 26],
  [90, 64],
];

type SeatState = "hero" | "active" | "folded" | "idle";

// "2.5 BB", "100 BB" gibi birim kullanımlarını pozisyon sanmamak için BB'den önce sayı olmamalı.
function posRegex(p: Pos) {
  return p === "BB" ? /(?<![\d.,]\s*)\bBB\b/g : new RegExp(`\\b${p}\\b`, "g");
}

/** Aksiyon metinlerinden hangi rakibin elde kaldığını, hangisinin fold ettiğini çıkarır. */
export function seatStates(hand: Hand): Record<Pos, SeatState> {
  const text = hand.actions.join(" | ");
  const states = {} as Record<Pos, SeatState>;
  for (const p of POSITIONS) {
    if (p === hand.heroPos) {
      states[p] = "hero";
      continue;
    }
    let state: SeatState = "idle";
    for (const m of text.matchAll(posRegex(p))) {
      const after = text.slice(m.index + m[0].length);
      state = /^\s*(\([^)]*\)\s*)?fold/i.test(after) ? "folded" : "active";
    }
    if (state === "idle" && /Blind'lar fold/i.test(text) && (p === "SB" || p === "BB")) state = "folded";
    states[p] = state;
  }
  return states;
}

export type OptionKind = "fold" | "passive" | "aggressive" | "allin";

export function optionKind(option: string): OptionKind {
  const o = option.toLocaleLowerCase("tr");
  if (o.startsWith("fold")) return "fold";
  if (o.includes("all-in")) return "allin";
  if (o.startsWith("check-raise")) return "aggressive";
  if (o.startsWith("check") || o.startsWith("call") || o.startsWith("limp")) return "passive";
  return "aggressive";
}

function Seat({ pos, state, stack, button }: { pos: Pos; state: SeatState; stack: number; button: boolean }) {
  const ring =
    state === "hero"
      ? "border-[#4fc693] text-white"
      : state === "active"
        ? "border-[#f0a03c] text-white"
        : "border-white/15 text-white/35";
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`grid size-14 place-items-center rounded-full border-[3px] bg-[#1b221f] text-center leading-tight sm:size-[72px] ${ring}`}
      >
        <span className="text-xs font-bold sm:text-sm">{state === "hero" ? "Sen" : pos}</span>
        {(state === "hero" || state === "active") && <span className="text-[11px] sm:text-xs">{stack} BB</span>}
        {state === "hero" && <span className="sr-only">({pos})</span>}
      </div>
      {state === "hero" && <span className="mt-0.5 text-[10px] font-semibold text-[#4fc693] sm:text-xs">{pos}</span>}
      {state === "folded" && <span className="mt-0.5 text-[10px] text-white/40 sm:text-xs">fold</span>}
      {button && (
        <span
          aria-label="Dağıtıcı butonu"
          className="absolute -right-2 -top-1 grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-black sm:size-6 sm:text-xs"
        >
          D
        </span>
      )}
    </div>
  );
}

export function PokerTable({ hand }: { hand: Hand }) {
  const states = seatStates(hand);
  const heroIdx = POSITIONS.indexOf(hand.heroPos);
  const board = splitCards(hand.board);

  return (
    <div className="rounded-2xl bg-[#121614] p-2 sm:p-4">
      {/* Aksiyon geçmişi şeridi */}
      <ol aria-label="Aksiyon sırası" className="flex gap-1.5 overflow-x-auto pb-2">
        {hand.actions.map((a, i) => (
          <li key={i} className="shrink-0 rounded-lg bg-white/8 px-2.5 py-1.5 text-xs text-white/85 sm:text-sm">
            {a}
          </li>
        ))}
        <li className="shrink-0 rounded-lg border border-[#4fc693] px-2.5 py-1.5 text-xs font-semibold text-[#4fc693] sm:text-sm">
          {hand.heroPos} · Sıra sende
        </li>
      </ol>

      {/* Masa */}
      <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl sm:aspect-[16/10]">
        <div className="absolute inset-x-[12%] inset-y-[14%] rounded-[999px] border-[6px] border-[#2a3430] bg-[radial-gradient(ellipse_at_center,#1f5a43_0%,#164233_70%)] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
          <p className="text-[11px] text-white/60 sm:text-sm">
            {hand.game === "cash" ? "Cash" : "Turnuva"} · {hand.stackBB} BB efektif
          </p>
          <p className="text-base font-bold sm:text-xl">Pot {hand.potBB} BB</p>
          {board.length > 0 && (
            <div className="flex gap-1" aria-label="Board">
              {board.map((c, i) => (
                <PlayingCard key={i} card={c} small />
              ))}
            </div>
          )}
        </div>

        {SLOTS.map(([x, y], slot) => {
          const pos = POSITIONS[(heroIdx + slot) % POSITIONS.length];
          return (
            <div key={pos} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              {slot === 0 ? (
                <div className="flex items-center gap-2">
                  <Seat pos={pos} state="hero" stack={hand.stackBB} button={pos === "BTN"} />
                  <div className="flex gap-1" aria-label="Senin kartların">
                    {splitCards(hand.hero).map((c, i) => (
                      <PlayingCard key={i} card={c} />
                    ))}
                  </div>
                </div>
              ) : (
                <Seat pos={pos} state={states[pos]} stack={hand.stackBB} button={pos === "BTN"} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
