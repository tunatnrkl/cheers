// 15. çalışma: 3-bet spotlarının (c07, c08, c09, c10, c12) sayısal denetimi.
// Çalıştırma: node docs/ekip/arac/3bet-denetim.mts
// Varsayımlar: açılış aralıkları src/data/ranges.json (yaklaşık, solver çıktısı değil);
// 3-bet ve flat aralıkları aşağıda açıkça yazılan EKİP TAHMİNİ (solver ile karşılaştırılmadı).
// Equity: Monte Carlo (sabit tohum), 5 kartlık board; rake yok.
import { cardFromString, evaluate7 } from "../../../src/lib/poker/evaluator.ts";
import { expand } from "./icm-push.mts";
import ranges from "../../../src/data/ranges.json" with { type: "json" };

const S = "shdc";
export function combos(l: string): string[] {
  const out: string[] = []; const [a, b] = [l[0], l[1]];
  if (l.length === 2) { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(a + S[i] + b + S[j]); }
  else if (l[2] === "s") { for (let i = 0; i < 4; i++) out.push(a + S[i] + b + S[i]); }
  else { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) out.push(a + S[i] + b + S[j]); }
  return out;
}
const cs = (s: string) => (s.match(/.{2}/g) ?? []).map(cardFromString);
let seed = 151515;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const live = (hero: number[], labels: string[]) => labels.flatMap(combos).map(cs).filter((v) => !v.some((c) => hero.includes(c)));

/** Kahramanın bir ya da iki rakip aralığına karşı equity'si (çok yollu potta pay). */
export function eq(hero: string, rs: string[][], trials = 200000) {
  const h = cs(hero); const pools = rs.map((r) => live(h, r));
  let score = 0, n = 0;
  while (n < trials) {
    const vs = pools.map((p) => p[Math.floor(rnd() * p.length)]);
    const used = new Set(h); let ok = true;
    for (const v of vs) for (const c of v) { if (used.has(c)) ok = false; used.add(c); }
    if (!ok) continue;
    const board: number[] = [];
    while (board.length < 5) { const c = Math.floor(rnd() * 52); if (!used.has(c)) { used.add(c); board.push(c); } }
    const a = evaluate7([...h, ...board]); const others = vs.map((v) => evaluate7([...v, ...board]));
    const best = Math.max(a, ...others);
    if (a === best) score += 1 / (1 + others.filter((o) => o === best).length);
    n++;
  }
  return score / trials;
}
const pct = (x: number) => (x * 100).toFixed(1) + "%";
const cash = ranges.cash as Record<string, string[]>;

export const R = {
  // c09: BTN'nin CO açılışına 3-bet aralığı (ekip tahmini): value TT+, AQ+ ; blöf A5s-A4s, KJs, QJs, JTs, 76s, 65s
  btn3vsCO: expand("TT+, AQ+, AJs, KQs, A5s, A4s, KJs, QJs, JTs, 76s, 65s"),
  // c10: BTN'nin HJ açılışına daha sıkı 3-bet aralığı: value JJ+, AQ+ ; blöf A5s-A4s, KQs, 76s
  btn3vsHJ: expand("JJ+, AQ+, A5s, A4s, KQs, 76s"),
  btn3vsHJvalue: expand("JJ+, AQ+"),
  // c12: BTN'nin CO açılışına flat aralığı (3-bet'lerini çıkarmış, QQ+/AK yok)
  btnFlatVsCO: ["22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", ...expand("ATs, AJs, KTs, QTs, J9s, T9s, 98s, 87s, AQo, AJo, KQo")],
};

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("c07 AhQh vs CO açılış", pct(eq("AhQh", [cash.CO])));
  // AQs'nin önde olduğu CO kombinasyonu payı (her kombinasyona karşı ayrı equity, daha az deneme)
  {
    const h = "AhQh"; let ahead = 0, tot = 0;
    for (const lab of cash.CO) { const e = eq(h, [[lab]], 6000); const n = live(cs(h), [lab]).length; tot += n; if (e > 0.5) ahead += n; }
    console.log("c07 AQs'nin %50'den fazla equity'yle önde olduğu CO kombinasyonu", ahead, "/", tot, pct(ahead / tot));
  }
  console.log("c08 blocker: AA", live(cs("As5s"), ["AA"]).length, "/6, AK", live(cs("As5s"), expand("AK")).length, "/16");
  console.log("c08 A5s vs BTN açılış", pct(eq("As5s", [cash.BTN])));
  console.log("c09 QQ vs BTN 3-bet (CO'ya)", pct(eq("QsQd", [R.btn3vsCO])), "kombinasyon", live(cs("QsQd"), R.btn3vsCO).length);
  console.log("c09 QQ vs KK+", pct(eq("QsQd", [["KK", "AA"]])));
  console.log("c09 QQ vs KK+, AK (4-bet'e devam)", pct(eq("QsQd", [expand("KK+, AK")])));
  console.log("c10 AJo vs BTN 3-bet (HJ'ye)", pct(eq("AdJc", [R.btn3vsHJ])), "kombinasyon", live(cs("AdJc"), R.btn3vsHJ).length);
  console.log("c10 AJo vs value kısmı JJ+, AQ+", pct(eq("AdJc", [R.btn3vsHJvalue])));
  console.log("c10 gereken (fiyat)", pct(5.5 / (12 + 5.5)));
  console.log("c12 JJ vs CO", pct(eq("JhJs", [cash.CO])));
  console.log("c12 JJ vs BTN flat", pct(eq("JhJs", [R.btnFlatVsCO])));
  console.log("c12 JJ vs CO + BTN (3 yollu pay)", pct(eq("JhJs", [cash.CO, R.btnFlatVsCO], 150000)));
}
