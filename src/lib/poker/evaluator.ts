// 7 kartlık el değerlendirici. Kart: 0..51, rank = c >> 2 (0 = 2, 12 = A), suit = c & 3.
// Dönen sayı büyüdükçe el güçlenir. Bağımlılığı yoktur; script'ler de doğrudan kullanır.

function straightHigh(mask: number): number {
  for (let high = 12; high >= 4; high--) {
    if (((mask >> (high - 4)) & 0x1f) === 0x1f) return high;
  }
  // A-2-3-4-5 (wheel)
  if ((mask & 0x100f) === 0x100f) return 3;
  return -1;
}

function pack(category: number, ranks: number[]): number {
  let v = category;
  for (let i = 0; i < 5; i++) v = v * 16 + (ranks[i] ?? 0);
  return v;
}

function topBits(mask: number, n: number): number[] {
  const out: number[] = [];
  for (let r = 12; r >= 0 && out.length < n; r--) if (mask & (1 << r)) out.push(r);
  return out;
}

export function evaluate7(cards: number[]): number {
  const rankCount = new Array<number>(13).fill(0);
  const suitMask = [0, 0, 0, 0];
  const suitCount = [0, 0, 0, 0];
  let rankMask = 0;
  for (const c of cards) {
    const r = c >> 2;
    const s = c & 3;
    rankCount[r]++;
    suitMask[s] |= 1 << r;
    suitCount[s]++;
    rankMask |= 1 << r;
  }

  for (let s = 0; s < 4; s++) {
    if (suitCount[s] >= 5) {
      const sf = straightHigh(suitMask[s]);
      if (sf >= 0) return pack(8, [sf]);
      return pack(5, topBits(suitMask[s], 5));
    }
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let r = 12; r >= 0; r--) {
    if (rankCount[r] === 4) quads.push(r);
    else if (rankCount[r] === 3) trips.push(r);
    else if (rankCount[r] === 2) pairs.push(r);
  }

  if (quads.length) {
    return pack(7, [quads[0], ...topBits(rankMask & ~(1 << quads[0]), 1)]);
  }
  if (trips.length && (trips.length > 1 || pairs.length)) {
    const second = trips.length > 1 ? Math.max(trips[1], pairs[0] ?? -1) : pairs[0];
    return pack(6, [trips[0], second]);
  }
  const st = straightHigh(rankMask);
  if (st >= 0) return pack(4, [st]);
  if (trips.length) {
    return pack(3, [trips[0], ...topBits(rankMask & ~(1 << trips[0]), 2)]);
  }
  if (pairs.length >= 2) {
    const rest = rankMask & ~(1 << pairs[0]) & ~(1 << pairs[1]);
    return pack(2, [pairs[0], pairs[1], ...topBits(rest, 1)]);
  }
  if (pairs.length === 1) {
    return pack(1, [pairs[0], ...topBits(rankMask & ~(1 << pairs[0]), 3)]);
  }
  return pack(0, topBits(rankMask, 5));
}

export const RANKS = "23456789TJQKA";
export const SUITS = "shdc";

export function cardFromString(s: string): number {
  const r = RANKS.indexOf(s[0].toUpperCase());
  const su = SUITS.indexOf(s[1].toLowerCase());
  if (r < 0 || su < 0) throw new Error(`Geçersiz kart: ${s}`);
  return r * 4 + su;
}
