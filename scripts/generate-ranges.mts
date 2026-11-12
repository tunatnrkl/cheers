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

// ── 4) Cash: turn'de all-in, rakibin ARALIĞINA karşı pot odds ─────────
// Rakibin kartları görünmez (KARARLAR.md karar 3). Doğru cevap, hero elinin rakibin
// varsayılan turn all-in aralığına karşı equity'sinin fiyatla karşılaştırmasıdır.
// Equity tahmin edilmez: aralıktaki her kombinasyon için kalan 44 river kartı tek tek sayılır.
//
// Aralık varsayımı (yaklaşık; solver çıktısı değildir) üç gruptan oluşur:
//   1) Hazır eller: board'un en yüksek kartını tutan en zayıf el ve onu yenen her el
//      (en yüksek kart board'da tekse "üst çift ve daha iyisi").
//   2) Floş çekişleri: kendi kartlarından en az biriyle aynı renkten dört kart.
//   3) İki uçlu (8 out'lu) kent çekişleri: kendi kartının katkısıyla, kenti iki farklı
//      değerle tamamlayan eller (çift içten çekiş de buraya girer).
// Rakip BTN ise yalnızca açılış aralığındaki (ranges.json, cash.BTN) eller sayılır;
// rakip BB ise herhangi iki kart sayılır (geniş savunma). Her kombinasyon eşit ağırlıklıdır.
//
// Kimlikler eski üretimden gelir ve DEĞİŞMEZ: kullanıcıların ilerleme kayıtları kimliğe bağlı.
// Her satır: hero eli, board, efektif stack, hero pozisyonu (kimlik = o-<el>-<board>).
const POT_ODDS_BASE = [
  "Qc4c 3cTh7h8c 60 BB", "3s8c Jc7c5hJs 60 BTN", "5c7h Ts3hThQh 60 BTN", "7hAc QsTc9c8d 25 BB", "3hAd 8dTs8sKd 20 BTN",
  "QhKc 6cAh7hJc 40 BTN", "3c5c Ts5dAc6d 15 BTN", "6d9h 3d4d2c3c 40 BB", "8h5s JhTc3d4c 30 BTN", "5c9s 7h2s8h4c 40 BTN",
  "3sTh 8s8d7h9d 30 BTN", "5cTh KdJc4d8h 40 BB", "7cKc 2h7h5dAh 20 BB", "Qh2c 4dTcQs9s 60 BTN", "6c3c 8c2d7d8h 20 BTN",
  "Ac2c JsKc9s6c 30 BB", "7s7c 2d5c2cTc 20 BTN", "6h8c 3dQh5dAs 15 BTN", "5s6s 3h9cJh7h 25 BTN", "JsTh 5c4d4cKd 30 BB",
  "4h5s Qd8h6cKh 40 BTN", "5d8d Qs9hTsTc 30 BTN", "Jh2h 8hKs9d6h 30 BTN", "5c4d 7cKsJsKd 25 BTN", "5c8d 2hTh2sAs 15 BTN",
  "7cQs TcAd6d3c 60 BTN", "6hTs 4dAc8c2s 25 BB", "8d7s 5hAc9hQs 60 BB", "Qh7s TdQs6cAs 25 BTN", "KdJc Td2hAs8s 25 BB",
  "Ks3h Tc5dQc5h 25 BB", "Qh9s 2sAdTd6c 25 BTN", "5dKd 9d8s7s3h 60 BB", "6c2h QsTs7c8h 30 BTN", "8h4h Qc9sJcQh 60 BB",
  "5h3h 4h9cKd9d 15 BTN", "4s5s 9h2c2dTd 15 BB", "3c2d Th8hKs8s 15 BB", "4h4c 8d8c6h6s 15 BB", "7h2c 2h5h6s4h 15 BB",
  "3cQd 9s9c2s8c 20 BTN", "5h2s QsTdJh8s 15 BTN", "9c7c 8sJs8c5h 15 BB", "2h6h 4hKc4cJd 15 BB", "Qh8s 5hJh7h9d 20 BB",
  "3c5d 6c7cTdKc 15 BB", "Tc9d Qh7dQd2d 15 BTN", "8s2s 5s9c7s9h 20 BTN", "Jc4c 7h6h8c8d 15 BTN", "AsKs ThTsJs2c 20 BTN",
  "2hTh 8hQh9s6d 20 BTN", "6dQs KdKsAs2s 15 BTN", "5c4c Ac6cKs8d 20 BB", "2h3c Ad9dAsJh 40 BTN", "Jd7d Kc3dTcKd 15 BB",
  "8cJc 2sTd4cQc 15 BTN", "7s6c 4c5sAc5h 15 BTN", "4dAc Ks9dQs3h 20 BTN", "Qh4d 3dTh6cAs 30 BTN", "5d3c 2c6c6dQh 15 BB",
  "8hJh 5d7s5h6h 20 BB", "2c8c Td4dAs4c 15 BTN", "Qs7c 9s6sKsTc 25 BB", "AsQh Td3sTsKs 60 BB", "Ah8d JhKhTs8h 15 BTN",
  "2s6c 3cKc3hAd 30 BTN", "4c2s 6c3s8cAc 15 BB", "Ad4d 6c3dJc9s 30 BTN", "Qs2s Ac8cTh3h 60 BTN", "3s9h KdQd4s6h 25 BTN",
];

