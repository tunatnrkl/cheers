// Bir elin aksiyon dizisini oynatır: koltuk stack'leri, bahisler, pot ve sıradaki oyuncu.
// Hem masa çizimi hem aksiyon şeridi hem de veri doğrulama testi bunu kullanır.
//
// Dizi biçimi (string[]):
//   "UTG f"    fold          "BB x"     check
//   "BTN c"    call          "UTG l"    limp (preflop'ta 1 BB'yi görmek)
//   "CO r2.5"  raise (sokakta toplam 2.5 BB'ye)
//   "BB b3.7"  bet 3.7 BB    "SB a"     all-in
//   "F Kh9h3c" flop          "T 2d"     turn          "R 6s"   river
// Preflop'ta sırası geldiği halde dizide geçmeyen oyuncular fold etmiş sayılır.

export const SEATS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"] as const;
export type Seat = (typeof SEATS)[number];

export type ActKind = "fold" | "check" | "call" | "limp" | "raise" | "bet" | "allin";

export type Entry =
  | { kind: "act"; pos: Seat; stack: number; act: ActKind; amount?: number; auto?: boolean }
  | { kind: "street"; street: "flop" | "turn" | "river"; cards: string; pot: number };

export type SeatState = {
  present: boolean;
  stack: number;
  bet: number; // bu sokakta önüne koyduğu
  folded: boolean;
  allin: boolean;
  acted: boolean;
  start: number;
};

export type ReplayInput = {
  heroPos: Seat;
  stackBB: number;
  seq: string[];
  stacks?: Partial<Record<Seat, number>>;
  ante?: number;
  players?: Seat[];
};

