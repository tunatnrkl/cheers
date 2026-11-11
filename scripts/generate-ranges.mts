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
console.log("callshove: sınırda çıkarılan", dropped.length, dropped.join(", "));
console.log("callshove: aralığa duyarlı", sensitive.length, sensitive.join(" "));
console.log("pot odds:", potOdds.length, counts);

writeFileSync(new URL("../src/data/drills.json", import.meta.url), JSON.stringify(drills));
console.log("drills:", drills.length);
