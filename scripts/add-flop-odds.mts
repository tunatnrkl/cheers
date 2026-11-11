// Flop all-in pot odds alıştırmaları üretir ("of-" önekli eller) ve drills.json'a ekler.
// Rakip kartlarını gösterir; equity, kalan 990 turn+river ihtimali tek tek sayılarak bulunur.
// Çalıştırma: node scripts/add-flop-odds.mts [adet]
import { readFileSync, writeFileSync } from "node:fs";
import { cardFromString, evaluate7, RANKS, SUITS } from "../src/lib/poker/evaluator.ts";
import { replay, fmt, type Seat } from "../src/lib/poker/replay.ts";

const ranges = JSON.parse(readFileSync(new URL("../src/data/ranges.json", import.meta.url), "utf8"));
const label = (a: string, b: string) => {
  const o = "AKQJT98765432";
  const [x, y] = [a, b].sort((p, q) => o.indexOf(p[0]) - o.indexOf(q[0]));
  return x[0] === y[0] ? x[0] + y[0] : x[0] + y[0] + (x[1] === y[1] ? "s" : "o");
};
// Açan oyuncu kendi pozisyonunun açılış aralığından; savunan blind daha geniş (BTN aralığı) oynar.
const inRange = (pos: Seat, cards: string[], opener: boolean) =>
  (ranges.cash[opener ? pos : pos === "SB" ? "BTN" : "BTN"] as string[]).includes(label(cards[0], cards[1]));
const FILE = new URL("../src/data/drills.json", import.meta.url);
const drills = JSON.parse(readFileSync(FILE, "utf8")) as { id: string }[];
const ids = new Set(drills.map((d) => d.id));
const WANT = Number(process.argv[2] ?? 120);

let seed = 20261111 + drills.length;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const DECK = [...RANKS].flatMap((r) => [...SUITS].map((s) => r + s));
const SUIT_TR: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const pretty = (c: string) => (c[0] === "T" ? "10" : c[0]) + SUIT_TR[c[1]];
const pct = (x: number) => "%" + Math.round(x * 100);

function equity(hero: string[], vil: string[], board: string[]) {
  const h = hero.map(cardFromString), v = vil.map(cardFromString), b = board.map(cardFromString);
  const used = new Set([...h, ...v, ...b]);
  const rest: number[] = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
  let win = 0, n = 0, outs = 0, ties = 0;
  for (let i = 0; i < rest.length; i++)
    for (let j = i + 1; j < rest.length; j++) {
      const a = evaluate7([...h, ...b, rest[i], rest[j]]);
      const z = evaluate7([...v, ...b, rest[i], rest[j]]);
      win += a > z ? 1 : a === z ? 0.5 : 0;
      if (a === z) ties++;
      n++;
    }
  outs = countOuts(h, v, b, rest);
  return { eq: win / n, outs, tie: ties / n };
}

// Kaba "out" sayısı (4 kuralı için): turn'de gelince river'ların çoğunda kahramanı kazandıran kartlar.
function countOuts(h: number[], v: number[], b: number[], rest: number[]) {
  let outs = 0;
  for (const t of rest) {
    let w = 0, n = 0;
    for (const r of rest) {
      if (r === t) continue;
      const a = evaluate7([...h, ...b, t, r]);
      const z = evaluate7([...v, ...b, t, r]);
      w += a > z ? 1 : a === z ? 0.5 : 0;
      n++;
    }
    if (w / n > 0.5) outs++;
  }
  return outs;
}

type Spot = { hero: Seat; vil: Seat; opener: Seat; stack: number; template: "lead" | "xr" };
const OPENERS: Seat[] = ["UTG", "HJ", "CO", "BTN"];
const STACKS = [15, 18, 20, 22, 25, 30, 35, 40, 50];

