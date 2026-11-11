// Mevcut drills.json'a YENİ alıştırma elleri ekler; var olan elleri değiştirmez.
// Her çalıştırmada farklı bir tohumla yeni spotlar üretir, id çakışmalarını atlar.
// Tüm cevaplar kendi hesabımızla belirlenir; sınırdaki (tartışmalı) spotlar alınmaz.
// Çalıştırma: npm run drills:add [-- --max=120]
//
// Üretilen türler:
//   r-  / p-   Açılış ve push/fold: ranges.json aralığıyla tutarlı, henüz eklenmemiş eller
//   s*-        BB'de all-in'e call/fold: yeni pozisyon/stack kombinasyonları (Monte Carlo)
//   o-         Turn all-in, rakip kartları açık: 44 river kartı tek tek sayılır
//   f-         Flop all-in, rakip kartları açık: 990 turn+river ikilisi tek tek sayılır
import { readFileSync, writeFileSync } from "node:fs";
import { evaluate7 } from "../src/lib/poker/evaluator.ts";

const DRILLS_URL = new URL("../src/data/drills.json", import.meta.url);
const ranges = JSON.parse(readFileSync(new URL("../src/data/ranges.json", import.meta.url), "utf8"));
const drills: Record<string, unknown>[] = JSON.parse(readFileSync(DRILLS_URL, "utf8"));
const ids = new Set(drills.map((d) => d.id as string));

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const MAX = Number(arg("max") ?? 120);

let seed = Number(arg("seed") ?? (Date.now() % 2147483647)) | 0;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const R = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const rankIdx = (ch: string) => 12 - R.indexOf(ch);
const SUITS = "shdc";
const SUIT_TR: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const LOC: Record<string, string> = { UTG: "UTG'de", HJ: "HJ'de", CO: "CO'da", BTN: "BTN'de", SB: "SB'de", BB: "BB'de" };
const ABL: Record<string, string> = { UTG: "UTG'den", HJ: "HJ'den", CO: "CO'dan", BTN: "BTN'den", SB: "SB'den", BB: "BB'den" };
const BEHIND: Record<string, number> = { UTG: 5, HJ: 4, CO: 3, BTN: 2, SB: 1 };
const pct = (x: number) => Math.round(x * 100);
const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const r2 = (n: number) => Math.round(n * 100) / 100;
const cardStr = (c: number) => R[12 - (c >> 2)] + SUITS[c & 3];
const toCard = (c: string) => rankIdx(c[0]) * 4 + SUITS.indexOf(c[1]);
const pretty = (cards: string) =>
  (cards.match(/.{2}/g) ?? []).map((c) => (c[0] === "T" ? "10" : c[0]) + SUIT_TR[c[1]]).join(" ");

const labels: string[] = [];
for (let r = 0; r < 13; r++)
  for (let c = 0; c < 13; c++) labels.push(r === c ? R[r] + R[c] : r < c ? `${R[r]}${R[c]}s` : `${R[c]}${R[r]}o`);
const combos = (l: string) => (l.length === 2 ? 6 : l.endsWith("s") ? 4 : 12);
const equity: Record<string, number> = ranges.equity;

// generate-ranges.mts ile birebir aynı sıralama fonksiyonları
function openScore(l: string): number {
  let s = equity[l];
  if (l.length === 2) return s + 0.06;
  const hi = rankIdx(l[0]);
  const lo = rankIdx(l[1]);
  const gap = hi - lo - 1;
  if (l.endsWith("s")) s += 0.045;
  else s -= 0.015;
  if (gap === 0) s += 0.035;
  else if (gap === 1) s += 0.022;
  else if (gap === 2) s += 0.01;
  else if (gap >= 4 && hi !== 12) s -= 0.03;
  if (hi === 12 && l.endsWith("s") && lo <= 3) s += 0.012;
  return s;
}
const pushScore = (l: string) => equity[l] + (openScore(l) - equity[l]) * 0.5;
function percentiles(score: (l: string) => number) {
  const sorted = [...labels].sort((x, y) => score(y) - score(x));
  const map = new Map<string, [number, number]>();
  let n = 0;
  for (const l of sorted) {
    map.set(l, [(n / 1326) * 100, ((n + combos(l)) / 1326) * 100]);
    n += combos(l);
  }
  return map;
}
function concrete(l: string): string {
  const s1 = Math.floor(rnd() * 4);
  if (l.length === 2) {
    const s2 = (s1 + 1 + Math.floor(rnd() * 3)) % 4;
    return l[0] + SUITS[s1] + l[1] + SUITS[s2];
  }
  if (l[2] === "s") return l[0] + SUITS[s1] + l[1] + SUITS[s1];
  const s2 = (s1 + 1 + Math.floor(rnd() * 3)) % 4;
  return l[0] + SUITS[s1] + l[1] + SUITS[s2];
}
function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const added: Record<string, unknown>[] = [];
const count: Record<string, number> = {};
function add(kind: string, d: Record<string, unknown>) {
  if (added.length >= MAX || ids.has(d.id as string)) return false;
  ids.add(d.id as string);
  added.push(d);
  count[kind] = (count[kind] ?? 0) + 1;
  return true;
}
const quota = (share: number) => Math.max(1, Math.round(MAX * share));