const cardStr = (c: number) => R[12 - (c >> 2)] + SUITS[c & 3];
const cardsOf = (s: string) => (s.match(/.{2}/g) ?? []).map(toCard);
const rankTR = (r: number) => (r === 8 ? "10" : R[12 - r]);
/** Değer maskesinde (bit 0 = 2 … bit 12 = A) beş ardışık değer var mı? As alttan da sayılır. */
const hasStraight = (mask: number) => {
  const m = (mask << 1) | ((mask >> 12) & 1);
  for (let i = 0; i <= 9; i++) if (((m >> i) & 0x1f) === 0x1f) return true;
  return false;
};
const maskOf = (cards: number[]) => cards.reduce((m, c) => m | (1 << (c >> 2)), 0);
/** Kenti tamamlayan farklı değer sayısı; yalnızca hole kartın katkısıyla gelenler sayılır. */
function straightOuts(hole: number[], board: number[]): number {
  const all = maskOf([...hole, ...board]);
  const b = maskOf(board);
  if (hasStraight(all)) return 0;
  let n = 0;
  for (let r = 0; r < 13; r++) if (hasStraight(all | (1 << r)) && !hasStraight(b | (1 << r))) n++;
  return n;
}
function flushDraw(hole: number[], board: number[]): boolean {
  for (let s = 0; s < 4; s++) {
    const inHole = hole.filter((c) => (c & 3) === s).length;
    if (inHole > 0 && inHole + board.filter((c) => (c & 3) === s).length === 4) return true;
  }
  return false;
}
const labelOf = (a: number, b: number) => {
  const [hi, lo] = a >> 2 >= b >> 2 ? [a, b] : [b, a];
  const x = R[12 - (hi >> 2)] + R[12 - (lo >> 2)];
  return hi >> 2 === lo >> 2 ? x : x + ((hi & 3) === (lo & 3) ? "s" : "o");
};

/** Hazır el eşiği: `rank` değerinde bir kart tutan en zayıf elin gücü. */
type Floor = { rank: number; value: number };
type Board = { cards: number[]; top: number; floor: number; tight: Floor; wide: Floor };
function boardInfo(cards: number[]): Board {
  const ranks = [...new Set(cards.map((c) => c >> 2))].sort((x, y) => y - x);
  const onBoard = new Set(cards);
  const weakestWith = (rank: number): Floor => {
    let value = Infinity;
    for (let s = 0; s < 4; s++) {
      const c = rank * 4 + s;
      if (onBoard.has(c)) continue;
      for (let d = 0; d < 52; d++) if (d !== c && !onBoard.has(d)) value = Math.min(value, evaluate7([c, d, ...cards]));
    }
    return { rank, value };
  };
  const tight = weakestWith(ranks[0]);
  // Geniş aralıkta eşik ikinci en yüksek değere iner; o değer board'da çiftse (üçlü yapar) eşik yine en yüksek karttır.
  const second = ranks.length > 1 ? weakestWith(ranks[1]) : tight;
  return { cards, top: ranks[0], floor: tight.value, tight, wide: second.value < tight.value ? second : tight };
}

