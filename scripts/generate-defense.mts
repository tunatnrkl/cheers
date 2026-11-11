// BB savunması alıştırma ellerini kendi hesabımızla üretir (src/data/defense.json).
// Yöntem: kahramanın elinin, açan oyuncunun aralığına (ranges.json) karşı Monte Carlo
// equity'si bulunur; pozisyon dışı oynamanın bedeli için "gerçekleşme" katsayısıyla
// düşürülür ve call için gereken pot odds ile karşılaştırılır. Sınıra yakın eller
// (tartışmalı olabilecekler) bilerek dışarıda bırakılır.
// Çalıştırma: node scripts/generate-defense.mts
import { readFileSync, writeFileSync } from "node:fs";
import { evaluate7 } from "../src/lib/poker/evaluator.ts";

const ranges = JSON.parse(readFileSync(new URL("../src/data/ranges.json", import.meta.url), "utf8"));

let seed = 20261111;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const R = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = "shdc";
const rankIdx = (ch: string) => 12 - R.indexOf(ch);
const labels: string[] = [];
for (let r = 0; r < 13; r++)
  for (let c = 0; c < 13; c++) labels.push(r === c ? R[r] + R[c] : r < c ? `${R[r]}${R[c]}s` : `${R[c]}${R[r]}o`);

/** Bir etiketin tüm somut kombinasyonları (kart numaraları). */
function combos(l: string): [number, number][] {
  const a = rankIdx(l[0]);
  const b = rankIdx(l[1]);
  const out: [number, number][] = [];
  for (let s1 = 0; s1 < 4; s1++)
    for (let s2 = 0; s2 < 4; s2++) {
      if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
      out.push([a * 4 + s1, b * 4 + s2]);
    }
  return out;
}

function equityVsRange(hero: [number, number], range: string[], trials: number): number {
  const vil = range.flatMap(combos).filter(([x, y]) => x !== hero[0] && x !== hero[1] && y !== hero[0] && y !== hero[1]);
  let score = 0;
  for (let t = 0; t < trials; t++) {
    const v = vil[Math.floor(rnd() * vil.length)];
    const used = new Set([hero[0], hero[1], v[0], v[1]]);
    const board: number[] = [];
    while (board.length < 5) {
      const c = Math.floor(rnd() * 52);
      if (!used.has(c)) {
        used.add(c);
        board.push(c);
      }
    }
    const h = evaluate7([...hero, ...board]);
    const w = evaluate7([...v, ...board]);
    score += h > w ? 1 : h === w ? 0.5 : 0;
  }
  return score / trials;
}

/** Pozisyon dışında equity'nin ne kadarının gerçekleşebildiğine dair kaba model. */
function realization(l: string, inPosition: boolean): number {
  let r: number;
  if (l.length === 2) r = 0.8;
  else if (l[2] === "s") r = 0.85;
  else r = rankIdx(l[0]) - rankIdx(l[1]) <= 2 ? 0.72 : 0.65;
  return inPosition ? r + 0.08 : r;
}

const SUIT_TR: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const ABL: Record<string, string> = { UTG: "UTG'den", HJ: "HJ'den", CO: "CO'dan", BTN: "butondan", SB: "SB'den" };
const PCT: Record<string, number> = { UTG: 15, HJ: 19, CO: 27, BTN: 43, SB: 38 };
const pretty = (cards: string) => (cards.match(/.{2}/g) ?? []).map((c) => (c[0] === "T" ? "10" : c[0]) + SUIT_TR[c[1]]).join(" ");
const pct = (x: number) => Math.round(x * 100);
const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

function concrete(l: string): string {
  const s1 = Math.floor(rnd() * 4);
  if (l.length === 3 && l[2] === "s") return l[0] + SUITS[s1] + l[1] + SUITS[s1];
  const s2 = (s1 + 1 + Math.floor(rnd() * 3)) % 4;
  return l[0] + SUITS[s1] + l[1] + SUITS[s2];
}
const toCard = (c: string) => rankIdx(c[0]) * 4 + SUITS.indexOf(c[1]);

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Game = "cash" | "turnuva";
type Scenario = { game: Game; opener: string; open: number; stack: number; ante: number; n: [number, number, number] };

// n: [3-bet, call, fold] sayıları
const scenarios: Scenario[] = [
  { game: "cash", opener: "UTG", open: 2.5, stack: 100, ante: 0, n: [2, 4, 4] },
  { game: "cash", opener: "HJ", open: 2.5, stack: 100, ante: 0, n: [2, 4, 4] },
  { game: "cash", opener: "CO", open: 2.5, stack: 100, ante: 0, n: [2, 4, 4] },
  { game: "cash", opener: "BTN", open: 2.5, stack: 100, ante: 0, n: [2, 4, 4] },
  { game: "cash", opener: "SB", open: 3, stack: 100, ante: 0, n: [2, 4, 4] },
  { game: "turnuva", opener: "UTG", open: 3, stack: 30, ante: 1, n: [2, 5, 5] },
  { game: "turnuva", opener: "HJ", open: 3, stack: 30, ante: 1, n: [2, 5, 5] },
  { game: "turnuva", opener: "CO", open: 3, stack: 30, ante: 1, n: [2, 5, 6] },
  { game: "turnuva", opener: "BTN", open: 3, stack: 30, ante: 1, n: [2, 6, 5] },
];

