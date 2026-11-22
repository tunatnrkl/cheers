// t5 (Push/fold) ünitesi için doğrulama sayıları (docs/ekip/2026-11-22/01-t5-pushfold-dogruluk-paketi.md).
// Çalıştırma: node docs/ekip/arac/pushfold-t5.mts
// Model (varsayım): SB ile BB heads-up, ikisinin de stack'i S BB (BB seni kapsıyor), BB ante 1 BB (karşılaştırma için ante 0 da), SB 0,5 + BB 1 yatırılmış.
// SB'nin push aralığı ranges.json `push[S].SB` (yaklaşık, solver değil). BB, chip EV'de en iyi cevabı verir:
// bu aralığa karşı equity'si gereken equity'yi geçen her elle call eder. ICM yok, rake yok.
// Equity: sabit tohumlu Monte Carlo (N deneme). Sonuçlar yaklaşık; ±0,5 puan örnekleme payı beklenir.
import { evaluate7 } from "../../../src/lib/poker/evaluator.ts";
import { readFileSync } from "node:fs";

const ranges = JSON.parse(readFileSync(new URL("../../../src/data/ranges.json", import.meta.url), "utf8"));
const R = "23456789TJQKA";
const SU = "shdc";
const card = (s: string) => R.indexOf(s[0]) * 4 + SU.indexOf(s[1]);
let seed = 2211;
function rnd() { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

function combosOf(label: string): [number, number][] {
  const a = R.indexOf(label[0]), b = R.indexOf(label[1]);
  const out: [number, number][] = [];
  for (let s1 = 0; s1 < 4; s1++) for (let s2 = 0; s2 < 4; s2++) {
    if (label.length === 2) { if (s1 < s2) out.push([a * 4 + s1, b * 4 + s2]); }
    else if (label[2] === "s") { if (s1 === s2) out.push([a * 4 + s1, b * 4 + s2]); }
    else if (s1 !== s2) out.push([a * 4 + s1, b * 4 + s2]);
  }
  return out;
}
const ALL: string[] = [];
for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
  if (i === j) ALL.push(R[i] + R[j]); else if (i > j) ALL.push(R[i] + R[j] + "s"); else ALL.push(R[j] + R[i] + "o");
}
const rangeCombos = (labels: string[]) => labels.flatMap(combosOf);

// hero kombinasyonu (ya da sınıfı) vs rakip kombinasyon listesi; kart çakışması çıkarılır.
function equity(heroLabelOrCards: string, villain: [number, number][], N: number): number {
  const heroPool = heroLabelOrCards.length === 4 ? [[card(heroLabelOrCards.slice(0, 2)), card(heroLabelOrCards.slice(2))] as [number, number]] : combosOf(heroLabelOrCards);
  let win = 0;
  for (let n = 0; n < N; n++) {
    const h = heroPool[Math.floor(rnd() * heroPool.length)];
    let v: [number, number];
    do { v = villain[Math.floor(rnd() * villain.length)]; } while (v[0] === h[0] || v[0] === h[1] || v[1] === h[0] || v[1] === h[1]);
    const used = new Set([h[0], h[1], v[0], v[1]]);
    const board: number[] = [];
    while (board.length < 5) { const c = Math.floor(rnd() * 52); if (!used.has(c)) { used.add(c); board.push(c); } }
    const a = evaluate7([h[0], h[1], ...board]), b = evaluate7([v[0], v[1], ...board]);
    win += a > b ? 1 : a === b ? 0.5 : 0;
  }
  return win / N;
}

const pct = (x: number) => (x * 100).toFixed(1).replace(".", ",");
const N_BR = 20000, N_HERO = 100000;

for (const ANTE of [1, 0]) for (const S of [6, 10, 15]) {
  const sbRange: string[] = ranges.push[String(S)].SB;
  const sbCombos = rangeCombos(sbRange);
  const call = S - 1;                 // BB'nin ekleyeceği
  const finalPot = 2 * S + ANTE;      // iki stack + ante
  const deadPot = 0.5 + 1 + ANTE;     // SB + BB + ante
  const reqBB = call / finalPot;
  const callRange = ALL.filter((l) => equity(l, sbCombos, N_BR) >= reqBB);
  const callCombos = rangeCombos(callRange);
  console.log(`\n=== ${S} BB, ante ${ANTE} ===`);
  console.log(`SB push aralığı: ${sbRange.length} sınıf, ${sbCombos.length} kombinasyon (%${pct(sbCombos.length / 1326)})`);
  console.log(`BB gereken equity: ${call} / ${finalPot} = %${pct(reqBB)}`);
  console.log(`BB en iyi cevap call aralığı: ${callRange.length} sınıf, ${callCombos.length} kombinasyon (%${pct(callCombos.length / 1326)})`);
  console.log(`  ${callRange.join(", ")}`);
  console.log(`SB saf blöf başabaş fold oranı: ${S - 0.5} / (${S - 0.5} + ${deadPot}) = %${pct((S - 0.5) / (S - 0.5 + deadPot))}`);
  for (const hero of ["7h2c", "Kh5c", "Ah2c", "5h5c", "Th9h", "Qh8c", "Jh4c"]) {
    const h = [card(hero.slice(0, 2)), card(hero.slice(2))];
    const free = (c: [number, number]) => !h.includes(c[0]) && !h.includes(c[1]);
    const bbAll = rangeCombos(ALL).filter(free).length;
    const bbCall = callCombos.filter(free);
    const fe = 1 - bbCall.length / bbAll;
    const eq = equity(hero, bbCall, N_HERO);
    const ev = fe * deadPot + (1 - fe) * (eq * finalPot - (S - 0.5));
    console.log(`${hero}: FE %${pct(fe)}, call edilince equity %${pct(eq)}, EV(push) − EV(fold) = ${ev.toFixed(2).replace(".", ",")} BB`);
  }
}