type Combo = { hole: [number, number]; made: boolean };
/** Rakibin turn all-in aralığı: hero ve board kartları çıkarılmış kombinasyonlar. */
function shoveRange(b: Board, dead: number[], villainPos: string, wide: boolean): Combo[] {
  const used = new Set([...b.cards, ...dead]);
  const open = new Set(out.cash.BTN);
  const floor = (wide ? b.wide : b.tight).value;
  const list: Combo[] = [];
  for (let x = 0; x < 52; x++)
    for (let y = x + 1; y < 52; y++) {
      if (used.has(x) || used.has(y)) continue;
      if (villainPos === "BTN" && !open.has(labelOf(x, y))) continue;
      const made = evaluate7([x, y, ...b.cards]) >= floor;
      if (made || flushDraw([x, y], b.cards) || straightOuts([x, y], b.cards) >= (wide ? 1 : 2)) list.push({ hole: [x, y], made });
    }
  return list;
}
/** Tam sayım: aralıktaki her kombinasyon × kalan 44 river kartı. */
function equityExact(hero: number[], board: number[], range: Combo[]): number {
  let score = 0;
  let n = 0;
  for (const { hole } of range) {
    const used = new Set([...hero, ...board, ...hole]);
    for (let c = 0; c < 52; c++) {
      if (used.has(c)) continue;
      const h = evaluate7([...hero, ...board, c]);
      const v = evaluate7([...hole, ...board, c]);
      score += h > v ? 1 : h === v ? 0.5 : 0;
      n++;
    }
  }
  return score / n;
}

/** Hero elinin sade tarifi: [yalın, "…ile" hâli]. */
function heroKind(hero: number[], b: Board): [string, string] {
  const v = evaluate7([...hero, ...b.cards]);
  const cat = Math.floor(v / 16 ** 5);
  const fd = flushDraw(hero, b.cards);
  const so = straightOuts(hero, b.cards);
  const [h1, h2] = hero.map((c) => c >> 2);
  const boardRanks = [...new Set(b.cards.map((c) => c >> 2))].sort((x, y) => y - x);
  if (cat >= 4) return ["Güçlü hazır el", "güçlü hazır elle"];
  if (v >= b.floor) {
    if (cat === 1 && h1 === h2) return ["Overpair", "overpair'le"];
    if (cat === 1) return ["Üst çift", "üst çiftle"];
    return ["Güçlü hazır el", "güçlü hazır elle"];
  }
  if (fd && so >= 2) return ["Floş ve kent çekişi", "floş ve kent çekişiyle"];
  if (fd) return ["Floş çekişi", "floş çekişiyle"];
  if (so >= 2) return ["İki uçlu kent çekişi", "iki uçlu kent çekişiyle"];
  const paired = h1 === h2 || boardRanks.includes(h1) || boardRanks.includes(h2);
  if (paired && so === 1) return ["Çift ve içten kent çekişi", "çift ve içten kent çekişiyle"];
  if (h1 === h2) return ["Cep çifti", "cep çiftiyle"];
  if (paired) {
    const second = boardRanks[1] === h1 || boardRanks[1] === h2;
    return second ? ["İkinci çift", "ikinci çiftle"] : ["Alt çift", "alt çiftle"];
  }
  if (so === 1) return ["İçten kent çekişi", "içten kent çekişiyle"];
  if (h1 > b.top && h2 > b.top) return ["İki üst kart", "iki üst kartla"];
  return ["Çekişsiz el", "çekişsiz elle"];
}

const MARGIN = 0.035; // HAFIZA: eşiğe 3,5 puandan yakın spot sınırdadır
const potOdds: Drill[] = [];
const counts = { call: 0, fold: 0 };
const replaced: string[] = [];
const unsolved: string[] = [];
const detail: Record<string, unknown>[] = [];
const flopBet = 2.75;
const potTurn = 5.5 + 2 * flopBet;

// All-in potun 1,5 katını aşmıyorsa (15 ve 20 BB) rakip geniş aralıkla iter: eşik ikinci en yüksek
// değere iner ve içten kent çekişleri de girer. Daha büyük all-in'lerde aralık dardır. Sınır bir varsayımdır.
const WIDE_UP_TO = 1.5;
type Spot = { id: string; hero: number[]; b: Board; S: number; heroPos: string; vilPos: string; shove: number; finalPot: number; req: number; wide: boolean; range: Combo[]; eq: number };
function measure(id: string, hero: number[], b: Board, S: number, heroPos: string): Spot {
  const vilPos = heroPos === "BB" ? "BTN" : "BB";
  const shove = S - 2.5 - flopBet;
  const finalPot = potTurn + 2 * shove;
  const wide = shove <= WIDE_UP_TO * potTurn;
  const range = shoveRange(b, hero, vilPos, wide);
  return { id, hero, b, S, heroPos, vilPos, shove, finalPot, req: shove / finalPot, wide, range, eq: equityExact(hero, b.cards, range) };
}

