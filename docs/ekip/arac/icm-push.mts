// CS-3 devamı (11. çalışma): bubble'da SB'den all-in (push) / fold kararının ICM ile hesabı.
// Çalıştırma: node docs/ekip/arac/icm-push.mts
// Model: herkes SB'ye kadar fold etti; SB ya fold eder ya all-in yapar, BB yalnızca call/fold.
// Varsayımlar: BB'nin call aralığı senaryoda açıkça yazılan liste (solver çıktısı değil);
// ödüller ve stack'ler varsayım; ante ölü para (replay ile aynı: kimsenin stack'inden düşülmez);
// ICM = Malmuth-Harville (src/lib/poker/math.ts). Gelecek eller (FGS) hesaba katılmaz.
import { icm } from "../../../src/lib/poker/math.ts";
import { wtl } from "./icm-callfold.mts";

const R = "23456789TJQKA", S = "shdc";
/** "22+", "A2s+", "ATo+", "KTs", "T9s+" (bağlı seri değil, ikinci kart artar), "AK" (s+o) */
export function expand(spec: string): string[] {
  const out: string[] = [];
  for (const raw of spec.split(",").map((x) => x.trim()).filter(Boolean)) {
    const plus = raw.endsWith("+"); const t = plus ? raw.slice(0, -1) : raw;
    if (t.length === 2 && t[0] === t[1]) {
      const i = R.indexOf(t[0]);
      for (let k = i; k <= (plus ? 12 : i); k++) out.push(R[k] + R[k]);
      continue;
    }
    const hi = t[0], lo = t[1], kinds = t.length === 3 ? [t[2]] : ["s", "o"];
    const li = R.indexOf(lo), top = plus ? R.indexOf(hi) - 1 : li;
    for (let k = li; k <= top; k++) for (const s of kinds) out.push(hi + R[k] + s);
  }
  return [...new Set(out)];
}
function combos(l: string): string[] {
  const out: string[] = []; const [a, b] = [l[0], l[1]];
  if (l.length === 2) { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(a + S[i] + b + S[j]); }
  else if (l[2] === "s") { for (let i = 0; i < 4; i++) out.push(a + S[i] + b + S[i]); }
  else { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) out.push(a + S[i] + b + S[j]); }
  return out;
}
/** Kahramanın kartları çıkarıldıktan sonra BB'nin call etme olasılığı (kombinasyon sayımı, kesin). */
export function callFreq(hero: string, range: string[]) {
  const h = [hero.slice(0, 2), hero.slice(2)];
  const n = range.flatMap(combos).filter((c) => !h.includes(c.slice(0, 2)) && !h.includes(c.slice(2))).length;
  return n / 1225;
}
export type PushSc = { id: string; hero: string; call: string; stacks: number[]; heroI: number; bbI: number; ante: number; payouts: number[] };
// stacks: el başı stack'ler; SB 0,5, BB 1 blind koyar.
export function analysePush(s: PushSc, trials = 200000) {
  const range = expand(s.call);
  const st0 = s.stacks;
  const risk = Math.min(st0[s.heroI], st0[s.bbI]);
  const mk = (heroDelta: number, bbDelta: number) => st0.map((x, i) => (i === s.heroI ? x + heroDelta : i === s.bbI ? x + bbDelta : x));
  const ev = (st: number[]) => icm(st, s.payouts)[s.heroI];
  const F = ev(mk(-0.5, 0.5 + s.ante));
  const Steal = ev(mk(1 + s.ante, -1));
  const W = ev(mk(risk + s.ante, -risk));
  const L = ev(mk(-risk, risk + s.ante));
  const T = ev(mk(s.ante / 2, s.ante / 2));
  const pc = callFreq(s.hero, range);
  const e = wtl(s.hero, range, trials);
  const calledEV = e.win * W + e.tie * T + (1 - e.win - e.tie) * L;
  const pushEV = (1 - pc) * Steal + pc * calledEV;
  // Görüldüğünde gereken equity (beraberlik yarım sayılır, T ≈ (W+L)/2 yaklaşımı):
  const needCalled = ((F - (1 - pc) * Steal) / pc - L) / (W - L);
  // Aynı spot chip hesabıyla (ICM'siz): fold = -0,5; push görülünce çekişilen pot 2*risk + ante.
  const chipFold = -0.5, chipSteal = 1 + s.ante, chipPot = 2 * risk + s.ante;
  const chipNeed = ((chipFold - (1 - pc) * chipSteal) / pc + risk) / chipPot;
  return { id: s.id, pc, eq: e.eq, F, Steal, W, L, pushEV, needCalled, chipNeed, gap: e.eq - needCalled, combos: range.length };
}
/** BB'nin ICM eşiği (kendi bakış açısından): SB'nin all-in'ine call için gereken equity. */
export function bbThreshold(s: PushSc) {
  const risk = Math.min(s.stacks[s.heroI], s.stacks[s.bbI]);
  const mk = (heroDelta: number, bbDelta: number) => s.stacks.map((x, i) => (i === s.heroI ? x + heroDelta : i === s.bbI ? x + bbDelta : x));
  const ev = (st: number[]) => icm(st, s.payouts)[s.bbI];
  const F = ev(mk(1 + s.ante, -1)), W = ev(mk(-risk, risk + s.ante)), L = ev(mk(risk + s.ante, -risk));
  return { icm: (F - L) / (W - L), chip: (risk - 1) / (2 * risk + s.ante) };
}
const ALL: string[] = [];
for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) ALL.push(i === j ? R[i] + R[i] : i > j ? R[i] + R[j] + "s" : R[j] + R[i] + "o");
/** BB'nin, SB'nin varsayılan push aralığına karşı ICM'e göre kârlı call ettiği eller (169 el, her biri Monte Carlo). */
export function bbCallRange(s: PushSc, pushRange: string[], threshold: number, trials = 20000) {
  return ALL.filter((l) => { const c = combos(l)[0]; return wtl(c, pushRange, trials).eq > threshold; });
}
const P = [50, 30, 20];
// Koltuk sırası: [CO, BTN, SB, BB]
const b = { heroI: 2, bbI: 3, ante: 1, payouts: P };
// BB'nin call aralıkları: SB'nin referans push aralığına (ranges.json, SB 10 BB / 15 BB) karşı
// bbCallRange ile bulunan eller, Monte Carlo gürültüsü temizlenip kısaltılmış biçimde.
// "icm": BB ICM eşiğine göre call ediyor. "chip": BB ICM'i yok sayıp chip eşiğine göre call ediyor (daha geniş).
export const SCENARIOS: Record<string, { sc: PushSc; icm: string; chip: string; pushRef: string }> = {
  // 1) Kısa stack SB (8 BB), BB onu kapsıyor; masada daha kısa stack yok.
  ip01: { sc: { ...b, id: "ip01 SB 8 K6o vs BB 25", hero: "Kd6c", call: "", stacks: [40, 27, 8, 25] }, pushRef: "10",
    icm: "22+, A2+, K2s+, K6o+, Q8s+, Q9o+, J9s+, JTo, T9s",
    chip: "22+, A2+, K2+, Q3s+, Q7o+, J7s+, J9o+, T8s+, 98s" },
  // 2) SB 12 BB, BB chip lideri 50; masada çok kısa stack (CO 4 BB).
  ip02: { sc: { ...b, id: "ip02 SB 12 KJo vs BB 50, CO 4", hero: "KdJc", call: "", stacks: [4, 34, 12, 50] }, pushRef: "10",
    icm: "22+, A2+, K4s+, K6o+, Q8s+, QTo+, JTs",
    chip: "22+, A2+, K2s+, K6o+, Q7s+, Q9o+, J9s+, JTo, T9s" },
  // 3) Chip lideri SB (45), BB 20: BB'nin ICM'e göre neredeyse hiç call edemediği spot.
  ip03: { sc: { ...b, id: "ip03 SB 45 T9s vs BB 20", hero: "Th9h", call: "", stacks: [18, 17, 45, 20] }, pushRef: "15",
    icm: "JJ+",
    chip: "22+, A2+, K9s+, KTo+, QTs+" },
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const p = (x: number) => (x * 100).toFixed(1);
  for (const [k, v] of Object.entries(SCENARIOS)) {
    const th = bbThreshold(v.sc);
    console.log(`${k}: BB eşiği ICM ${p(th.icm)} chip ${p(th.chip)}`);
    for (const lab of ["icm", "chip"] as const) {
      const a = analysePush({ ...v.sc, call: v[lab] }, 400000);
      console.log(`  ${lab.padEnd(4)} aralık %${p(a.pc / (1 - 2 / 52 * 0))} call ${p(a.pc)} eq ${p(a.eq)} gerekli ${p(a.needCalled)} fark ${p(a.gap)} chipGerekli ${p(a.chipNeed)} | F ${a.F.toFixed(2)} push ${a.pushEV.toFixed(2)} steal ${a.Steal.toFixed(2)} W ${a.W.toFixed(2)} L ${a.L.toFixed(2)}`);
    }
  }
}