export type Replay = {
  entries: Entry[];
  seats: Record<Seat, SeatState>;
  pot: number; // ortadaki toplam (sokaktaki bahisler dahil)
  toCall: number;
  street: "preflop" | "flop" | "turn" | "river";
  board: string;
  next: Seat | null;
  errors: string[];
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function fmt(n: number): string {
  return String(r2(n)).replace(".", ",");
}

export function replay(input: ReplayInput): Replay {
  const errors: string[] = [];
  const present = new Set<Seat>(input.players ?? SEATS);
  const seats = {} as Record<Seat, SeatState>;
  for (const s of SEATS) {
    const start = input.stacks?.[s] ?? input.stackBB;
    seats[s] = { present: present.has(s), stack: start, bet: 0, folded: !present.has(s), allin: false, acted: false, start };
  }

  const post = (s: Seat, amt: number) => {
    if (!seats[s].present) return;
    const a = Math.min(amt, seats[s].stack);
    seats[s].stack = r2(seats[s].stack - a);
    seats[s].bet = r2(seats[s].bet + a);
  };
  post("SB", 0.5);
  post("BB", 1);

  let collected = input.ante ?? 0;
  let currentBet = 1;
  let street: Replay["street"] = "preflop";
  let board = "";
  const entries: Entry[] = [];
  // Sıradaki oyuncuyu aramaya başlanacak koltuk: preflop'ta BB'den sonraki (UTG)
  let ptr = 0;
  let raised = false;

  const idx = (s: Seat) => SEATS.indexOf(s);
  const canAct = (s: Seat) => seats[s].present && !seats[s].folded && !seats[s].allin;
  const nextFrom = (from: number): Seat | null => {
    for (let i = 0; i < SEATS.length; i++) {
      const s = SEATS[(from + i) % SEATS.length];
      if (canAct(s)) return s;
    }
    return null;
  };

  /** Preflop'ta `target`'a gelene kadar sırası geçen ve henüz konuşmamış oyuncuları fold ettirir. */
  const advanceTo = (target: Seat): boolean => {
    for (let guard = 0; guard < SEATS.length; guard++) {
      const expected = nextFrom(ptr);
      if (expected === null) return false;
      if (expected === target) return true;
      if (street !== "preflop" || seats[expected].acted) {
        errors.push(`Sıra ${expected} oyuncusundaydı, ${target} konuştu`);
        return true;
      }
      seats[expected].folded = true;
      entries.push({ kind: "act", pos: expected, stack: seats[expected].stack, act: "fold", auto: true });
      ptr = idx(expected) + 1;
    }
    return false;
  };

  for (const step of input.seq) {
    const [head, arg = ""] = step.trim().split(/\s+/);
    if (head === "F" || head === "T" || head === "R") {
      const name = head === "F" ? "flop" : head === "T" ? "turn" : "river";
      for (const s of SEATS) {
        collected += seats[s].bet;
        seats[s].bet = 0;
        seats[s].acted = false;
      }
      collected = r2(collected);
      currentBet = 0;
      street = name;
      board += arg;
      entries.push({ kind: "street", street: name, cards: arg, pot: collected });
      // Flop sonrası ilk konuşan: butondan sonraki ilk oyuncu
      ptr = idx("SB");
      if (present.size === 2 && !present.has("BTN")) ptr = idx("BB");
      continue;
    }

    const pos = head as Seat;
    if (!SEATS.includes(pos)) {
      errors.push(`Bilinmeyen pozisyon: ${step}`);
      continue;
    }
    if (!advanceTo(pos)) errors.push(`${pos} konuşamaz: ${step}`);
    const st = seats[pos];
    const before = st.stack;
    const code = arg[0] ?? "";
    const num = Number(arg.slice(1));
    let act: ActKind;
    let amount: number | undefined;

    const putTo = (to: number) => {
      const add = Math.min(r2(to - st.bet), st.stack);
      st.stack = r2(st.stack - add);
      st.bet = r2(st.bet + add);
      if (st.stack === 0) st.allin = true;
    };

    switch (code) {
      case "f":
        st.folded = true;
        act = "fold";
        break;
      case "x":
        if (st.bet < currentBet) errors.push(`${pos} check edemez, önünde bahis var`);
        act = "check";
        break;
      case "c":
      case "l":
        putTo(currentBet);
        act = code === "l" || (street === "preflop" && !raised && pos !== "BB") ? "limp" : "call";
        amount = st.bet;
        break;
      case "r":
      case "b":
        if (!(num > currentBet)) errors.push(`${step}: artırma mevcut bahisten büyük olmalı`);
        putTo(num);
        currentBet = st.bet;
        raised = true;
        act = st.allin ? "allin" : code === "b" ? "bet" : "raise";
        amount = st.bet;
        break;
      case "a":
        putTo(st.bet + st.stack);
        currentBet = Math.max(currentBet, st.bet);
        raised = true;
        act = "allin";
        amount = st.bet;
        break;
      default:
        errors.push(`Bilinmeyen aksiyon: ${step}`);
        continue;
    }
    st.acted = true;
    entries.push({ kind: "act", pos, stack: before, act, amount });
    ptr = idx(pos) + 1;
  }

  // Kahramana kadar sırası gelen oyuncular (preflop) fold etmiş sayılır
  if (!advanceTo(input.heroPos)) errors.push("Kahramanın sırası gelmiyor");
  const next = nextFrom(ptr);
  if (next !== input.heroPos) errors.push(`Sıradaki oyuncu ${next}, kahraman ${input.heroPos}`);

  let pot = collected;
  for (const s of SEATS) pot += seats[s].bet;
  const hero = seats[input.heroPos];

  return {
    entries,
    seats,
    pot: r2(pot),
    toCall: r2(Math.min(currentBet - hero.bet, hero.stack)),
    street,
    board,
    next,
    errors,
  };
}

export const ACT_LABEL: Record<ActKind, string> = {
  fold: "Fold",
  check: "Check",
  call: "Call",
  limp: "Limp",
  raise: "Raise",
  bet: "Bet",
  allin: "All-in",
};

export function entryLabel(e: Extract<Entry, { kind: "act" }>): string {
  return e.amount !== undefined && e.act !== "call" && e.act !== "limp"
    ? `${ACT_LABEL[e.act]} ${fmt(e.amount)}`
    : ACT_LABEL[e.act];
}

/** Yapay zeka bağlamı için düz metin özet. */
export function describeSeq(r: Replay): string {
  const parts: string[] = [];
  let line: string[] = [];
  for (const e of r.entries) {
    if (e.kind === "street") {
      if (line.length) parts.push(line.join(", "));
      line = [];
      parts.push(`${e.street.toUpperCase()} ${e.cards} (pot ${fmt(e.pot)} BB)`);
    } else if (!(e.auto && e.act === "fold")) {
      line.push(`${e.pos} ${entryLabel(e).toLowerCase()}`);
    }
  }
  if (line.length) parts.push(line.join(", "));
  return parts.join(" → ") || "Herkes sana kadar fold etti";
}
