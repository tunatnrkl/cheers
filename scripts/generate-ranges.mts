// Range verilerini kendi hesabımızla üretir (hiçbir siteden kopyalanmaz):
// 1) 169 başlangıç elinin rastgele bir ele karşı equity'si Monte Carlo ile bulunur.
// 2) Açılış sıralaması = equity + oynanabilirlik (suited / bağlantılı) düzeltmesi.
// 3) Her pozisyon, hedef yüzdeye ulaşana kadar sıralamanın tepesinden el alır.
// Çalıştırma: npm run ranges   (çıktı: src/data/ranges.json)
import { writeFileSync } from "node:fs";
import { evaluate7 } from "../src/lib/poker/evaluator.ts";
import { pctWithSuffix as numSuffix } from "../src/lib/trSuffix.ts";

const R = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const rankIdx = (ch: string) => 12 - R.indexOf(ch);

// Tekrarlanabilir sonuç için sabit tohumlu üreteç (mulberry32)
function mulberry32(start: number) {
  let seed = start;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260101);
// Doğrulama ölçümleri ayrı bir üreteçle yapılır; böylece spot seçimi (ana üreteç) değişmez.
const rndCheck = mulberry32(777);

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

// ═════════════════ Alıştırma elleri (drills.json) ═════════════════
// Üç tür senaryo üretilir. Doğruluğu korumak için aralık sınırına yakın, cevabı
// tartışmalı olabilecek eller bilerek dışarıda bırakılır (güvenlik payı).

const SUITS = "shdc";
const SUIT_TR: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const LOC: Record<string, string> = { UTG: "UTG'de", HJ: "HJ'de", CO: "CO'da", BTN: "BTN'de", SB: "SB'de", BB: "BB'de" };
const ABL: Record<string, string> = { UTG: "UTG'den", HJ: "HJ'den", CO: "CO'dan", BTN: "BTN'den", SB: "SB'den", BB: "BB'den" };
// İlgi hâli, kısaltmanın harf harf okunuşuna göre: "es-be'nin", "si-o'nun", "bi-ti-en'in".
const GEN: Record<string, string> = { UTG: "UTG'nin", HJ: "HJ'nin", CO: "CO'nun", BTN: "BTN'nin", SB: "SB'nin", BB: "BB'nin" };
const BEHIND: Record<string, number> = { UTG: 5, HJ: 4, CO: 3, BTN: 2, SB: 1 };

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
const toCard = (c: string) => rankIdx(c[0]) * 4 + SUITS.indexOf(c[1]);
const pretty = (cards: string) => (cards.match(/.{2}/g) ?? []).map((c) => (c[0] === "T" ? "10" : c[0]) + SUIT_TR[c[1]]).join(" ");
const pct = (x: number) => Math.round(x * 100);
const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

/** Sıralamaya göre her elin kümülatif yüzdesi: [başladığı yüzde, bittiği yüzde]. */
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

