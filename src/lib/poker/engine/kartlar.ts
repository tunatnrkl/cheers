// Kart yardımcıları: el adları, board üzerinde el gücü tablosu, çekişler, doku, aralığa karşı equity.
import { splitCards } from "../cards";
import { RANKS, SUITS, cardFromString, evaluate7 } from "../evaluator";

export const kartNo = cardFromString;
export const kartAdi = (c: number) => RANKS[c >> 2] + SUITS[c & 3];
export const kartlar = (s: string | undefined) => splitCards(s).map(kartNo);

const KATEGORI = 16 ** 5;
export const kategori = (v: number) => Math.floor(v / KATEGORI);

const EL_ADLARI = ["yüksek kart", "per", "iki per", "üçlü", "kent", "floş", "full house", "kare", "kent floş"];

/** 5–7 karttan en iyi elin Türkçe adı. */
export function elAdi(cards: number[]): string {
  const v = evaluate7(cards);
  const k = kategori(v);
  if (k === 8 && Math.floor(v / 16 ** 4) % 16 === 12) return "royal floş";
  return EL_ADLARI[k];
}

/** İki karttan 169'luk etiket: "AKs", "QJo", "77". */
export function etiket(a: number, b: number): string {
  const [hi, lo] = a >> 2 >= b >> 2 ? [a, b] : [b, a];
  const x = RANKS[hi >> 2];
  const y = RANKS[lo >> 2];
  if (x === y) return x + y;
  return x + y + ((hi & 3) === (lo & 3) ? "s" : "o");
}

function kentVar(mask: number): boolean {
  for (let high = 12; high >= 4; high--) if (((mask >> (high - 4)) & 0x1f) === 0x1f) return true;
  return (mask & 0x100f) === 0x100f;
}

export const CEKIS_FLOS = 1;
export const CEKIS_KENT = 2; // iki uçlu ya da çift gutshot (8 out)
export const CEKIS_GUTSHOT = 4;

export type Tablo = {
  /** a*52+b (a<b): bu board'da olası tüm iki kartlık ellere göre güç yüzdeliği, 0..1 (1 = en güçlü) */
  pct: Float32Array;
  /** Çekiş bayrakları (yalnızca flop ve turn) */
  cekis: Uint8Array;
};

const tabloOnbellek = new Map<string, Tablo>();

/** Board üzerindeki her iki kartlık elin göreli gücü. Board'a göre önbelleklenir. */
export function tablo(board: number[]): Tablo {
  const key = board.join(",");
  const hit = tabloOnbellek.get(key);
  if (hit) return hit;

  const used = new Uint8Array(52);
  let boardMask = 0;
  const boardSuit = [0, 0, 0, 0];
  for (const c of board) {
    used[c] = 1;
    boardMask |= 1 << (c >> 2);
    boardSuit[c & 3]++;
  }
  const vals = new Float64Array(52 * 52);
  const list: number[] = [];
  const pct = new Float32Array(52 * 52);
  const cekis = new Uint8Array(52 * 52);
  const draws = board.length === 3 || board.length === 4;
  const cards = [0, 0, ...board];

  for (let a = 0; a < 52; a++) {
    if (used[a]) continue;
    for (let b = a + 1; b < 52; b++) {
      if (used[b]) continue;
      cards[0] = a;
      cards[1] = b;
      const v = evaluate7(cards);
      vals[a * 52 + b] = v;
      list.push(v);
      if (!draws) continue;
      let flag = 0;
      const k = kategori(v);
      if (k < 5) {
        for (let s = 0; s < 4; s++) {
          const mine = ((a & 3) === s ? 1 : 0) + ((b & 3) === s ? 1 : 0);
          if (mine > 0 && boardSuit[s] + mine === 4) flag |= CEKIS_FLOS;
        }
      }
      if (k < 4) {
        const mask = boardMask | (1 << (a >> 2)) | (1 << (b >> 2));
        let n = 0;
        for (let r = 0; r < 13; r++) {
          if (mask & (1 << r)) continue;
          if (kentVar(mask | (1 << r)) && !kentVar(boardMask | (1 << r))) n++;
        }
        if (n >= 2) flag |= CEKIS_KENT;
        else if (n === 1) flag |= CEKIS_GUTSHOT;
      }
      cekis[a * 52 + b] = flag;
    }
  }

  const sorted = Float64Array.from(list).sort();
  const n = sorted.length;
  const lower = (v: number) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (sorted[m] < v) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  const upper = (v: number) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (sorted[m] <= v) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  for (let a = 0; a < 52; a++) {
    if (used[a]) continue;
    for (let b = a + 1; b < 52; b++) {
      if (used[b]) continue;
      const v = vals[a * 52 + b];
      const lo = lower(v);
      pct[a * 52 + b] = (lo + (upper(v) - lo) / 2) / n;
    }
  }

  if (tabloOnbellek.size > 300) tabloOnbellek.clear();
  const t = { pct, cekis };
  tabloOnbellek.set(key, t);
  return t;
}