// ── f-: Flop all-in, rakibin kartları açık ───────────────────────────
// Kahraman şu an geride; kalan 45 karttan 990 turn+river ikilisi sayılır.
function flopSpots(limit: number) {
  const LINES = [
    { name: "srp", pre: ["BTN r2.5", "SB f", "BB c"], potF: 5.5, invested: 2.5, stacks: [20, 30, 40, 60, 100] },
    { name: "3bp", pre: ["BTN r2.5", "SB f", "BB r9", "BTN c"], potF: 18.5, invested: 9, stacks: [20, 25, 30, 40, 50] },
  ];
  const want = { call: Math.ceil(limit / 2), fold: Math.floor(limit / 2) };
  const got = { call: 0, fold: 0 };
  for (let guard = 0; guard < 400000 && got.call + got.fold < limit; guard++) {
    const deck = shuffle(Array.from({ length: 52 }, (_, i) => i)).slice(0, 7);
    const hero = deck.slice(0, 2);
    const vil = deck.slice(2, 4);
    const board = deck.slice(4, 7);
    const evH = evaluate7([...hero, ...board]);
    const evV = evaluate7([...vil, ...board]);
    if (evV <= evH) continue;
    const used = new Set(deck);
    const rest: number[] = [];
    for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
    let wins = 0;
    for (let i = 0; i < rest.length; i++)
      for (let j = i + 1; j < rest.length; j++) {
        const h = evaluate7([...hero, ...board, rest[i], rest[j]]);
        const v = evaluate7([...vil, ...board, rest[i], rest[j]]);
        wins += h > v ? 1 : h === v ? 0.5 : 0;
      }
    const eq = wins / 990;
    if (eq < 0.12 || eq > 0.6) continue;

    const line = LINES[Math.floor(rnd() * LINES.length)];
    const S = line.stacks[Math.floor(rnd() * line.stacks.length)];
    const shove = r2(S - line.invested);
    const finalPot = r2(line.potF + 2 * shove);
    const req = shove / finalPot;
    if (Math.abs(eq - req) < 0.04) continue;
    const ok = eq > req;
    const k = ok ? "call" : "fold";
    if (got[k] >= want[k]) continue;

    const heroBB = rnd() < 0.5;
    const heroPos = heroBB ? "BB" : "BTN";
    const vilPos = heroBB ? "BTN" : "BB";
    const flop = board.map(cardStr).join("");
    const seq = [...line.pre, `F ${flop}`, ...(heroBB ? ["BB x", "BTN a"] : ["BB a"])];
    const heroCards = hero.map(cardStr).join("");
    const vilCards = vil.map(cardStr).join("");
    const potName = line.name === "srp" ? "tek raise'li potta" : "3-bet'li potta";
    const ok2 = add("f", {
      id: `f-${heroCards}-${flop}`,
      title: `Flop all-in ${potName}: call mı, fold mu?`,
      game: "cash", street: "flop", heroPos, stackBB: S,
      hero: heroCards, board: flop, potBB: r2(line.potF + shove), seq,
      villain: { pos: vilPos, cards: vilCards },
      note: `Pot odds alıştırması: ${vilPos} flop'ta all-in yaptı ve kartlarını gösterdi (${pretty(vilCards)}). Efektif stack ${S} BB.`,
      options: ["Fold", `Call (${num(shove)} BB)`], correct: ok ? 1 : 0, topic: "odds", level: line.name === "srp" ? 2 : 3,
      reasoning: `Call için ${num(shove)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. Kalan 990 turn-river ikilisi tek tek sayıldığında ${num(wins)} tanesinde kazanıyorsun (beraberlik yarım): equity ≈ %${pct(eq)}. ${ok ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold."} İki kart gelecekken out sayısını 4 ile çarpmak hızlı bir tahmin verir; all-in olduğu için ek bahis riski yok.`,
    });
    if (ok2) got[k]++;
  }
}
// ── o-: Turn all-in, rakibin kartları açık ─────────────────────────────
function turnSpots(limit: number) {
  const want = { call: Math.ceil(limit / 2), fold: Math.floor(limit / 2) };
  const got = { call: 0, fold: 0 };
  for (let guard = 0; guard < 400000 && got.call + got.fold < limit; guard++) {
    const deck = shuffle(Array.from({ length: 52 }, (_, i) => i)).slice(0, 8);
    const hero = deck.slice(0, 2);
    const vil = deck.slice(2, 4);
    const board = deck.slice(4, 8);
    if (evaluate7([...vil, ...board]) <= evaluate7([...hero, ...board])) continue;
    let wins = 0;
    const used = new Set(deck);
    for (let c = 0; c < 52; c++) {
      if (used.has(c)) continue;
      const h = evaluate7([...hero, ...board, c]);
      const v = evaluate7([...vil, ...board, c]);
      wins += h > v ? 1 : h === v ? 0.5 : 0;
    }
    const eq = wins / 44;
    if (eq < 0.06 || eq > 0.5 || !Number.isInteger(wins)) continue;
    const S = [15, 20, 25, 30, 40, 60][Math.floor(rnd() * 6)];
    const flopBet = 2.75;
    const potTurn = 5.5 + 2 * flopBet;
    const shove = S - 2.5 - flopBet;
    const finalPot = potTurn + 2 * shove;
    const req = shove / finalPot;
    if (Math.abs(eq - req) < 0.04) continue;
    const ok = eq > req;
    const k = ok ? "call" : "fold";
    if (got[k] >= want[k]) continue;
    const heroBB = rnd() < 0.5;
    const heroPos = heroBB ? "BB" : "BTN";
    const vilPos = heroBB ? "BTN" : "BB";
    const flop = board.slice(0, 3).map(cardStr).join("");
    const turn = cardStr(board[3]);
    const seq = heroBB
      ? ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB x", "BTN a"]
      : ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB a"];
    const heroCards = hero.map(cardStr).join("");
    const vilCards = vil.map(cardStr).join("");
    const ok2 = add("o", {
      id: `o-${heroCards}-${flop}${turn}`,
      title: `Turn all-in: ${wins} out ile call?`,
      game: "cash", street: "turn", heroPos, stackBB: S,
      hero: heroCards, board: flop + turn, potBB: r2(potTurn + shove), seq,
      villain: { pos: vilPos, cards: vilCards },
      note: `Pot odds alıştırması: ${vilPos} turn'de all-in yaptı ve kartlarını gösterdi (${pretty(vilCards)}). Efektif stack ${S} BB.`,
      options: ["Fold", `Call (${num(shove)} BB)`], correct: ok ? 1 : 0, topic: "odds", level: 2,
      reasoning: `Call için ${num(shove)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. Rakibin elini yenen ${wins} river kartı var: ${wins}/44 ≈ %${pct(eq)}. ${ok ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold."} All-in olduğu için sonradan kazanılacak ek chip yok; yalnızca bu hesap önemli.`,
    });
    if (ok2) got[k]++;
  }
}