function seqFor(s: Spot, flop: string): string[] {
  const order: Seat[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
  const pre: string[] = [];
  pre.push(`${s.opener} r2.5`);
  const caller = s.opener === s.hero ? s.vil : s.hero;
  for (const p of order.slice(order.indexOf(s.opener) + 1)) {
    if (p === caller) { pre.push(`${p} c`); break; }
    pre.push(`${p} f`);
  }
  // Postflop'ta blind'daki oyuncu önce konuşur (OOP)
  const oop = ["SB", "BB"].includes(s.vil) ? s.vil : s.hero;
  const ip = oop === s.hero ? s.vil : s.hero;
  const post = [`F ${flop}`];
  if (s.template === "lead") {
    // Rakip OOP ise doğrudan all-in; kahraman OOP ise check, rakip all-in
    if (oop === s.vil) post.push(`${s.vil} a`);
    else post.push(`${s.hero} x`, `${s.vil} a`);
  } else {
    // c-bet sonrası check-raise all-in: kahraman açan ve IP, rakip OOP
    post.push(`${oop} x`, `${ip} b2`, `${oop} a`);
  }
  return [...pre, ...post];
}

const out: any[] = [];
let folds = 0;
const good0 = (eq: number, req: number) => eq > req;
let guard = 0;
while (out.length < WANT && guard++ < 200000) {
  const opener = pick(OPENERS);
  const defender = pick<Seat>(["BB", "BB", "SB"]);
  const heroOpens = rnd() < 0.6;
  const s: Spot = {
    opener,
    hero: heroOpens ? opener : defender,
    vil: heroOpens ? defender : opener,
    stack: pick(STACKS),
    template: heroOpens && rnd() < 0.5 ? "xr" : "lead",
  };
  const deck = [...DECK].sort(() => rnd() - 0.5);
  const hero = deck.slice(0, 2), vil = deck.slice(2, 4), board = deck.slice(4, 7);
  if (!inRange(s.hero, hero, heroOpens) || !inRange(s.vil, vil, !heroOpens)) continue;
  const flop = board.join("");
  const tourn = s.stack <= 30;
  const h: any = {
    heroPos: s.hero, stackBB: s.stack, seq: seqFor(s, flop), hero: hero.join(""), board: flop,
    ...(tourn ? { ante: 1 } : {}),
  };
  const r = replay(h);
  if (r.errors.length || r.next !== s.hero || r.street !== "flop" || r.toCall <= 0) continue;
  // Kahraman flop'ta geride olmalı ya da rakibin güçlü bir çekişi olmalı; uç eşitlikler sıkıcı
  const { eq, outs, tie } = equity(hero, vil, board);
  if (tie > 0.08) continue; // bölünen pot spotları bu alıştırmanın konusu değil
  if (eq < 0.18 || eq > 0.6) continue;
  const req = r.toCall / (r.pot + r.toCall);
  if (Math.abs(eq - req) < 0.04) continue;
  // Kahraman flop'ta geride olmalı (çekiş ya da ikinci en iyi el); out sayısı anlamlı kalsın
  if (outs < 3 || outs > 21) continue;
  if (!good0(eq, req) && folds >= out.length / 2 + 5) continue;
  const id = `of-${h.hero}-${flop}-${s.stack}`;
  if (ids.has(id)) continue;
  ids.add(id);
  const call = r.toCall, potAfter = r.pot + call;
  const good = eq > req;
  if (!good) folds++;
  const rule4 = outs > 8 ? outs * 4 - (outs - 8) : outs * 4;
  out.push({
    id,
    title: `${hero.map(pretty).join("")} ile flop all-in: ${outs} out`,
    game: tourn ? "turnuva" : "cash",
    street: "flop",
    heroPos: s.hero,
    stackBB: s.stack,
    hero: h.hero,
    board: flop,
    potBB: Math.round(r.pot * 100) / 100,
    seq: h.seq,
    ...(tourn ? { ante: 1 } : {}),
    villain: { pos: s.vil, cards: vil.join("") },
    note: `Pot odds alıştırması: ${s.vil} flop'ta all-in yaptı ve kartlarını gösterdi (${vil.map(pretty).join(" ")}). Efektif stack ${s.stack} BB${tourn ? ", turnuva, toplam ante 1 BB, ICM baskısı yok" : ", cash game"}.`,
    options: ["Fold", `Call (${fmt(call)} BB)`],
    correct: good ? 1 : 0,
    topic: "odds",
    level: Math.abs(eq - req) < 0.08 ? 3 : 2,
    reasoning:
      `Call için ${fmt(call)} BB ödeyip ${fmt(potAfter)} BB'lik pota giriyorsun; gereken equity ${pct(req)}. ` +
      `Turn'de seni öne geçiren yaklaşık ${outs} kart var; 4 kuralıyla kaba tahmin ${pct(rule4 / 100)}${outs > 8 ? " (8 out üstünde kuralı biraz aşağı düzeltiyoruz)" : ""}. ` +
      `Turn ve river'ın 990 olası ihtimali tek tek sayıldığında gerçek equity'n ${pct(eq)}. ` +
      (good ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold.") +
      " İki kart daha açılacak ama all-in olduğu için ödeyeceğin başka bahis yok; tek karar bu fiyat.",
  });
}
writeFileSync(FILE, JSON.stringify([...drills, ...out], null, 2) + "\n");
console.log(`${out.length} el eklendi; toplam ${drills.length + out.length}`);