function pick<T>(list: T[], k: number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

type Drill = Record<string, unknown>;
const drills: Drill[] = [];

// ── 1) Cash: herkes sana kadar fold etti, aç ya da fold ─────────────────
const openPct = percentiles(openScore);
const rfiFoldFrom: Record<string, number> = { UTG: 25, HJ: 32, CO: 42, BTN: 58, SB: 62 };
// Bu eller pozisyona ve rakiplere göre sıkça açılır (karışık strateji); fold cevabı olarak kullanılmaz.
function mixedOpen(l: string, pos: string): boolean {
  if (l.length === 2 || l[2] !== "s") return false;
  if (pos === "SB") return true;
  const gap = rankIdx(l[0]) - rankIdx(l[1]) - 1;
  if (gap <= 1) return true; // suited connector / one-gapper
  if (l[0] === "A") return true;
  return l[0] === "K" && pos !== "UTG" && pos !== "HJ";
}
for (const [pos, target] of Object.entries(cashTargets)) {
  const range = new Set(out.cash[pos as keyof typeof out.cash]);
  const raise = labels.filter((l) => range.has(l) && openPct.get(l)![1] <= target - 4);
  const fold = labels.filter((l) => !range.has(l) && !mixedOpen(l, pos) && openPct.get(l)![0] >= rfiFoldFrom[pos] && openPct.get(l)![0] <= rfiFoldFrom[pos] + 30);
  const raiseOpt = pos === "SB" ? "3 BB aç" : "2,5 BB aç";
  const options = pos === "SB" ? ["Fold", raiseOpt] : ["Fold", "Limp (1 BB)", raiseOpt];
  for (const [l, ok] of [...pick(raise, 12).map((l) => [l, true] as const), ...pick(fold, 11).map((l) => [l, false] as const)]) {
    const p = Math.max(1, pct(openPct.get(l)![1] / 100));
    drills.push({
      id: `r-${pos}-${l}`,
      title: `${LOC[pos]} ${l}`,
      game: "cash", street: "preflop", heroPos: pos, stackBB: 100,
      hero: concrete(l), potBB: 1.5, seq: [],
      note: "6-max cash game, 100 BB. Herkes sana kadar fold etti.",
      options, correct: ok ? options.length - 1 : 0, topic: "acilis", level: 1,
      reasoning: ok
        ? `${l} ${ABL[pos]} açılacak kadar güçlü: ellerin en iyi ~${numSuffix(p, "inde")}, ${pos} ise yaklaşık en iyi %${target} ile açar. Önünde herkes fold etti; raise ile ya blind'ları hemen alırsın ya da inisiyatifle oynarsın. Limp ise inisiyatifi verir.`
        : `${l}, ${pos} için fazla zayıf: ellerin en iyi ~${numSuffix(p, "inde")}, ${pos} ise yaklaşık en iyi %${target} ile açar. Arkanda ${BEHIND[pos]} oyuncu varken bu el görüldüğünde çoğu zaman geride kalır; limp de kârlı değildir.`,
    });
  }
}

// ── 2) Turnuva: herkes fold etti, all-in ya da fold ───────────────────
// Push aralıkları bilerek temkinli tutuldu; fold cevabı yalnızca açıkça zayıf ellerde verilir.
const pushPct = percentiles(pushScore);
const pushFoldFrom: Record<string, Record<string, number>> = {
  "6": { UTG: 45, HJ: 55, CO: 65, BTN: 80, SB: 101 },
  "10": { UTG: 33, HJ: 42, CO: 52, BTN: 70, SB: 101 },
  "15": { UTG: 26, HJ: 32, CO: 40, BTN: 58, SB: 80 },
};
for (const [bb, targets] of Object.entries(pushTargets)) {
  for (const [pos, target] of Object.entries(targets)) {
    const range = new Set(out.push[bb as "6"][pos as "UTG"]);
    const push = labels.filter((l) => range.has(l) && pushPct.get(l)![1] <= target - 3);
    const fold = labels.filter((l) => !range.has(l) && pushPct.get(l)![0] >= pushFoldFrom[bb][pos]);
    const options = ["Fold", `All-in (${bb} BB)`];
    for (const [l, ok] of [...pick(push, 8).map((l) => [l, true] as const), ...pick(fold, 7).map((l) => [l, false] as const)]) {
      const p = Math.max(1, pct(pushPct.get(l)![1] / 100));
      drills.push({
        id: `p${bb}-${pos}-${l}`,
        title: `${bb} BB ile ${LOC[pos]} ${l}`,
        game: "turnuva", street: "preflop", heroPos: pos, stackBB: Number(bb),
        hero: concrete(l), potBB: 2.5, seq: [], ante: 1,
        note: `Turnuvanın orta aşaması, ICM baskısı yok. Herkesin ${bb} BB'si var; toplam ante 1 BB. Herkes sana kadar fold etti.`,
        options, correct: ok ? 1 : 0, topic: "pushfold", level: 1,
        reasoning: ok
          ? `${bb} BB ile ${ABL[pos]} ${l} rahat bir all-in: ellerin en iyi ~${numSuffix(p, "inde")}, bu spotta en az en iyi %${target} itilir. Herkes fold ederse 2,5 BB'lik pot senin; görülürsen de yeterli equity taşırsın. Bu stack'te açıp fold etmek pahalıdır.`
          : `${l}, ${bb} BB ile ${ABL[pos]} itmek için fazla zayıf: ellerin ancak en iyi ~${numSuffix(p, "inde")}. Arkanda ${BEHIND[pos]} oyuncu varken görülme ihtimali yüksek ve görüldüğünde çoğunlukla geride kalırsın. Daha iyi bir spot beklemek daha az chip kaybettirir.`,
      });
    }
  }
}

// ── 3) Turnuva: BB'desin, rakibin all-in'ine call ya da fold ─────────
// Doğru cevap matematikle belirlenir: elin, rakibin all-in aralığına karşı equity'si
// call için gereken equity'den yüksek mi? (chip EV, ICM yok)
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

function equityVsRange(hero: [number, number], range: [number, number][], trials: number, rng = rnd): number {
  const live = range.filter(([x, y]) => x !== hero[0] && x !== hero[1] && y !== hero[0] && y !== hero[1]);
  let score = 0;
  const deck: number[] = [];
  for (let t = 0; t < trials; t++) {
    const [v1, v2] = live[Math.floor(rng() * live.length)];
    deck.length = 0;
    for (let c = 0; c < 52; c++) if (c !== hero[0] && c !== hero[1] && c !== v1 && c !== v2) deck.push(c);
    for (let i = 0; i < 5; i++) {
      const j = i + Math.floor(rng() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const board = deck.slice(0, 5);
    const h = evaluate7([hero[0], hero[1], ...board]);
    const v = evaluate7([v1, v2, ...board]);
    score += h > v ? 1 : h === v ? 0.5 : 0;
  }
  return score / trials;
}

const dropped: string[] = [];
const sensitive: string[] = [];
const SHOVES: [string, "6" | "10" | "15"][] = [["SB", "6"], ["SB", "10"], ["SB", "15"], ["BTN", "10"], ["BTN", "15"], ["CO", "10"], ["CO", "15"]];
for (const [pos, bb] of SHOVES) {
  const S = Number(bb);
  const rangeList = out.push[bb][pos as "SB"];
  const combosList = rangeCombos(rangeList);
  const rangePct = pct(combosList.length / 1326);
  const dead = pos === "SB" ? 0 : 0.5;
  const finalPot = 2 * S + 1 + dead;
  const call = S - 1;
  const req = call / finalPot;
  const callers: Drill[] = [];
  const folders: Drill[] = [];
  for (const l of pick(labels, 169)) {
    if (callers.length >= 9 && folders.length >= 9) break;
    const cards = concrete(l);
    const eq = equityVsRange([toCard(cards.slice(0, 2)), toCard(cards.slice(2))], combosList, 6000);
    if (Math.abs(eq - req) < 0.035) continue; // sınırda: cevabı tartışmalı, alınmaz
    const ok = eq > req;
    const bucket = ok ? callers : folders;
    if (bucket.length >= 9) continue;
    const seq = pos === "SB" ? ["SB a"] : [`${pos} a`, ...(pos === "CO" ? ["BTN f"] : []), "SB f"];
    bucket.push({
      id: `s${bb}-${pos}-${l}`,
      title: `${pos} ${bb} BB all-in, BB'de ${l}`,
      game: "turnuva", street: "preflop", heroPos: "BB", stackBB: S,
      hero: cards, potBB: S + 1 + 1 + dead, seq, ante: 1,
      note: `ICM baskısı yok. ${pos}, ${bb} BB ile ellerin yaklaşık ${numSuffix(rangePct, "iyle")} all-in yapan bir oyuncu. Toplam ante 1 BB.`,
      options: ["Fold", `Call (${num(call)} BB)`], correct: ok ? 1 : 0, topic: "callshove", level: 2,
      reasoning: "",
    });
  }
  // Doğrulama (ayrı üreteç, 20.000 deneme, standart hata ≈ ±0,35 puan):
  // 1) Eşiğe 3,5 puandan yakın çıkan spot alınmaz (6.000 denemelik seçimin örnekleme hatası).
  // 2) Rakip daha sıkı (%60) ya da daha geniş (%150) oynadığında cevap değişiyorsa gerekçe bunu söyler.
  const pushPctOf = pushTargets[bb][pos];
  const narrowPct = Math.round(pushPctOf * 0.6);
  const widePct = Math.min(100, Math.round(pushPctOf * 1.5));
  const narrow = rangeCombos(top(pushScore, narrowPct));
  const wide = rangeCombos(top(pushScore, widePct));
  for (const d of [...callers, ...folders]) {
    const cards = d.hero as string;
    const h: [number, number] = [toCard(cards.slice(0, 2)), toCard(cards.slice(2))];
    const eq = equityVsRange(h, combosList, 20000, rndCheck);
    const ok = d.correct === 1;
    if (Math.abs(eq - req) < 0.035 || eq > req !== ok) {
      dropped.push(`${d.id} (${pct(req)} / ${(eq * 100).toFixed(1)})`);
      continue;
    }
    const eqN = equityVsRange(h, narrow, 20000, rndCheck);
    const eqW = equityVsRange(h, wide, 20000, rndCheck);
    const flips: string[] = [];
    // Senaryodaki fark 1 puandan küçükse "şu doğru olurdu" demek Monte Carlo hatası içinde kalır.
    const outcome = (e: number) =>
      Math.abs(e - req) < 0.01
        ? `equity'n gereken düzeye (yaklaşık %${pct(req)}) yaklaşırdı ve call ile fold neredeyse eşit olurdu`
        : `equity'n yaklaşık %${pct(e)} olurdu ve ${ok ? "fold" : "call"} doğru olurdu`;
    if (eqN > req !== ok) flips.push(`daha sıkı oynasaydı (ellerin yaklaşık ${numSuffix(narrowPct, "i")}) ${outcome(eqN)}`);
    if (eqW > req !== ok)
      flips.push(`${widePct === 100 ? "her eliyle all-in yapsaydı" : `daha geniş oynasaydı (ellerin yaklaşık ${numSuffix(widePct, "i")})`} ${outcome(eqW)}`);
    const sensitivity = flips.length ? ` Bu kararı rakibin aralığı belirliyor: rakip ${flips.join("; ")}.` : "";
    if (flips.length) sensitive.push(d.id as string);
    d.reasoning = `Call için ${num(call)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. ${pretty(cards)}, ${GEN[pos]} bu all-in aralığına karşı yaklaşık %${pct(eq)} equity taşır, ${ok ? "yani call kârlı." : "bu yetmez; fold."}${sensitivity}`;
    drills.push(d);
  }
}

// ── 4) Cash: turn'de all-in, rakibin kartları açık (pot odds) ─────────
// Equity tahmin edilmez: kalan 44 river kartı tek tek sayılır. Sınırda olanlar alınmaz.
const cardStr = (c: number) => R[12 - (c >> 2)] + SUITS[c & 3];
const potOdds: Drill[] = [];
const counts = { call: 0, fold: 0 };
for (let guard = 0; guard < 200000 && potOdds.length < 70; guard++) {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < 8; i++) {
    const j = i + Math.floor(rnd() * (52 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const hero = deck.slice(0, 2);
  const vil = deck.slice(2, 4);
  const board = deck.slice(4, 8);
  // Rakip şu an önde olmalı ve kahramanın gerçek bir çekişi olmalı
  if (evaluate7([...vil, ...board]) <= evaluate7([...hero, ...board])) continue;
  let wins = 0;
  const used = new Set(deck.slice(0, 8));
  for (let c = 0; c < 52; c++) {
    if (used.has(c)) continue;
    const h = evaluate7([...hero, ...board, c]);
    const v = evaluate7([...vil, ...board, c]);
    wins += h > v ? 1 : h === v ? 0.5 : 0;
  }
  const eq = wins / 44;
  if (eq < 0.06 || eq > 0.5 || !Number.isInteger(wins)) continue;

  const S = [15, 20, 25, 30, 40, 60][Math.floor(rnd() * 6)];
  const heroBB = rnd() < 0.5;
  const flopBet = 2.75;
  const potTurn = 5.5 + 2 * flopBet;
  const shove = S - 2.5 - flopBet;
  const finalPot = potTurn + 2 * shove;
  const req = shove / finalPot;
  if (Math.abs(eq - req) < 0.04) continue;
  const ok = eq > req;
  if (counts[ok ? "call" : "fold"] >= 35) continue;
  counts[ok ? "call" : "fold"]++;

  const heroPos = heroBB ? "BB" : "BTN";
  const vilPos = heroBB ? "BTN" : "BB";
  const flop = board.slice(0, 3).map(cardStr).join("");
  const turn = cardStr(board[3]);
  const seq = heroBB
    ? ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB x", "BTN a"]
    : ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB a"];
  const heroCards = hero.map(cardStr).join("");
  const vilCards = vil.map(cardStr).join("");
  potOdds.push({
    id: `o-${heroCards}-${flop}${turn}`,
    title: `Turn all-in: ${wins} out ile call?`,
    game: "cash", street: "turn", heroPos, stackBB: S,
    hero: heroCards, board: flop + turn, potBB: Math.round((potTurn + shove) * 100) / 100, seq,
    villain: { pos: vilPos, cards: vilCards },
    note: `Pot odds alıştırması: ${vilPos} turn'de all-in yaptı ve kartlarını gösterdi (${pretty(vilCards)}). Efektif stack ${S} BB.`,
    options: ["Fold", `Call (${num(shove)} BB)`], correct: ok ? 1 : 0, topic: "odds", level: 2,
    reasoning: `Call için ${num(shove)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. Rakibin elini yenen ${wins} river kartı var: ${wins}/44 ≈ %${pct(eq)}. ${ok ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold."} All-in olduğu için sonradan kazanılacak ek chip yok; yalnızca bu hesap önemli.`,
  });
}
drills.push(...potOdds);

// ── 5) Cash: river'da value bet ya da check (13. çalışma) ─────────────
// BTN açtı, BB call etti; flop ve turn check-check, river'da BB check. BTN'desin.
// Seçenekler: check ya da pot'un üçte biri (1,8 BB). Karar kesin kombinasyon sayımıyla:
// BB'nin her kombinasyonu için bahsin check'e göre farkı toplanır (call: B(2s−1), fold: P(1−s);
// s = kahramanın o ele karşı showdown sonucu 1 / 0,5 / 0). Check-raise modellenmez.
// İki call senaryosu ölçülür: geniş (her çift ve üstü call) ve sıkı (yalnızca üst çift, overpair
// ve üstü). İki senaryoda cevap aynı değilse ya da fark küçükse spot alınmaz.
const VALUE_EXCLUDE = ["AA", "KK", "QQ", "AKs", "AKo"]; // BB bunlarla preflop 3-bet ederdi (varsayım)
const VALUE_POT = 5.5;
const VALUE_BET = 1.8;
const VALUE_MARGIN = 0.07; // kombinasyon başına en az 0,07 × bahis fark
const rndValue = mulberry32(20261113);
const category = (v: number) => Math.floor(v / 16 ** 5);
const bbRange = (out.cash.BTN as string[]).filter((l) => !VALUE_EXCLUDE.includes(l));
const bbCombos = rangeCombos(bbRange);
function valueDelta(hero: number[], board: number[], strict: boolean) {
  const used = new Set([...hero, ...board]);
  const boardTop = Math.max(...board.map((c) => c >> 2));
  const h = evaluate7([...hero, ...board]);
  let delta = 0;
  let n = 0;
  let callers = 0;
  let callScore = 0;
  for (const [a, b] of bbCombos) {
    if (used.has(a) || used.has(b)) continue;
    n++;
    const v = evaluate7([a, b, ...board]);
    const s = h > v ? 1 : h === v ? 0.5 : 0;
    const cat = category(v);
    const pairRank = Math.floor(v / 16 ** 4) % 16;
    const calls = strict ? cat >= 2 || (cat === 1 && pairRank >= boardTop) : cat >= 1;
    if (calls) {
      callers++;
      callScore += s;
      delta += VALUE_BET * (2 * s - 1);
    } else delta += VALUE_POT * (1 - s);
  }
  return { perCombo: delta / n / VALUE_BET, n, callers, eqCalled: callers ? callScore / callers : 0 };
}
const valueDrills: Drill[] = [];
const valueCounts = { bet: 0, check: 0 };
const btnCombos = rangeCombos(out.cash.BTN as string[]);
for (let guard = 0; guard < 400000 && valueDrills.length < 60; guard++) {
  const [h1, h2] = btnCombos[Math.floor(rndValue() * btnCombos.length)];
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((c) => c !== h1 && c !== h2);
  for (let i = 0; i < 5; i++) {
    const j = i + Math.floor(rndValue() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const board = deck.slice(0, 5);
  const hero = [h1, h2];
  // Board tek başına çiftsiz/elsiz olmalı ve kahramanın elinde en az bir çift (kendi kartıyla) olmalı
  if (category(evaluate7(board)) !== 0) continue;
  const heroCat = category(evaluate7([...hero, ...board]));
  if (heroCat < 1) continue;
  const id = `v-${hero.map(cardStr).join("")}-${board.map(cardStr).join("")}`;
  if (valueDrills.some((d) => d.id === id)) continue;
  const loose = valueDelta(hero, board, false);
  const strict = valueDelta(hero, board, true);
  if (Math.sign(loose.perCombo) !== Math.sign(strict.perCombo)) continue;
  if (Math.min(Math.abs(loose.perCombo), Math.abs(strict.perCombo)) < VALUE_MARGIN) continue;
  if (strict.callers < 20) continue; // sıkı senaryoda da call eden anlamlı bir aralık olmalı
  const bet = loose.perCombo > 0;
  if (valueCounts[bet ? "bet" : "check"] >= 30) continue;
  valueCounts[bet ? "bet" : "check"]++;

  const heroCards = hero.map(cardStr).join("");
  const flop = board.slice(0, 3).map(cardStr).join("");
  const [turn, river] = [cardStr(board[3]), cardStr(board[4])];
  const eL = pct(loose.eqCalled);
  const eS = pct(strict.eqCalled);
  valueDrills.push({
    id,
    title: `River'da ${pretty(heroCards)}: value bet mi?`,
    game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: heroCards, board: flop + turn + river, potBB: VALUE_POT,
    seq: ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", "BTN x", `T ${turn}`, "BB x", "BTN x", `R ${river}`, "BB x"],
    note: `Varsayım: BB'nin aralığı sitedeki buton açılış aralığı, AA, KK, QQ ve AK hariç (bunlarla 3-bet ederdi), önceki check'lerle daralmamış; 1,8 BB'lik bahse çift ve üstüyle call eder, çiftsiz ellerle fold eder, check-raise yapmaz.`,
    options: ["Check", "Bahis 1,8 BB (pot'un üçte biri)"], correct: bet ? 1 : 0, topic: "value", level: 2,
    reasoning: bet
      ? `Value bet'in sorusu: call eden eller içinde senden kötü olanlar çoğunlukta mı? BB'nin bu bahse call edeceği ${loose.callers} kombinasyona karşı showdown payın %${eL} (beraberlik yarım sayıldı); fold eden çiftsiz eller zaten sana kaybediyordu. Call edenlerin yarısından fazlasını yendiğin için bahis, check'e göre kâr ekler. BB yalnızca üst çift, overpair ve üstüyle call etse bile bu oran %${eS} ve bahis yine önde kalır.`
      : `Value bet'in sorusu: call eden eller içinde senden kötü olanlar çoğunlukta mı? Burada değil: BB'nin bu bahse call edeceği ${loose.callers} kombinasyona karşı showdown payın yalnızca %${eL} (beraberlik yarım sayıldı). Call edenlerin çoğu senden iyi; bahis check'e göre kayıp ekler. Elin showdown'da kazanabilir, check bunu bedavaya görür. BB yalnızca üst çift, overpair ve üstüyle call etse oran %${eS}; sonuç değişmiyor.`,
  });
}
drills.push(...valueDrills);
console.log("value:", valueDrills.length, valueCounts);

// ── 6) Cash: river'da blöf ya da check (16. çalışma) ─────────────────
// 5. bölümle aynı senaryo, ama kahramanın elinde çift yok (yalnızca yüksek kart). Seçenekler:
// check ya da 1,8 BB. Karar yine BB'nin her kombinasyonu sayılarak: bahsin check'e göre farkı
// call eden elde B(2s − 1), fold eden elde P(1 − s). Blöfün kazancı, showdown'da seni yenecek
// ama bahse fold eden ellerden gelir; kaybı, call eden ellerden.
// Üç call senaryosu ölçülür ve cevap üçünde de aynı olmalı: temel (her çift ve üstü call),
// sıkı (yalnızca üst çift, overpair ve üstü) ve geniş (çift ve üstüne ek olarak elinde as olan
// her el call). Blöf cevabı geniş senaryoya, check cevabı sıkı senaryoya dayanıklı olur.
type BluffMode = "base" | "strict" | "wide";
const rndBluff = mulberry32(20261116);
function bluffDelta(hero: number[], board: number[], mode: BluffMode) {
  const used = new Set([...hero, ...board]);
  const boardTop = Math.max(...board.map((c) => c >> 2));
  const h = evaluate7([...hero, ...board]);
  let delta = 0;
  let n = 0;
  let callers = 0;
  let foldBeatsYou = 0; // fold eden ama showdown'da seni yenecek eller (beraberlik yarım)
  for (const [a, b] of bbCombos) {
    if (used.has(a) || used.has(b)) continue;
    n++;
    const v = evaluate7([a, b, ...board]);
    const s = h > v ? 1 : h === v ? 0.5 : 0;
    const cat = category(v);
    const pairRank = Math.floor(v / 16 ** 4) % 16;
    const calls =
      mode === "strict" ? cat >= 2 || (cat === 1 && pairRank >= boardTop)
      : mode === "wide" ? cat >= 1 || a >> 2 === 12 || b >> 2 === 12
      : cat >= 1;
    if (calls) {
      callers++;
      delta += VALUE_BET * (2 * s - 1);
    } else {
      foldBeatsYou += 1 - s;
      delta += VALUE_POT * (1 - s);
    }
  }
  return { perCombo: delta / n / VALUE_BET, n, callers, foldBeatsYou };
}
const bluffDrills: Drill[] = [];
const bluffCounts = { bet: 0, check: 0 };
for (let guard = 0; guard < 400000 && bluffDrills.length < 60; guard++) {
  const [h1, h2] = btnCombos[Math.floor(rndBluff() * btnCombos.length)];
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((c) => c !== h1 && c !== h2);
  for (let i = 0; i < 5; i++) {
    const j = i + Math.floor(rndBluff() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const board = deck.slice(0, 5);
  const hero = [h1, h2];
  // Board tek başına elsiz; kahramanın da çifti, kenti, floşu yok (yalnızca yüksek kart)
  if (category(evaluate7(board)) !== 0) continue;
  if (category(evaluate7([...hero, ...board])) !== 0) continue;
  const id = `bl-${hero.map(cardStr).join("")}-${board.map(cardStr).join("")}`;
  if (bluffDrills.some((d) => d.id === id)) continue;
  const base = bluffDelta(hero, board, "base");
  const strict = bluffDelta(hero, board, "strict");
  const wide = bluffDelta(hero, board, "wide");
  const signs = [base, strict, wide].map((x) => Math.sign(x.perCombo));
  if (signs.some((x) => x !== signs[0])) continue;
  if (Math.min(...[base, strict, wide].map((x) => Math.abs(x.perCombo))) < VALUE_MARGIN) continue;
  const bet = base.perCombo > 0;
  if (bluffCounts[bet ? "bet" : "check"] >= 30) continue;
  bluffCounts[bet ? "bet" : "check"]++;

  const heroCards = hero.map(cardStr).join("");
  const flop = board.slice(0, 3).map(cardStr).join("");
  const [turn, river] = [cardStr(board[3]), cardStr(board[4])];
  const folders = base.n - base.callers;
  const callPct = pct(base.callers / base.n);
  const foldPct = pct(folders / base.n);
  const winPct = pct(base.foldBeatsYou / base.n);
  const sdPct = pct((folders - base.foldBeatsYou) / base.n); // check'te showdown payın (call edenlerin hepsi seni yener)
  const beatFoldPct = pct((folders - base.foldBeatsYou) / folders);
  const ratio = num(Math.round((base.foldBeatsYou / base.callers) * 100) / 100);
  const ending = bet
    ? `Check edersen showdown'da BB'nin ellerinin yalnızca yaklaşık ${numSuffix(sdPct, "inde")} kazanırsın; bahis, check'e göre kâr ekler. BB elinde as olan her elle call etse bile sonuç değişmiyor.`
    : foldPct < 10
      ? `Bu board'da BB'nin aralığının büyük kısmı en az bir çift ya da daha iyisini yaptı; bahse fold edecek el neredeyse yok (aralığın yaklaşık ${numSuffix(foldPct, "i")}). Bahis neredeyse her seferinde call görür ve kaybeder; check daha az kaybettirir. BB yalnızca üst çift ve üstüyle call etse bile sonuç değişmiyor.`
      : `Bahse fold edecek ellerin (aralığın yaklaşık ${numSuffix(foldPct, "i")}) yaklaşık ${numSuffix(beatFoldPct, "i")} showdown'da zaten sana kaybediyordu; bahis onları kaçırır, geriye yalnızca seni yenen eller kalır. ${sdPct >= 20 ? "Check, showdown değerini bedavaya görür." : "Check daha az kaybettirir."} BB yalnızca üst çift ve üstüyle call etse bile sonuç değişmiyor.`;
  bluffDrills.push({
    id,
    title: `River'da ${pretty(heroCards)}: blöf mü, check mi?`,
    game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: heroCards, board: flop + turn + river, potBB: VALUE_POT,
    seq: ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", "BTN x", `T ${turn}`, "BB x", "BTN x", `R ${river}`, "BB x"],
    note: `Varsayım: BB'nin aralığı sitedeki buton açılış aralığı, AA, KK, QQ ve AK hariç (bunlarla 3-bet ederdi), önceki check'lerle daralmamış; 1,8 BB'lik bahse çift ve üstüyle call eder, çiftsiz ellerle (as yüksek dahil) fold eder, check-raise yapmaz.`,
    options: ["Check", "Bahis 1,8 BB (pot'un üçte biri)"], correct: bet ? 1 : 0, topic: "blof", level: 2,
    reasoning:
      `Elinde çift yok; bahse yalnızca seni yenen eller call eder. Bu yüzden soru şu: fold ettireceğin eller arasında showdown'da seni yenecek olanlar yeterince çok mu? ` +
      `BB'nin aralığının yaklaşık ${numSuffix(callPct, "i")} call eder (her biri sana 1,8 BB kaybettirir), yaklaşık ${numSuffix(winPct, "i")} ise fold eder ama check'te seni yenerdi (her biri 5,5 BB'lik potu sana kazandırır). ` +
      `Blöf, ikinci grubun birinciye oranı 1,8/5,5 ≈ 0,33 değerini geçerse kârlı; burada oran ≈ ${ratio}. ` +
      ending,
  });
}
drills.push(...bluffDrills);
console.log("blöf:", bluffDrills.length, bluffCounts);

// ── 7) Turnuva: BB'desin, açılışa 3-bet all-in ya da fold (17. çalışma) ─────
// BTN ya da CO 2 BB açar, aradakiler fold eder; kahraman BB'de, efektif stack 20 ya da 25 BB,
// toplam ante 1 BB (ölü para). Seçenekler yalnızca Fold ve All-in (flat call, küçük 3-bet modellenmez).
// Fold'a göre fark (BB, chip EV):  Δ = f × P0 + (1 − f) × [eq × (2S + 1,5) − (S − 1)]
//   P0 = 4,5 (açılış 2 + SB 0,5 + BB 1 + ante 1), f = açanın all-in'e fold etme oranı (açılış aralığındaki
//   kombinasyonlar, kahramanın kartları çıkarılarak kesin sayılır), eq = kahramanın call aralığına karşı equity'si.
// Açanın call aralığı türetilir: açan, BB'nin all-in aralığını push sıralamasının en iyi %X'i sayar ve
// açılış aralığındaki ellerden yalnızca bu aralığa karşı call fiyatını (S − 2) / (2S + 1,5) karşılayan
// equity'si olanlarla call eder. Üç senaryo: varsayılan all-in aralığı %X, %0,75X (açan daha sıkı call eder)
// ve %1,35X (daha geniş call eder). Not: açan çok sıkı call ederse (ör. %0,6X) hemen her el all-in'de kârlı
// çıkar; fold cevapları bu uç senaryoya dayanıklı değildir, bu yüzden aralık bilerek bu kadar tutuldu. Cevap üçünde aynı ve |Δ| ≥ 0,5 BB olmalı. Aralıklar `note`/gerekçede yazılır;
// test bu yazılı aralıklardan yeniden hesaplar (aralığın türetilmesi değil, cevabın doğruluğu denetlenir).
const rnd3 = mulberry32(20261117);
const rnd3Check = mulberry32(20261118);
const RESTEAL_P0 = 4.5;
const RESTEAL_MARGIN = 0.5;
const sgn = (x: number) => num(Math.round(x * 10) / 10).replace("-", "−");
/** Aralığı kısa yazar ("77+, A9s+, KQo"); testteki `expand` ile geri açılabilir. */
function compactRange(list: string[]): string {
  const set = new Set(list);
  const parts: string[] = [];
  const pairs = R.filter((r) => set.has(r + r)); // A'dan aşağı
  let k = 0;
  while (k < pairs.length && pairs[k] === R[k]) k++;
  if (k > 1) parts.push(`${pairs[k - 1]}${pairs[k - 1]}+`);
  else if (k === 1) parts.push("AA");
  for (const p of pairs.slice(k)) parts.push(p + p);
  for (let i = 0; i < R.length; i++) {
    for (const kind of ["s", "o"]) {
      const kick = R.slice(i + 1).filter((r) => set.has(R[i] + r + kind));
      if (!kick.length) continue;
      let c = 0;
      while (c < kick.length && kick[c] === R[i + 1 + c]) c++;
      if (c > 1) parts.push(`${R[i]}${kick[c - 1]}${kind}+`);
      else if (c === 1) parts.push(R[i] + kick[0] + kind);
      for (const r of kick.slice(c)) parts.push(R[i] + r + kind);
    }
  }
  return parts.join(", ");
}
const pctOfCombos = (list: string[]) => list.reduce((n, l) => n + combos(l), 0) / 13.26;
function restealDelta(hero: [number, number], openList: string[], callList: string[], S: number, trials: number, rng: () => number) {
  const live = (l: [number, number][]) => l.filter(([x, y]) => x !== hero[0] && x !== hero[1] && y !== hero[0] && y !== hero[1]);
  const nOpen = live(rangeCombos(openList)).length;
  const callC = live(rangeCombos(callList));
  const f = 1 - callC.length / nOpen;
  const eq = equityVsRange(hero, callC, trials, rng);
  const called = eq * (2 * S + 1.5) - (S - 1);
  return { f, eq, called, delta: f * RESTEAL_P0 + (1 - f) * called };
}
// Varsayılan all-in aralığı (X): açan ne kadar geç pozisyonda ve stack ne kadar kısaysa o kadar geniş.
const RESTEAL_CONFIGS: { pos: "BTN" | "CO" | "HJ" | "UTG"; S: 20 | 25; shovePct: number }[] = [
  { pos: "BTN", S: 20, shovePct: 25 },
  { pos: "BTN", S: 25, shovePct: 20 },
  { pos: "CO", S: 20, shovePct: 20 },
  { pos: "CO", S: 25, shovePct: 15 },
  { pos: "HJ", S: 20, shovePct: 15 },
  { pos: "HJ", S: 25, shovePct: 15 },
  { pos: "UTG", S: 20, shovePct: 15 },
  { pos: "UTG", S: 25, shovePct: 12 },
];
const RESTEAL_CAP = { allin: 4, fold: 8 }; // bölüm başına; toplamda en fazla 30 + 30
/** Açanın call aralığı: açılış aralığında, BB'nin varsayılan all-in aralığına karşı call fiyatını karşılayan eller. */
function deriveCalls(openList: string[], shovePct: number, S: number): string[] {
  const shove = rangeCombos(top(pushScore, shovePct));
  const need = (S - 2) / (2 * S + 1.5);
  return openList.filter((l) => {
    const c = l.length === 3 && l[2] === "s" ? l[0] + "s" + l[1] + "s" : l[0] + "s" + l[1] + "h";
    return equityVsRange([toCard(c.slice(0, 2)), toCard(c.slice(2))], shove, 20000, rnd3Check) >= need;
  });
}
const restealDrills: Drill[] = [];
const restealCounts = { allin: 0, fold: 0 };
for (const cfg of RESTEAL_CONFIGS) {
  const openList = out.cash[cfg.pos] as string[];
  const callBase = deriveCalls(openList, cfg.shovePct, cfg.S);
  const callNarrow = deriveCalls(openList, Math.round(cfg.shovePct * 0.75), cfg.S);
  const callWide = deriveCalls(openList, Math.round(cfg.shovePct * 1.35), cfg.S);
  const local = { allin: 0, fold: 0 };
  const order = [...labels];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd3() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const l of order) {
    const full = (k: "allin" | "fold") => local[k] >= RESTEAL_CAP[k] || restealCounts[k] >= 30;
    if (full("allin") && full("fold")) break;
    const s1 = Math.floor(rnd3() * 4);
    const s2 = l.length === 3 && l[2] === "s" ? s1 : (s1 + 1 + Math.floor(rnd3() * 3)) % 4;
    const cards = l[0] + SUITS[s1] + l[1] + SUITS[s2];
    const hero: [number, number] = [toCard(cards.slice(0, 2)), toCard(cards.slice(2))];
    // Hızlı ön eleme (6.000 deneme); kalanlar 20.000 denemeyle üç senaryoda ölçülür.
    const quick = restealDelta(hero, openList, callBase, cfg.S, 6000, rnd3Check);
    if (Math.abs(quick.delta) < RESTEAL_MARGIN * 0.6 || full(quick.delta > 0 ? "allin" : "fold")) continue;
    const base = restealDelta(hero, openList, callBase, cfg.S, 20000, rnd3Check);
    const narrow = restealDelta(hero, openList, callNarrow, cfg.S, 20000, rnd3Check);
    const wide = restealDelta(hero, openList, callWide, cfg.S, 20000, rnd3Check);
    const ds = [base, narrow, wide].map((x) => x.delta);
    if (ds.some((d) => Math.sign(d) !== Math.sign(ds[0]))) continue;
    if (Math.min(...ds.map(Math.abs)) < RESTEAL_MARGIN) continue;
    const allin = base.delta > 0;
    const key = allin ? "allin" : "fold";
    if (full(key)) continue;
    // Gerekçede gösterilen sayılar daha uzun ölçümden (80.000 deneme, standart hata ≈ ±0,18 puan).
    const shown = restealDelta(hero, openList, callBase, cfg.S, 80000, rnd3Check);
    if (Math.sign(shown.delta) !== Math.sign(base.delta) || Math.abs(shown.delta) < RESTEAL_MARGIN) continue;
    local[key]++;
    restealCounts[key]++;
    const S = cfg.S;
    const fP = pct(shown.f);
    const eP = pct(shown.eq);
    const order6 = ["UTG", "HJ", "CO", "BTN", "SB"];
    const seq = [`${cfg.pos} r2`, ...order6.slice(order6.indexOf(cfg.pos) + 1).map((p) => `${p} f`)];
    const pot2 = num(2 * S + 1.5);
    const tail = allin
      ? shown.called < 0
        ? `Call gördüğünde kaybediyorsun ama ${GEN[cfg.pos]} sık fold etmesi bunu fazlasıyla karşılıyor.`
        : `Call gördüğünde bile önde ya da kâra yakınsın; fold ettiğinde potu bedavaya alıyorsun.`
      : `Fold ettirdiğin pot (4,5 BB), call gördüğün kolun kaybını karşılamıyor.`;
    restealDrills.push({
      id: `r3-${cfg.pos}${S}-${cards}`,
      title: `${cfg.pos} 2 BB açtı, BB'de ${l}, ${S} BB: all-in mi?`,
      game: "turnuva", street: "preflop", heroPos: "BB", stackBB: S,
      hero: cards, potBB: RESTEAL_P0, seq, ante: 1,
      note: `Varsayım: ICM yok (chip EV), efektif stack ${S} BB, toplam ante 1 BB. ${cfg.pos} sitedeki ${cfg.pos} açılış aralığıyla (ellerin yaklaşık ${numSuffix(Math.round(pctOfCombos(openList)), "i")}) 2 BB açar; senin all-in aralığını ellerin en iyi ${numSuffix(cfg.shovePct, "i")} sayar ve yalnızca buna karşı yeterli equity'si olan ${compactRange(callBase)} ile call eder (ellerin yaklaşık ${numSuffix(Math.round(pctOfCombos(callBase)), "i")}). Flat call ve küçük 3-bet modellenmedi; soru all-in ile fold'u karşılaştırır.`,
      options: ["Fold", `All-in (${S} BB)`], correct: allin ? 1 : 0, topic: "3bet", level: 2,
      reasoning:
        `All-in'in iki sonucu var. ${cfg.pos} açılış aralığının yaklaşık ${numSuffix(fP, "inde")} fold eder ve 4,5 BB'lik potu alırsın. ` +
        `Kalan ${numSuffix(100 - fP, "inde")} call eder; ${pretty(cards)} bu call aralığına karşı yaklaşık %${eP} equity taşır, ${pot2} BB'lik potta bu kol fold'a göre ≈ ${sgn(shown.called)} BB getirir. ` +
        `Toplam: ${num(Math.round(shown.f * 100) / 100)} × 4,5 + ${num(Math.round((1 - shown.f) * 100) / 100)} × (${sgn(shown.called)}) ≈ ${sgn(shown.delta)} BB, yani ${allin ? "all-in fold'dan kârlı" : "all-in fold'dan kötü; fold"}. ${tail} ` +
        `${cfg.pos} yalnızca ${compactRange(callNarrow)} ile call etse (daha sıkı) ya da ${compactRange(callWide)} ile call etse (daha geniş) de cevap aynı kalıyor.`,
    });
  }
  console.log(`3-bet all-in ${cfg.pos} ${cfg.S}:`, local);
}
drills.push(...restealDrills);
console.log("3-bet all-in:", restealDrills.length, restealCounts);
console.log("callshove: sınırda çıkarılan", dropped.length, dropped.join(", "));
console.log("callshove: aralığa duyarlı", sensitive.length, sensitive.join(" "));
console.log("pot odds:", potOdds.length, counts);

writeFileSync(new URL("../src/data/drills.json", import.meta.url), JSON.stringify(drills));
console.log("drills:", drills.length);