// ── r- / p-: henüz eklenmemiş açılış ve push/fold elleri ─────────────
function openSpots(limit: number) {
  const openPct = percentiles(openScore);
  const cashTargets: Record<string, number> = { UTG: 15, HJ: 19, CO: 27, BTN: 43, SB: 38 };
  const rfiFoldFrom: Record<string, number> = { UTG: 25, HJ: 32, CO: 42, BTN: 58, SB: 62 };
  const mixedOpen = (l: string, pos: string) => {
    if (l.length === 2 || l[2] !== "s") return false;
    if (pos === "SB") return true;
    const gap = rankIdx(l[0]) - rankIdx(l[1]) - 1;
    if (gap <= 1) return true;
    if (l[0] === "A") return true;
    return l[0] === "K" && pos !== "UTG" && pos !== "HJ";
  };
  const pool: (() => boolean)[] = [];
  for (const [pos, target] of Object.entries(cashTargets)) {
    const range = new Set<string>(ranges.cash[pos]);
    for (const l of labels) {
      const [lo, hi] = openPct.get(l)!;
      const raise = range.has(l) && hi <= target - 4;
      const fold = !range.has(l) && !mixedOpen(l, pos) && lo >= rfiFoldFrom[pos] && lo <= rfiFoldFrom[pos] + 30;
      if (!raise && !fold) continue;
      pool.push(() => {
        const options = pos === "SB" ? ["Fold", "3 BB aç"] : ["Fold", "Limp (1 BB)", "2.5 BB aç"];
        const p = pct(hi / 100);
        return add("r", {
          id: `r-${pos}-${l}`, title: `${LOC[pos]} ${l}`,
          game: "cash", street: "preflop", heroPos: pos, stackBB: 100,
          hero: concrete(l), potBB: 1.5, seq: [],
          note: "6-max cash game, 100 BB. Herkes sana kadar fold etti.",
          options, correct: raise ? options.length - 1 : 0, topic: "acilis", level: 1,
          reasoning: raise
            ? `${l} ${ABL[pos]} açılacak kadar güçlü: ellerin en iyi ~%${p}'inde, ${pos} ise yaklaşık en iyi %${target} ile açar. Önünde herkes fold etti; raise ile ya blind'ları hemen alırsın ya da inisiyatifle oynarsın. Limp ise inisiyatifi verir.`
            : `${l}, ${pos} için fazla zayıf: ellerin en iyi ~%${p}'inde, ${pos} ise yaklaşık en iyi %${target} ile açar. Arkanda ${BEHIND[pos]} oyuncu varken bu el görüldüğünde çoğu zaman geride kalır; limp de kârlı değildir.`,
        });
      });
    }
  }
  const pushPct = percentiles(pushScore);
  const pushTargets: Record<string, Record<string, number>> = {
    "6": { UTG: 20, HJ: 25, CO: 33, BTN: 48, SB: 68 },
    "10": { UTG: 13, HJ: 17, CO: 24, BTN: 36, SB: 54 },
    "15": { UTG: 9, HJ: 12, CO: 17, BTN: 26, SB: 40 },
  };
  const pushFoldFrom: Record<string, Record<string, number>> = {
    "6": { UTG: 45, HJ: 55, CO: 65, BTN: 80, SB: 101 },
    "10": { UTG: 33, HJ: 42, CO: 52, BTN: 70, SB: 101 },
    "15": { UTG: 26, HJ: 32, CO: 40, BTN: 58, SB: 80 },
  };
  for (const [bb, targets] of Object.entries(pushTargets))
    for (const [pos, target] of Object.entries(targets)) {
      const range = new Set<string>(ranges.push[bb][pos]);
      for (const l of labels) {
        const [lo, hi] = pushPct.get(l)!;
        const push = range.has(l) && hi <= target - 3;
        const fold = !range.has(l) && lo >= pushFoldFrom[bb][pos];
        if (!push && !fold) continue;
        pool.push(() => {
          const p = pct(hi / 100);
          return add("p", {
            id: `p${bb}-${pos}-${l}`, title: `${bb} BB ile ${LOC[pos]} ${l}`,
            game: "turnuva", street: "preflop", heroPos: pos, stackBB: Number(bb),
            hero: concrete(l), potBB: 2.5, seq: [], ante: 1,
            note: `Turnuvanın orta aşaması, ICM baskısı yok. Herkesin ${bb} BB'si var; toplam ante 1 BB. Herkes sana kadar fold etti.`,
            options: ["Fold", `All-in (${bb} BB)`], correct: push ? 1 : 0, topic: "pushfold", level: 1,
            reasoning: push
              ? `${bb} BB ile ${ABL[pos]} ${l} rahat bir all-in: ellerin en iyi ~%${p}'inde, bu spotta en az en iyi %${target} itilir. Herkes fold ederse 2,5 BB'lik pot senin; görülürsen de yeterli equity taşırsın. Bu stack'te açıp fold etmek pahalıdır.`
              : `${l}, ${bb} BB ile ${ABL[pos]} itmek için fazla zayıf: ellerin ancak en iyi ~%${p}'inde. Arkanda ${BEHIND[pos]} oyuncu varken görülme ihtimali yüksek ve görüldüğünde çoğunlukla geride kalırsın. Daha iyi bir spot beklemek daha az chip kaybettirir.`,
          });
        });
      }
    }
  let n = 0;
  for (const f of shuffle(pool)) {
    if (n >= limit) break;
    if (f()) n++;
  }
}

