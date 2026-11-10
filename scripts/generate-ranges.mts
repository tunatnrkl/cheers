// Range verilerini kendi hesabımızla üretir (hiçbir siteden kopyalanmaz):
// 1) 169 başlangıç elinin rastgele bir ele karşı equity'si Monte Carlo ile bulunur.
// 2) Açılış sıralaması = equity + oynanabilirlik (suited / bağlantılı) düzeltmesi.
// 3) Her pozisyon, hedef yüzdeye ulaşana kadar sıralamanın tepesinden el alır.
// Çalıştırma: npm run ranges   (çıktı: src/data/ranges.json)
import { writeFileSync } from "node:fs";
import { evaluate7 } from "../src/lib/poker/evaluator.ts";

const R = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const rankIdx = (ch: string) => 12 - R.indexOf(ch);

// Tekrarlanabilir sonuç için sabit tohumlu üreteç (mulberry32)
let seed = 20260101;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function equityVsRandom(label: string, trials: number): number {
  const a = rankIdx(label[0]) * 4;
  const b = rankIdx(label[1]) * 4 + (label.length === 2 || label[2] === "o" ? 1 : 0);
  const deck: number[] = [];
  for (let c = 0; c < 52; c++) if (c !== a && c !== b) deck.push(c);
  let score = 0;
  for (let t = 0; t < trials; t++) {
    for (let i = 0; i < 7; i++) {
      const j = i + Math.floor(rnd() * (deck.length - i));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    const board = [deck[2], deck[3], deck[4], deck[5], deck[6]];
    const h = evaluate7([a, b, ...board]);
    const v = evaluate7([deck[0], deck[1], ...board]);
    score += h > v ? 1 : h === v ? 0.5 : 0;
  }
  return score / trials;
}

const labels: string[] = [];
for (let r = 0; r < 13; r++)
  for (let c = 0; c < 13; c++)
    labels.push(r === c ? R[r] + R[c] : r < c ? `${R[r]}${R[c]}s` : `${R[c]}${R[r]}o`);

const combos = (l: string) => (l.length === 2 ? 6 : l.endsWith("s") ? 4 : 12);

const equity: Record<string, number> = {};
for (const l of labels) equity[l] = Math.round(equityVsRandom(l, 60000) * 1000) / 1000;

// Açılış için oynanabilirlik: suited eller ve birbirine yakın kartlar flop sonrası daha
// kolay oynanır; offsuit ve kopuk eller domine edilmeye yatkındır.
function openScore(l: string): number {
  let s = equity[l];
  if (l.length === 2) return s + 0.06; // set değeri: küçük çiftler de açılır
  const hi = rankIdx(l[0]);
  const lo = rankIdx(l[1]);
  const gap = hi - lo - 1;
  if (l.endsWith("s")) s += 0.045;
  else s -= 0.015;
  if (gap === 0) s += 0.035;
  else if (gap === 1) s += 0.022;
  else if (gap === 2) s += 0.01;
  else if (gap >= 4 && hi !== 12) s -= 0.03; // kopuk eller (K7s, Q6s...) zor oynanır
  if (hi === 12 && l.endsWith("s") && lo <= 3) s += 0.012; // A5s-A2s: wheel + blocker
  return s;
}

function top(score: (l: string) => number, percent: number): string[] {
  const sorted = [...labels].sort((x, y) => score(y) - score(x));
  const out: string[] = [];
  let n = 0;
  for (const l of sorted) {
    if ((n + combos(l)) / 1326 > percent / 100 + 0.004) continue;
    out.push(l);
    n += combos(l);
  }
  return out;
}

const cashTargets = { UTG: 15, HJ: 19, CO: 27, BTN: 43, SB: 38 };
const pushTargets: Record<string, Record<string, number>> = {
  "6": { UTG: 20, HJ: 25, CO: 33, BTN: 48, SB: 68 },
  "10": { UTG: 13, HJ: 17, CO: 24, BTN: 36, SB: 54 },
  "15": { UTG: 9, HJ: 12, CO: 17, BTN: 26, SB: 40 },
};

// Push/fold'da flop sonrası oyun yoktur; sıralamada ham equity ağır basar,
// suited/bağlantı düzeltmesi yarıya iner.
const pushScore = (l: string) => equity[l] + (openScore(l) - equity[l]) * 0.5;

const out = {
  meta: {
    method:
      "169 elin rastgele ele karşı Monte Carlo equity'si (60.000 deneme) + oynanabilirlik düzeltmesi; pozisyon başına hedef yüzde.",
    note: "Çalışma amaçlı yaklaşık aralıklardır; solver çıktısı değildir.",
  },
  equity,
  cash: Object.fromEntries(Object.entries(cashTargets).map(([p, pct]) => [p, top(openScore, pct)])),
  push: Object.fromEntries(
    Object.entries(pushTargets).map(([bb, t]) => [
      bb,
      Object.fromEntries(Object.entries(t).map(([p, pct]) => [p, top(pushScore, pct)])),
    ]),
  ),
};

writeFileSync(new URL("../src/data/ranges.json", import.meta.url), JSON.stringify(out));
for (const [p, hands] of Object.entries(out.cash)) console.log(p, hands.length, hands.slice(0, 40).join(" "));