const spots = POT_ODDS_BASE.map((row) => {
  const [heroS, boardS, S, heroPos] = row.split(" ");
  const first = measure(`o-${heroS}-${boardS}`, cardsOf(heroS), boardInfo(cardsOf(boardS)), Number(S), heroPos);
  return { heroS, boardS, first, spot: first };
});
// Hero eli iki durumda değiştirilir (kimlik, board, stack ve aksiyonlar aynı kalır):
//   "sınırda": equity eşiğe 3,5 puandan yakın, cevap tartışmalı;
//   "ölü el":  equity %10'un altında, yani ortada bir fiyat sorusu yok (çekişsiz, çiftsiz el).
// İkinci kuralı kapatmak için DEAD_BELOW = 0 yap.
const DEAD_BELOW = 0.1;
const whyReplace = (s: Spot) => (Math.abs(s.eq - s.req) < MARGIN ? "sınırda" : s.eq < DEAD_BELOW ? "ölü el" : null);
for (const { spot } of spots) if (!whyReplace(spot)) counts[spot.eq > spot.req ? "call" : "fold"]++;

// Yeni el sıraya bağlı sabit tohumla aranır: cevap net ama bariz değil (eşiğe 5–20 puan),
// hero BTN ise el açılış aralığından. Call/fold dengesi için o an az olan taraf tercih edilir.
const btnOpen = new Set(out.cash.BTN);
const why = new Map<string, string>();
spots.forEach((entry, i) => {
  const s = entry.spot;
  const reason = whyReplace(s);
  if (!reason) return;
  const rng = mulberry32(4100 + i);
  const free = Array.from({ length: 52 }, (_, c) => c).filter((c) => !s.b.cards.includes(c));
  const want = counts.call <= counts.fold ? "call" : "fold";
  for (let t = 0; t < 3000; t++) {
    const x = free[Math.floor(rng() * free.length)];
    const y = free[Math.floor(rng() * free.length)];
    if (x === y) continue;
    if (s.heroPos === "BTN" && !btnOpen.has(labelOf(x, y))) continue;
    const hero = x >> 2 >= y >> 2 ? [x, y] : [y, x];
    const m = measure(s.id, hero, s.b, s.S, s.heroPos);
    const gap = Math.abs(m.eq - m.req);
    if (gap < 0.05 || gap > 0.2) continue;
    if ((m.eq > m.req ? "call" : "fold") !== want && t < 2000) continue;
    replaced.push(`${s.id}: ${pretty(entry.heroS)} → ${pretty(hero.map(cardStr).join(""))} (${reason})`);
    why.set(s.id, reason);
    entry.spot = m;
    counts[m.eq > m.req ? "call" : "fold"]++;
    return;
  }
  unsolved.push(s.id);
});