// ── s*: BB'de all-in'e karşı call/fold, yeni pozisyon/stack kombinasyonları ──
function rangeCombos(list: string[]): [number, number][] {
  const out: [number, number][] = [];
  for (const l of list) {
    const a = rankIdx(l[0]);
    const b = rankIdx(l[1]);
    for (let s1 = 0; s1 < 4; s1++)
      for (let s2 = 0; s2 < 4; s2++) {
        if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
        out.push([a * 4 + s1, b * 4 + s2]);
      }
  }
  return out;
}
function equityVsRange(hero: [number, number], range: [number, number][], trials: number): number {
  const live = range.filter(([x, y]) => x !== hero[0] && x !== hero[1] && y !== hero[0] && y !== hero[1]);
  let score = 0;
  const deck: number[] = [];
  for (let t = 0; t < trials; t++) {
    const [v1, v2] = live[Math.floor(rnd() * live.length)];
    deck.length = 0;
    for (let c = 0; c < 52; c++) if (c !== hero[0] && c !== hero[1] && c !== v1 && c !== v2) deck.push(c);
    for (let i = 0; i < 5; i++) {
      const j = i + Math.floor(rnd() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const board = deck.slice(0, 5);
    const h = evaluate7([hero[0], hero[1], ...board]);
    const v = evaluate7([v1, v2, ...board]);
    score += h > v ? 1 : h === v ? 0.5 : 0;
  }
  return score / trials;
}
function shoveSpots(limit: number) {
  const ORDER = ["UTG", "HJ", "CO", "BTN", "SB"];
  const COMBOS: [string, string][] = [];
  for (const bb of ["6", "10", "15"]) for (const pos of ORDER) COMBOS.push([pos, bb]);
  let n = 0;
  for (let guard = 0; guard < 3000 && n < limit; guard++) {
    const [pos, bb] = COMBOS[Math.floor(rnd() * COMBOS.length)];
    const l = labels[Math.floor(rnd() * labels.length)];
    const id = `s${bb}-${pos}-${l}`;
    if (ids.has(id)) continue;
    const S = Number(bb);
    const list = rangeCombos(ranges.push[bb][pos]);
    const rangePct = pct(list.length / 1326);
    const dead = pos === "SB" ? 0 : 0.5;
    const finalPot = 2 * S + 1 + dead;
    const call = S - 1;
    const req = call / finalPot;
    const cards = concrete(l);
    const eq = equityVsRange([toCard(cards.slice(0, 2)), toCard(cards.slice(2))], list, 12000);
    if (Math.abs(eq - req) < 0.04) continue;
    const ok = eq > req;
    const between = ORDER.slice(ORDER.indexOf(pos) + 1, 4).map((p) => `${p} f`);
    const seq = pos === "SB" ? ["SB a"] : [`${pos} a`, ...between, "SB f"];
    if (
      add("s", {
        id, title: `${pos} ${bb} BB all-in, BB'de ${l}`,
        game: "turnuva", street: "preflop", heroPos: "BB", stackBB: S,
        hero: cards, potBB: S + 1 + 1 + dead, seq, ante: 1,
        note: `ICM baskısı yok. ${pos}, ${bb} BB ile ellerin yaklaşık %${rangePct}'iyle all-in yapan bir oyuncu. Toplam ante 1 BB.`,
        options: ["Fold", `Call (${num(call)} BB)`], correct: ok ? 1 : 0, topic: "callshove", level: 2,
        reasoning: `Call için ${num(call)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. ${pretty(cards)}, ${pos}'un bu all-in aralığına karşı yaklaşık %${pct(eq)} equity taşır, ${ok ? "yani call kârlı." : "bu yetmez; fold."}`,
      })
    )
      n++;
  }
}

flopSpots(quota(0.35));
turnSpots(quota(0.2));
shoveSpots(quota(0.2));
openSpots(MAX - added.length);

drills.push(...added);
writeFileSync(DRILLS_URL, JSON.stringify(drills));
console.log("eklenen:", added.length, count, "toplam drills:", drills.length);