export const ikili = (a: number, b: number) => (a < b ? a * 52 + b : b * 52 + a);

export type Doku = { islak: boolean; ciftli: boolean; ad: "ıslak" | "kuru" };

/** Board dokusu: floş ve kent çekişlerine açık mı. */
export function doku(board: number[]): Doku {
  const suit = [0, 0, 0, 0];
  const count = new Array<number>(13).fill(0);
  for (const c of board) {
    suit[c & 3]++;
    count[c >> 2]++;
  }
  const ranks: number[] = [];
  for (let r = 0; r < 13; r++) if (count[r]) ranks.push(r);
  if (count[12]) ranks.unshift(-1); // as, wheel için alttan da sayılır
  let uclu = false;
  let ikiliYakin = false;
  for (let i = 0; i < ranks.length; i++) {
    if (i + 2 < ranks.length && ranks[i + 2] - ranks[i] <= 4) uclu = true;
    if (i + 1 < ranks.length && ranks[i + 1] - ranks[i] <= 2 && ranks[i] >= 0) ikiliYakin = true;
  }
  const maxSuit = Math.max(...suit);
  const islak = board.length >= 3 && (maxSuit >= 3 || uclu || (maxSuit === 2 && board.length < 5 && ikiliYakin));
  return { islak, ciftli: count.some((n) => n >= 2), ad: islak ? "ıslak" : "kuru" };
}

export type AgirlikliEl = { a: number; b: number; w: number };

/**
 * Elin bir aralığa karşı equity'si (0..1, beraberlik yarım sayılır).
 * River'da tam sayım; öncesinde tohumlu Monte Carlo.
 */
export function equity(hole: number[], board: number[], range: AgirlikliEl[], rnd: () => number, trials: number): number {
  const used = new Uint8Array(52);
  for (const c of hole) used[c] = 1;
  for (const c of board) used[c] = 1;
  const live = range.filter((x) => x.w > 0 && !used[x.a] && !used[x.b]);
  if (live.length === 0) return 0.5;

  const mine = [hole[0], hole[1], 0, 0, 0, 0, 0];
  const theirs = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < board.length; i++) {
    mine[2 + i] = board[i];
    theirs[2 + i] = board[i];
  }

  if (board.length === 5) {
    const hv = evaluate7(mine);
    let win = 0;
    let total = 0;
    for (const x of live) {
      theirs[0] = x.a;
      theirs[1] = x.b;
      const ov = evaluate7(theirs);
      win += x.w * (hv > ov ? 1 : hv === ov ? 0.5 : 0);
      total += x.w;
    }
    return win / total;
  }

  const cum = new Float64Array(live.length);
  let sum = 0;
  for (let i = 0; i < live.length; i++) {
    sum += live[i].w;
    cum[i] = sum;
  }
  let win = 0;
  const drawn: number[] = [];
  for (let t = 0; t < trials; t++) {
    const target = rnd() * sum;
    let lo = 0;
    let hi = live.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (cum[m] <= target) lo = m + 1;
      else hi = m;
    }
    const x = live[lo];
    used[x.a] = 1;
    used[x.b] = 1;
    drawn.length = 0;
    for (let i = board.length; i < 5; i++) {
      let c = Math.floor(rnd() * 52);
      while (used[c]) c = Math.floor(rnd() * 52);
      used[c] = 1;
      drawn.push(c);
      mine[2 + i] = c;
      theirs[2 + i] = c;
    }
    theirs[0] = x.a;
    theirs[1] = x.b;
    const hv = evaluate7(mine);
    const ov = evaluate7(theirs);
    win += hv > ov ? 1 : hv === ov ? 0.5 : 0;
    used[x.a] = 0;
    used[x.b] = 0;
    for (const c of drawn) used[c] = 0;
  }
  return win / trials;
}
