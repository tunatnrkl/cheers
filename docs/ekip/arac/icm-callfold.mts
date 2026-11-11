// CS-3: bubble'da all-in'e karşı call/fold kararının ICM ile hesabı (docs/ekip/2026-11-11/14).
// Çalıştırma: node docs/ekip/arac/icm-callfold.mts
// Varsayımlar: rakip aralığı ranges.json'daki referans push aralığı (solver çıktısı değil);
// ödüller ve stack'ler senaryoda verilen varsayım; ICM = Malmuth-Harville (src/lib/poker/math.ts).
import { evaluate7 } from "../../../src/lib/poker/evaluator.ts";
import { icm } from "../../../src/lib/poker/math.ts";
import { readFileSync } from "node:fs";
const ranges = JSON.parse(readFileSync(new URL("../../../src/data/ranges.json", import.meta.url), "utf8"));
const R = "23456789TJQKA", S = "shdc";
const card = (c: string) => R.indexOf(c[0]) * 4 + S.indexOf(c[1]);
function combos(l: string): string[] {
  const out: string[] = []; const [a, b] = [l[0], l[1]];
  if (l.length === 2) { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(a + S[i] + b + S[j]); }
  else if (l[2] === "s") { for (let i = 0; i < 4; i++) out.push(a + S[i] + b + S[i]); }
  else { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) out.push(a + S[i] + b + S[j]); }
  return out;
}
let seed = 2026;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function wtl(hero: string, range: string[], trials = 200000) {
  const h = [card(hero.slice(0, 2)), card(hero.slice(2))];
  const vs = range.flatMap(combos).map((v) => [card(v.slice(0, 2)), card(v.slice(2))]).filter((v) => !h.includes(v[0]) && !h.includes(v[1]));
  let w = 0, t = 0;
  for (let k = 0; k < trials; k++) {
    const v = vs[Math.floor(rnd() * vs.length)];
    const used = new Set([...h, ...v]); const b: number[] = [];
    while (b.length < 5) { const c = Math.floor(rnd() * 52); if (!used.has(c)) { used.add(c); b.push(c); } }
    const x = evaluate7([...h, ...b]), y = evaluate7([...v, ...b]);
    if (x > y) w++; else if (x === y) t++;
  }
  return { win: w / trials, tie: t / trials, eq: (w + t / 2) / trials, combos: vs.length };
}
type Sc = { id: string; hero: string; range: string[]; names: string[]; start: number[]; heroI: number; vilI: number; blinds: Record<number, number>; ante: number; payouts: number[] };
// start: el başı stack'ler (blind'lar ve ante ödenmeden önce değil; ante pota ölü para olarak eklenir, ayrıca düşülmez — replay ile aynı).
export function analyse(s: Sc) {
  const bet = (i: number) => s.blinds[i] ?? 0;
  const risk = Math.min(s.start[s.heroI], s.start[s.vilI]);
  const deadOthers = s.start.reduce((a, _, i) => a + (i !== s.heroI && i !== s.vilI ? bet(i) : 0), 0);
  const after = (res: "win" | "lose" | "tie" | "fold") => {
    const st = s.start.map((x, i) => x - bet(i));
    st[s.heroI] = s.start[s.heroI] - bet(s.heroI);
    st[s.vilI] = s.start[s.vilI] - bet(s.vilI);
    const pot = deadOthers + s.ante;
    if (res === "fold") { st[s.vilI] += bet(s.vilI) + bet(s.heroI) + pot; st[s.heroI] += 0; return st; }
    st[s.heroI] = s.start[s.heroI] - risk; st[s.vilI] = s.start[s.vilI] - risk;
    if (res === "win") st[s.heroI] += 2 * risk + pot;
    else if (res === "lose") st[s.vilI] += 2 * risk + pot;
    else { st[s.heroI] += risk + pot / 2; st[s.vilI] += risk + pot / 2; }
    return st;
  };
  const ev = (st: number[]) => icm(st, s.payouts)[s.heroI];
  const F = ev(after("fold")), W = ev(after("win")), L = ev(after("lose")), T = ev(after("tie"));
  const toCall = risk - bet(s.heroI);
  const contested = 2 * risk + deadOthers + s.ante;
  const chipReq = toCall / contested;
  const icmReq = (F - L) / (W - L);
  const e = wtl(s.hero, s.range);
  const callEV = e.win * W + e.tie * T + (1 - e.win - e.tie) * L;
  return { id: s.id, toCall, contested, chipReq, icmReq, eq: e.eq, win: e.win, tie: e.tie, F, W, L, callEV, combos: e.combos, after: { fold: after("fold"), win: after("win"), lose: after("lose") } };
}
const push = ranges.push;
// Koltuk sırası: [CO, BTN, SB, BB]; blind'lar SB 0,5, BB 1; ante 1 (ölü para).
const P = [50, 30, 20];
const base = { names: ["CO", "BTN", "SB", "BB"], heroI: 3, vilI: 1, blinds: { 2: 0.5, 3: 1 }, ante: 1, payouts: P };
const list: Sc[] = [
  { ...base, id: "A3o 10/10, CO 30 SB 30", hero: "As3h", range: push["10"].BTN, start: [30, 10, 30, 10] },
  { ...base, id: "A3o 10/10, CO 45 SB 15", hero: "As3h", range: push["10"].BTN, start: [45, 10, 15, 10] },
  { ...base, id: "A3o hero 12, BTN 10, CO 40 SB 18", hero: "As3h", range: push["10"].BTN, start: [40, 10, 18, 12] },
  { ...base, id: "A3o hero 25 BTN 10 CO 25 SB 20", hero: "As3h", range: push["10"].BTN, start: [25, 10, 20, 25] },
  { ...base, id: "A3o hero 40 BTN 10 CO 15 SB 15", hero: "As3h", range: push["10"].BTN, start: [15, 10, 15, 40] },
  { ...base, id: "KQo 15/15 CO 30 SB 20", hero: "KsQd", range: push["15"].BTN, start: [30, 15, 20, 15] },
  { ...base, id: "KQo hero 15 BTN 15 CO 40 SB 10", hero: "KsQd", range: push["15"].BTN, start: [40, 15, 10, 15] },
  { ...base, id: "KQo hero 20 BTN 15 CO 30 SB 15", hero: "KsQd", range: push["15"].BTN, start: [30, 15, 15, 20] },
  { ...base, id: "A7s hero 40 BTN 10 CO 15 SB 15", hero: "Ah7h", range: push["10"].BTN, start: [15, 10, 15, 40] },
  { ...base, id: "A7s hero 35 BTN 15 CO 15 SB 15", hero: "Ah7h", range: push["15"].BTN, start: [15, 15, 15, 35] },
  { ...base, id: "KQo hero 40 BTN 15 CO 12 SB 13", hero: "KsQd", range: push["15"].BTN, start: [12, 15, 13, 40] },
];
if (import.meta.url === `file://${process.argv[1]}`) {
  const p = (x: number) => (x * 100).toFixed(1);
  for (const s of list) {
    const a = analyse(s);
    console.log(`${a.id.padEnd(36)} call ${a.toCall} pot ${a.contested} chipReq ${p(a.chipReq)} icmReq ${p(a.icmReq)} eq ${p(a.eq)} (w ${p(a.win)} t ${p(a.tie)}) | F ${a.F.toFixed(2)} callEV ${a.callEV.toFixed(2)} W ${a.W.toFixed(2)} L ${a.L.toFixed(2)}`);
  }
}