const out: Record<string, unknown>[] = [];
for (const s of scenarios) {
  const range: string[] = ranges.cash[s.opener];
  const pot = s.open + (s.opener === "SB" ? 0 : 0.5) + 1 + s.ante;
  const call = s.open - 1;
  const req = call / (pot + call);
  const ip = s.opener === "SB";
  const raiseTo = s.game === "cash" ? (ip ? 9 : 11) : 9;
  const options = ["Fold", `Call (${num(call)} BB)`, `3-bet ${raiseTo} BB`];

  const rated = labels.map((l) => {
    const hand = concrete(l);
    const eq = equityVsRange([toCard(hand.slice(0, 2)), toCard(hand.slice(2))], range, 20000);
    return { l, hand, eq, real: eq * realization(l, ip) };
  });
  // 3-bet: aralığın tepesine karşı bile açıkça önde olan eller.
  const threebet = rated.filter((h) => h.eq >= 0.66);
  // Call: 3-bet bölgesinin belirgin altında, gerçekleşen equity'si gerekenin açıkça üstünde.
  const calls = rated.filter((h) => h.eq <= 0.56 && h.real >= req + 0.06);
  // Fold: gerçekleşmeyi hiç hesaba katmasan bile sınırda kalmayan, açıkça zayıf eller.
  const folds = rated.filter((h) => h.real <= req - 0.06 && h.eq <= req + 0.12);
  const [n3, nc, nf] = s.n;
  const chosen = [
    ...shuffle(threebet).slice(0, n3).map((h) => ({ ...h, ans: 2 })),
    ...shuffle(calls).slice(0, nc).map((h) => ({ ...h, ans: 1 })),
    ...shuffle(folds).slice(0, nf).map((h) => ({ ...h, ans: 0 })),
  ];
  if (chosen.length !== n3 + nc + nf) throw new Error(`${s.game} ${s.opener}: yeterli el yok`);

  for (const h of chosen) {
    const ctx = `${s.opener} ${num(s.open)} BB'ye açtı; ${num(pot)} BB'lik pota ${num(call)} BB ödüyorsun, gereken equity %${pct(req)}.`;
    const eqTxt = `${pretty(h.hand)}, açan oyuncunun aralığına (ellerin en iyi ~%${PCT[s.opener]}) karşı ~%${pct(h.eq)} equity taşır`;
    const reasoning =
      h.ans === 2
        ? `${ctx} ${eqTxt}; bu aralığın büyük kısmına karşı önde. Call da kâr eder ama 3-bet ile potu önde olduğun anda büyütür, daha zayıf ellerden value alırsın ve rakibe zor kararlar bırakırsın.`
        : h.ans === 1
          ? `${ctx} ${eqTxt}. ${ip ? "Pozisyonda" : "Pozisyon dışında"} equity'nin bir kısmını kaybetsen de gerekenin rahatça üstünde kalır, call kârlı. 3-bet için ise aralığın tepesine karşı yeterince güçlü değil; görüldüğünde çoğu zaman geride olursun.`
          : `${ctx} ${eqTxt}. Kâğıt üzerinde yakın görünse de ${ip ? "" : "pozisyon dışında, "}bu el equity'sinin önemli kısmını gerçekleştiremez: ${h.l.endsWith("s") ? "per yaptığında sık sık domine olur ve floş ihtimali tek başına bu fiyatı karşılamaz." : "per yaptığında sık sık domine olur, iyi floş ve kent ihtimali azdır."} Bu fiyata savunmak uzun vadede chip kaybettirir.`;
    const loc = s.opener === "SB" ? "SB" : s.opener === "BTN" ? "Buton" : s.opener;
    out.push({
      id: `d-${s.game === "cash" ? "c" : "t"}-${s.opener}-${h.l}`,
      title: `${loc} ${num(s.open)} BB açtı, BB'de ${h.l}`,
      game: s.game,
      street: "preflop",
      heroPos: "BB",
      stackBB: s.stack,
      hero: h.hand,
      potBB: Math.round(pot * 100) / 100,
      seq: [`${s.opener} r${s.open}`],
      ...(s.ante ? { ante: s.ante } : {}),
      note:
        s.game === "cash"
          ? `6-max cash game, 100 BB. ${s.opener}, ${ABL[s.opener]} ellerin en iyi ~%${PCT[s.opener]} kadarını açan standart bir oyuncu; diğerleri fold etti.`
          : `Turnuva, 30 BB, toplam ante 1 BB, ICM baskısı yok. ${s.opener}, ellerin en iyi ~%${PCT[s.opener]} kadarını açan standart bir oyuncu; diğerleri fold etti.`,
      options,
      correct: h.ans,
      topic: "savunma",
      level: h.ans === 1 ? 2 : 1,
      reasoning,
    });
  }
  console.log(s.game, s.opener, `req %${pct(req)}`, "3bet", threebet.length, "call", calls.length, "fold", folds.length);
}

writeFileSync(new URL("../src/data/defense.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log("toplam", out.length);