for (const { spot: s, heroS, boardS, first } of spots) {
  if (unsolved.includes(s.id)) continue;
  const ok = s.eq > s.req;
  const flop = boardS.slice(0, 6);
  const turn = boardS.slice(6);
  const seq =
    s.heroPos === "BB"
      ? ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB x", "BTN a"]
      : ["BTN r2.5", "SB f", "BB c", `F ${flop}`, "BB x", `BTN b${flopBet}`, "BB c", `T ${turn}`, "BB a"];
  const heroCards = s.hero.map(cardStr).join("");
  const [kind, kindWith] = heroKind(s.hero, s.b);

  const made = s.range.filter((c) => c.made);
  const draws = s.range.filter((c) => !c.made);
  const anyFd = s.range.some((c) => flushDraw(c.hole, s.b.cards));
  const anySd = s.range.some((c) => straightOuts(c.hole, s.b.cards) >= (s.wide ? 1 : 2));
  const fl = s.wide ? s.b.wide : s.b.tight;
  const onBoard = (r: number) => s.b.cards.filter((c) => c >> 2 === r).length;
  // "Çift" yalnızca hem eşik değeri hem en yüksek kart board'da tekse doğru kelimedir.
  const pairWord = onBoard(fl.rank) > 1 || onBoard(s.b.top) > 1 ? null : fl.rank === s.b.top ? "üst çift" : "ikinci çift";
  const groups = [
    pairWord ? `${pairWord} (${rankTR(fl.rank)}) ve daha iyi her el` : `${rankTR(fl.rank)} tutan eller ve daha iyi her el`,
    ...(anyFd ? ["floş çekişleri"] : []),
    ...(anySd ? [s.wide ? "kent çekişleri (içten çekişler dahil)" : "iki uçlu kent çekişleri (8 out)"] : []),
  ];
  const who =
    s.vilPos === "BTN"
      ? "BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar"
      : "BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar";

  // Aralığa duyarlılık: rakip hiç çekişle all-in yapmasaydı cevap değişir miydi?
  const eqMade = draws.length ? equityExact(s.hero, s.b.cards, made) : s.eq;
  let sensitivity = "";
  if (draws.length && eqMade > s.req !== ok) {
    sensitivity =
      Math.abs(eqMade - s.req) < 0.01
        ? ` Bu kararı rakibin aralığı belirliyor: rakip hiç çekişle all-in yapmasaydı equity'n gereken düzeye (yaklaşık %${pct(s.req)}) yaklaşırdı ve call ile fold neredeyse eşit olurdu.`
        : ` Bu kararı rakibin aralığı belirliyor: rakip hiç çekişle all-in yapmasaydı equity'n yaklaşık %${pct(eqMade)} olurdu ve ${ok ? "fold" : "call"} doğru olurdu.`;
  }
  const madePct = pct(made.length / s.range.length);
  const mix = draws.length
    ? `Varsayılan aralıkta ${s.range.length} kombinasyon var; yaklaşık ${numSuffix(madePct, "i")} hazır el, kalanı çekiş.`
    : `Varsayılan aralıkta ${s.range.length} kombinasyon var; hepsi hazır el.`;

  potOdds.push({
    id: s.id,
    title: `Turn all-in: ${kindWith} call?`,
    game: "cash", street: "turn", heroPos: s.heroPos, stackBB: s.S,
    hero: heroCards, board: boardS, potBB: Math.round((potTurn + s.shove) * 100) / 100, seq,
    note: `Pot odds alıştırması: ${s.vilPos} turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: ${who}: ${groups.join(", ")}. Efektif stack ${s.S} BB.`,
    options: ["Fold", `Call (${num(s.shove)} BB)`], correct: ok ? 1 : 0, topic: "odds", level: 2,
    reasoning: `Call için ${num(s.shove)} BB ödeyip ${num(s.finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(s.req)}. ${mix} ${kind} ile bu aralığa karşı equity'n yaklaşık %${pct(s.eq)} (her kombinasyon için kalan 44 river kartı tek tek sayıldı). ${ok ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold."}${sensitivity} All-in olduğu için sonradan kazanılacak ek chip yok; yalnızca bu hesap önemli. Aralık yaklaşık bir varsayımdır.`,
  });
  detail.push({
    id: s.id, hero: heroCards, board: boardS, heroPos: s.heroPos, stackBB: s.S, kind,
    correct: ok ? 1 : 0, req: s.req, eq: s.eq, combos: s.range.length, made: made.length,
    eqMadeOnly: eqMade, sensitive: sensitivity !== "",
    wide: s.wide, note: (potOdds.at(-1) as { note: string }).note,
    replaced: why.get(s.id) ?? null, firstHero: heroS, firstEq: first.eq,
  });
}
drills.push(...potOdds);
// Önce/sonra raporu için ayrıntı (POT_ODDS_DETAIL=<dosya> npm run ranges); veri dosyasına girmez.
if (process.env.POT_ODDS_DETAIL) writeFileSync(process.env.POT_ODDS_DETAIL, JSON.stringify(detail, null, 1));
console.log("callshove: sınırda çıkarılan", dropped.length, dropped.join(", "));
console.log("callshove: aralığa duyarlı", sensitive.length, sensitive.join(" "));
console.log("pot odds:", potOdds.length, counts);
console.log("pot odds: hero eli değiştirilen", replaced.length, replaced.join("; "));
console.log("pot odds: çözülemeyen", unsolved.length, unsolved.join(" "));

writeFileSync(new URL("../src/data/drills.json", import.meta.url), JSON.stringify(drills));
console.log("drills:", drills.length);
