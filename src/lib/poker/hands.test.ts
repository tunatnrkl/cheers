import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { replay } from "./replay";
import { icm } from "./math";

// Her el için: aksiyon sırası kurallara uygun, sıra kahramanda, pot verisi tutarlı,
// kartlar geçerli ve tekrarsız, board sokağa uygun, doğru cevap seçeneklerden biri.
const CARD = /^[2-9TJQKA][shdc]$/;
const BOARD_LEN = { preflop: 0, flop: 3, turn: 4, river: 5 };

describe("el verisi", () => {
  it("en az 300 el var ve id'ler tekil", () => {
    expect(HANDS.length).toBeGreaterThanOrEqual(300);
    expect(new Set(HANDS.map((h) => h.id)).size).toBe(HANDS.length);
  });

  for (const h of HANDS) {
    it(`${h.id} · ${h.title}`, () => {
      const r = replay(h);
      expect(r.errors, r.errors.join("; ")).toEqual([]);
      expect(r.next).toBe(h.heroPos);
      expect(Math.abs(r.pot - h.potBB), `hesaplanan pot ${r.pot}, veri ${h.potBB}`).toBeLessThan(0.051);
      expect(r.street).toBe(h.street);
      expect(r.board).toBe(h.board ?? "");

      const cards = [...(h.hero.match(/.{2}/g) ?? []), ...((h.board ?? "").match(/.{2}/g) ?? [])];
      const shown = h.villain?.cards.match(/.{2}/g) ?? [];
      for (const c of shown) expect(c).toMatch(CARD);
      expect(new Set([...cards, ...shown]).size).toBe(cards.length + shown.length);
      if (h.villain) expect(r.seats[h.villain.pos].folded).toBe(false);
      expect(h.hero).toHaveLength(4);
      for (const c of cards) expect(c).toMatch(CARD);
      expect(new Set(cards).size).toBe(cards.length);
      expect(cards.length - 2).toBe(BOARD_LEN[h.street]);

      expect(h.correct).toBeGreaterThanOrEqual(0);
      expect(h.correct).toBeLessThan(h.options.length);
      expect(new Set(h.options).size).toBe(h.options.length);
      expect(h.reasoning.length).toBeGreaterThan(40);
    });
  }

  it("all-in seçeneğindeki BB miktarı kahramanın kalan stack'iyle tutarlı", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const left = replay(h).seats[h.heroPos].stack;
      for (const o of h.options) {
        const m = o.match(/^All-in \((?:≈\s*)?(\d+(?:,\d+)?) BB\)/);
        if (m && Math.abs(Number(m[1].replace(",", ".")) - left) > 1) bad.push(`${h.id}: "${o}", kalan stack ${left}`);
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("seçenek metinlerinde ondalık nokta yok (Türkçede ayırıcı virgüldür)", () => {
    const bad = HANDS.flatMap((h) => h.options.filter((o) => /\d\.\d/.test(o)).map((o) => `${h.id}: "${o}"`));
    expect(bad, bad.join("; ")).toEqual([]);
  });
});

// Üretilen ellerin cevaplarını bağımsız olarak yeniden doğrular.
import { cardFromString, evaluate7 } from "./evaluator";
import ranges from "@/data/ranges.json";
import { POSTS } from "@/data/blog";

describe("üretilen ellerin cevapları", () => {
  it("pot odds elleri: kalan kartlar sayıldığında karar doğru", () => {
    const list = HANDS.filter((h) => h.id.startsWith("o-"));
    expect(list.length).toBeGreaterThan(50);
    for (const h of list) {
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const vil = h.villain!.cards.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      const used = new Set([...hero, ...vil, ...board]);
      let wins = 0;
      for (let c = 0; c < 52; c++) {
        if (used.has(c)) continue;
        const a = evaluate7([...hero, ...board, c]);
        const b = evaluate7([...vil, ...board, c]);
        wins += a > b ? 1 : a === b ? 0.5 : 0;
      }
      const r = replay(h);
      const call = r.toCall;
      const req = call / (r.pot + call);
      expect(h.correct === 1, h.id).toBe(wins / 44 > req);
      expect(Math.abs(wins / 44 - req), h.id).toBeGreaterThan(0.035);
    }
  });

  it("açılış ve push elleri referans aralıkla tutarlı", () => {
    const label = (cards: string) => {
      const order = "AKQJT98765432";
      const [a, b] = [cards.slice(0, 2), cards.slice(2)].sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0]));
      return a[0] === b[0] ? a[0] + b[0] : a[0] + b[0] + (a[1] === b[1] ? "s" : "o");
    };
    for (const h of HANDS) {
      let range: string[] | undefined;
      if (h.id.startsWith("r-")) range = (ranges.cash as Record<string, string[]>)[h.heroPos];
      const m = h.id.match(/^p(\d+)-/);
      if (m) range = (ranges.push as Record<string, Record<string, string[]>>)[m[1]][h.heroPos];
      if (!range) continue;
      const aggressive = h.correct === h.options.length - 1;
      expect(range.includes(label(h.hero)), h.id).toBe(aggressive);
    }
  });
});

// Elle yazılmış spotların gerekçelerindeki sayısal iddiaları kontrol eder.
// Rakip aralığı varsayımı: ranges.json'daki referans push aralıkları (solver çıktısı değil).
describe("elle yazılmış spotlardaki equity iddiaları", () => {
  const S = "shdc";
  const combos = (label: string): string[] => {
    const [a, b] = [label[0], label[1]];
    const out: string[] = [];
    if (label.length === 2) {
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(a + S[i] + b + S[j]);
    } else if (label[2] === "s") {
      for (let i = 0; i < 4; i++) out.push(a + S[i] + b + S[i]);
    } else {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) out.push(a + S[i] + b + S[j]);
    }
    return out;
  };
  const cards = (s: string) => (s.match(/.{2}/g) ?? []).map(cardFromString);
  let seed = 424242;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const equityVsRange = (hero: string, range: string[], trials = 40000) => {
    const h = cards(hero);
    const villains = range
      .flatMap(combos)
      .map(cards)
      .filter((v) => !h.includes(v[0]) && !h.includes(v[1]));
    let score = 0;
    for (let t = 0; t < trials; t++) {
      const v = villains[Math.floor(rnd() * villains.length)];
      const used = new Set([...h, ...v]);
      const board: number[] = [];
      while (board.length < 5) {
        const c = Math.floor(rnd() * 52);
        if (!used.has(c)) {
          used.add(c);
          board.push(c);
        }
      }
      const a = evaluate7([...h, ...board]);
      const b = evaluate7([...v, ...board]);
      score += a > b ? 1 : a === b ? 0.5 : 0;
    }
    return score / trials;
  };
  const push = ranges.push as Record<string, Record<string, string[]>>;
  const required = (id: string) => {
    const r = replay(HANDS.find((h) => h.id === id)!);
    return r.toCall / (r.pot + r.toCall);
  };

  it("t05: A9o, butonun 10 BB push aralığına karşı %50'nin ve gereken equity'nin üzerinde", () => {
    const eq = equityVsRange("As9c", push["10"].BTN);
    expect(eq).toBeGreaterThan(0.5);
    expect(eq - required("t05")).toBeGreaterThan(0.035);
  });

  it("t06: J6o, SB'nin 15 BB push aralığına karşı %40'ın ve gereken equity'nin altında", () => {
    const eq = equityVsRange("Jc6d", push["15"].SB);
    expect(eq).toBeLessThan(0.4);
    expect(required("t06") - eq).toBeGreaterThan(0.035);
  });

  it("t22: A2o, 6 BB UTG push aralığına karşı gereken equity'nin belirgin üzerinde", () => {
    expect(equityVsRange("Ah2d", push["6"].UTG) - required("t22")).toBeGreaterThan(0.035);
  });

  it("c26: 15 out'lu combo draw, overpair'e karşı %50'nin üzerinde (kesin sayım)", () => {
    const h = cards("9h8h");
    const v = cards("QcQd");
    const flop = cards("Th7h2c");
    const used = new Set([...h, ...v, ...flop]);
    const rest = [...Array(52).keys()].filter((c) => !used.has(c));
    let score = 0;
    let n = 0;
    for (let i = 0; i < rest.length; i++)
      for (let j = i + 1; j < rest.length; j++) {
        const board = [...flop, rest[i], rest[j]];
        const a = evaluate7([...h, ...board]);
        const b = evaluate7([...v, ...board]);
        score += a > b ? 1 : a === b ? 0.5 : 0;
        n++;
      }
    expect(score / n).toBeGreaterThan(0.5);
  });

  // 5. çalışmada eklenen blind savunması ve SPR spotları (docs/ekip/2026-11-11/08-calisma-5-kapanis.md).
  // Rakip aralıkları ranges.json'daki yaklaşık açılış aralıklarıdır.
  const cash = ranges.cash as Record<string, string[]>;

  it("c34: 72o, butonun aralığına karşı gereken equity'nin ham haliyle bile altında", () => {
    expect(required("c34")).toBeCloseTo(2 / 6.5, 3);
    expect(equityVsRange("7d2c", cash.BTN)).toBeLessThan(required("c34"));
  });

  it("c35: J4o, UTG'ye karşı eşiğin hemen üstünde; equity'nin %85'inden fazlasını kullanması gerekir", () => {
    const eq = equityVsRange("Jd4c", cash.UTG);
    expect(eq - required("c35")).toBeLessThan(0.035);
    expect(required("c35") / eq).toBeGreaterThan(0.85);
    // Aynı el butonun aralığına karşı belirgin daha iyi (blog: blind-savunmasi-fiyat-aralik-pozisyon)
    expect(equityVsRange("Jd4c", cash.BTN) - eq).toBeGreaterThan(0.03);
  });

  it("c36: 65s, açılış + call'a karşı üç yollu potta gereken equity'nin belirgin üzerinde", () => {
    // Varsayım: butonun call aralığı = CO aralığı, en güçlü 3-bet elleri çıkarılmış.
    const flat = cash.CO.filter((l) => !["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"].includes(l));
    const h = cards("6s5s");
    const A = cash.CO.flatMap(combos).map(cards);
    const B = flat.flatMap(combos).map(cards);
    let score = 0;
    let n = 0;
    while (n < 40000) {
      const v = A[Math.floor(rnd() * A.length)];
      const w = B[Math.floor(rnd() * B.length)];
      const used = new Set([...h, ...v, ...w]);
      if (used.size !== 6) continue;
      const board: number[] = [];
      while (board.length < 5) {
        const c = Math.floor(rnd() * 52);
        if (!used.has(c)) {
          used.add(c);
          board.push(c);
        }
      }
      const s = [h, v, w].map((x) => evaluate7([...x, ...board]));
      const best = Math.max(...s);
      if (s[0] === best) score += 1 / s.filter((x) => x === best).length;
      n++;
    }
    expect(score / n - required("c36")).toBeGreaterThan(0.05);
  });

  it("t25: K4o, butonun aralığına karşı gereken equity'nin çok üzerinde", () => {
    expect(equityVsRange("Kd4c", cash.BTN) - required("t25")).toBeGreaterThan(0.15);
  });

  it("blog: T8s butonun aralığına karşı yaklaşık %41", () => {
    const eq = equityVsRange("Th8h", cash.BTN);
    expect(eq).toBeGreaterThan(0.39);
    expect(eq).toBeLessThan(0.44);
  });

  it("c38: en iyi durumda bile set mining oranı yetmiyor", () => {
    const r = replay(HANDS.find((h) => h.id === "c38")!);
    const pSet = 1 - (48 * 47 * 46) / (50 * 49 * 48); // flop'ta set ya da daha iyisi
    expect(pSet).toBeCloseTo(0.1176, 3);
    const maxWin = r.seats.UTG.stack + r.pot; // UTG'nin kalan stack'i + ortadaki pot
    expect(maxWin / r.toCall).toBeLessThan((1 - pSet) / pSet);
  });

  it("t26: KJ, nottaki aralığa karşı call; yalnızca güçlü ellere karşı fold (kesin sayım)", () => {
    const exact = (hero: string, flop: string, range: string[]) => {
      const h = cards(hero);
      const f = cards(flop);
      let score = 0;
      let n = 0;
      for (const v of range.flatMap(combos).map(cards)) {
        const used = new Set([...h, ...f, ...v]);
        if (used.size !== 7) continue;
        const rest = [...Array(52).keys()].filter((c) => !used.has(c));
        for (let i = 0; i < rest.length; i++)
          for (let j = i + 1; j < rest.length; j++) {
            const board = [...f, rest[i], rest[j]];
            const a = evaluate7([...h, ...board]);
            const b = evaluate7([...v, ...board]);
            score += a > b ? 1 : a === b ? 0.5 : 0;
            n++;
          }
      }
      return score / n;
    };
    const strong = ["AA", "KK", "QQ", "JJ", "88", "33", "AJs", "AJo", "KJs", "KJo", "QJs", "QJo", "JTs", "J9s"];
    const wide = [...strong, "TT", "99", "77", "66", "A8s", "98s", "87s", "AKs", "AKo", "AQs", "AQo", "ATs", "KQs", "T9s", "QTs", "97s"];
    const need = required("t26");
    expect(need).toBeCloseTo(10 / 25.5, 3);
    expect(exact("KcJd", "Jh8s3c", wide) - need).toBeGreaterThan(0.2);
    expect(need - exact("KcJd", "Jh8s3c", strong)).toBeGreaterThan(0.035);
  });

  it("t13: 88, nottaki SB resteal aralığına (ve daha dar bir aralığa) karşı gereken equity'nin belirgin üzerinde", () => {
    const resteal = ["22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
      "A8o", "A9o", "ATo", "AJo", "AQo", "AKo", "KTs", "KJs", "KQs", "KQo", "QJs"];
    const narrow = ["55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA",
      "A9s", "ATs", "AJs", "AQs", "AKs", "ATo", "AJo", "AQo", "AKo", "KQs"];
    const need = required("t13");
    expect(need).toBeCloseTo(11.8 / 30, 2);
    const eq = equityVsRange("8d8c", resteal);
    expect(eq).toBeGreaterThan(0.52);
    expect(eq).toBeLessThan(0.58);
    expect(equityVsRange("8d8c", narrow) - need).toBeGreaterThan(0.035);
  });

  it("t23: KT, CO'nun nottaki ikinci bahis aralığına karşı call (river kartı kesin sayım)", () => {
    const value = ["AKs", "AKo", "KQs", "KQo", "KJs", "KJo", "K9s", "77", "44", "99", "97s"];
    const draws = ["AsQs", "AsJs", "AsTs", "As8s", "As6s", "As5s", "QsJs", "JsTs", "Ts8s", "8s6s", "6s5s",
      "QsTs", "Js8s", "8h6h", "8d6d", "8c6c", "Th8h", "Tc8c", "6h5h", "6d5d", "6c5c"];
    const air = ["AQs", "AQo", "AJs", "ATs", "QJs", "QTs", "JTs", "A5s", "A4s", "A3s"];
    const turnExact = (hero: string, board: string, range: string[]) => {
      const h = cards(hero);
      const b = cards(board);
      const dead = new Set([...h, ...b]);
      let score = 0;
      let n = 0;
      for (const v of range.flatMap((l) => (l.length === 4 ? [l] : combos(l))).map(cards)) {
        if (dead.has(v[0]) || dead.has(v[1])) continue;
        for (let c = 0; c < 52; c++) {
          if (dead.has(c) || v.includes(c)) continue;
          const x = evaluate7([...h, ...b, c]);
          const y = evaluate7([...v, ...b, c]);
          score += x > y ? 1 : x === y ? 0.5 : 0;
          n++;
        }
      }
      return score / n;
    };
    const need = required("t23");
    expect(need).toBeCloseTo(4 / 17.9, 3);
    const eq = turnExact("KdTd", "Kc7h4s9s", [...value, ...draws, ...air]);
    expect(eq).toBeGreaterThan(0.54);
    expect(eq).toBeLessThan(0.58);
    // Seni yenen ellerin payı %75 olsa bile eşik geçiliyor mu? (karışım: 0,75 × value + 0,25 × geri kalan)
    const vEq = turnExact("KdTd", "Kc7h4s9s", value);
    const rest = turnExact("KdTd", "Kc7h4s9s", [...draws, ...air]);
    expect(0.75 * vEq + 0.25 * rest).toBeGreaterThan(need);
  });

  // CS-3: bubble spotları. Ödüller (%50/%30/%20) ve rakip aralığı nottaki varsayım; ICM = Malmuth-Harville.
  // Stack'ler replay'den; rakibin all-in'i kahramanın stack'inden küçük ya da eşit (iade yok).
  const icmCall = (id: string) => {
    const h = HANDS.find((x) => x.id === id)!;
    const r = replay(h);
    const seats = (h.players ?? []) as (keyof typeof r.seats)[];
    const vil = seats.find((s) => r.seats[s].allin)!;
    expect(r.seats[vil].stack).toBe(0);
    const after = (hero: number, v: number) => seats.map((s) => (s === h.heroPos ? hero : s === vil ? v : r.seats[s].stack));
    const me = seats.indexOf(h.heroPos);
    const hs = r.seats[h.heroPos].stack;
    const P = [50, 30, 20];
    const F = icm(after(hs, r.pot), P)[me];
    const W = icm(after(hs + r.pot, 0), P)[me];
    const L = icm(after(hs - r.toCall, r.pot + r.toCall), P)[me];
    return { chipReq: r.toCall / (r.pot + r.toCall), icmReq: (F - L) / (W - L), F, W, L, h };
  };

  it("ib01: A3o chip hesabıyla call, bubble'da ICM eşiğinin belirgin altında (fold)", () => {
    const { chipReq, icmReq, h } = icmCall("ib01");
    const eq = equityVsRange("As3h", push["10"].BTN);
    expect(h.correct).toBe(0);
    expect(eq).toBeGreaterThan(chipReq);
    expect(icmReq - eq).toBeGreaterThan(0.035);
    expect(icmReq).toBeGreaterThan(0.505);
    expect(icmReq).toBeLessThan(0.525);
    // Gerekçedeki iddia: BTN ellerin yarısına yakınıyla (6 BB aralığı, ~%48) itse bile eşiğin altında
    expect(equityVsRange("As3h", push["6"].BTN)).toBeLessThan(icmReq);
  });

  it("ib02: KQo chip hesabıyla call, ICM eşiği ~%56 (fold)", () => {
    const { chipReq, icmReq, h } = icmCall("ib02");
    const eq = equityVsRange("KsQd", push["15"].BTN);
    expect(h.correct).toBe(0);
    expect(eq).toBeGreaterThan(chipReq);
    expect(icmReq - eq).toBeGreaterThan(0.035);
    expect(icmReq).toBeGreaterThan(0.555);
    expect(icmReq).toBeLessThan(0.575);
    expect(equityVsRange("KsQd", push["6"].BTN)).toBeLessThan(icmReq);
  });

  it("ib03: chip lideri A7s ile ICM eşiğinin belirgin üzerinde (call); dar aralıkta fold", () => {
    const { chipReq, icmReq, h, F, W, L } = icmCall("ib03");
    const eq = equityVsRange("Ah7h", push["10"].BTN);
    expect(h.correct).toBe(1);
    expect(eq - icmReq).toBeGreaterThan(0.035);
    expect(icmReq - chipReq).toBeLessThan(0.05);
    expect(F).toBeGreaterThan(36);
    expect(F).toBeLessThan(36.6);
    expect(eq * W + (1 - eq) * L).toBeGreaterThan(F);
    // Gerekçedeki sınır: rakip yalnızca ~%17 ile (15 BB CO aralığı) itseydi fold
    expect(equityVsRange("Ah7h", push["15"].CO)).toBeLessThan(icmReq);
  });
  // CS-3 devamı (11): SB'den push/fold. BB yalnızca call/fold; BB'nin call aralığı nottaki varsayım.
  const RK = "23456789TJQKA";
  const expand = (spec: string): string[] => {
    const out: string[] = [];
    for (const raw of spec.split(",").map((x) => x.trim())) {
      const plus = raw.endsWith("+");
      const t = plus ? raw.slice(0, -1) : raw;
      if (t[0] === t[1]) {
        for (let k = RK.indexOf(t[0]); k <= (plus ? 12 : RK.indexOf(t[0])); k++) out.push(RK[k] + RK[k]);
        continue;
      }
      const kinds = t.length === 3 ? [t[2]] : ["s", "o"];
      for (let k = RK.indexOf(t[1]); k <= (plus ? RK.indexOf(t[0]) - 1 : RK.indexOf(t[1])); k++)
        for (const s of kinds) out.push(t[0] + RK[k] + s);
    }
    return out;
  };
  const icmPush = (id: string, callSpec: string) => {
    const h = HANDS.find((x) => x.id === id)!;
    const r = replay(h);
    const seats = (h.players ?? []) as (keyof typeof r.seats)[];
    const start = seats.map((s) => r.seats[s].start);
    const me = seats.indexOf("SB");
    const bb = seats.indexOf("BB");
    const ante = h.ante ?? 0;
    const risk = Math.min(start[me], start[bb]);
    const mk = (dh: number, db: number) => start.map((x, i) => (i === me ? x + dh : i === bb ? x + db : x));
    const P = [50, 30, 20];
    const ev = (st: number[]) => icm(st, P)[me];
    const F = ev(mk(-0.5, 0.5 + ante));
    const Steal = ev(mk(1 + ante, -1));
    const W = ev(mk(risk + ante, -risk));
    const L = ev(mk(-risk, risk + ante));
    const range = expand(callSpec);
    const hc = h.hero.match(/.{2}/g)!;
    const pc = range.flatMap(combos).filter((c) => !hc.includes(c.slice(0, 2)) && !hc.includes(c.slice(2))).length / 1225;
    const eq = equityVsRange(h.hero, range, 60000);
    const pushEV = (1 - pc) * Steal + pc * (eq * W + (1 - eq) * L);
    const need = ((F - (1 - pc) * Steal) / pc - L) / (W - L);
    const chipNeed = ((-0.5 - (1 - pc) * (1 + ante)) / pc + risk) / (2 * risk + ante);
    // BB'nin kendi ICM eşiği (BB'nin bakış açısından)
    const evB = (st: number[]) => icm(st, P)[bb];
    const bbNeed = (evB(mk(1 + ante, -1)) - evB(mk(risk + ante, -risk))) / (evB(mk(-risk, risk + ante)) - evB(mk(risk + ante, -risk)));
    return { h, F, pushEV, need, chipNeed, eq, pc, bbNeed };
  };

  it("ip01: 8 BB'lik SB, K6o ile bubble'da da all-in; BB geniş call etse de", () => {
    const a = icmPush("ip01", "22+, A2+, K2s+, K6o+, Q8s+, Q9o+, J9s+, JTo, T9s");
    expect(a.h.correct).toBe(1);
    expect(a.pc).toBeGreaterThan(0.33);
    expect(a.pc).toBeLessThan(0.37);
    expect(a.eq - a.need).toBeGreaterThan(0.035);
    expect(a.pushEV - a.F).toBeGreaterThan(0.8);
    expect(a.F).toBeCloseTo(10.15, 1);
    // Gerekçedeki iddia: BB'nin ICM eşiği (%44) chip eşiğinden (%41) yalnızca ~3 puan yüksek
    expect(a.bbNeed).toBeGreaterThan(0.435);
    expect(a.bbNeed).toBeLessThan(0.45);
    const wide = icmPush("ip01", "22+, A2+, K2+, Q3s+, Q7o+, J7s+, J9o+, T8s+, 98s");
    expect(wide.pc).toBeGreaterThan(0.41);
    expect(wide.eq - wide.need).toBeGreaterThan(0.035);
  });

  it("ip02: 12 BB'lik SB, KJo chip hesabıyla push, 4 BB'lik stack varken ICM ile fold", () => {
    const a = icmPush("ip02", "22+, A2+, K4s+, K6o+, Q8s+, QTo+, JTs");
    expect(a.h.correct).toBe(0);
    expect(a.eq).toBeGreaterThan(a.chipNeed + 0.035);
    expect(a.need - a.eq).toBeGreaterThan(0.035);
    expect(a.need).toBeGreaterThan(0.58);
    expect(a.need).toBeLessThan(0.6);
    expect(a.F).toBeCloseTo(20.6, 1);
    const wide = icmPush("ip02", "22+, A2+, K2s+, K6o+, Q7s+, Q9o+, J9s+, JTo, T9s");
    expect(wide.need - wide.eq).toBeGreaterThan(0.035);
  });

  it("ip03: chip lideri T9s ile all-in; BB'nin ICM eşiği ~%67, chip aralığıyla call etse de kârlı", () => {
    const a = icmPush("ip03", "JJ+");
    expect(a.h.correct).toBe(1);
    expect(a.bbNeed).toBeGreaterThan(0.66);
    expect(a.bbNeed).toBeLessThan(0.675);
    // Nottaki iddia: referans SB 15 BB aralığına karşı JJ eşiği geçer, TT geçmez
    expect(equityVsRange("JdJc", push["15"].SB)).toBeGreaterThan(a.bbNeed);
    expect(equityVsRange("TdTc", push["15"].SB)).toBeLessThan(a.bbNeed);
    expect(a.pushEV - a.F).toBeGreaterThan(0.7);
    const wide = icmPush("ip03", "22+, A2+, K9s+, KTo+, QTs+");
    expect(wide.pc).toBeGreaterThan(0.23);
    expect(wide.pc).toBeLessThan(0.27);
    expect(wide.eq).toBeGreaterThan(wide.need);
  });

  // 15. çalışma: 3-bet spotları. Aralıklar spotların note alanındaki varsayımlar (ekip tahmini, solver değil).
  describe("3-bet spotları (c07–c10, c12)", () => {
    const cash = ranges.cash as Record<string, string[]>;
    const P = "AKQJT98765432";
    const pairsFrom = (lo: string, hi = "A") => P.slice(P.indexOf(hi), P.indexOf(lo) + 1).split("").map((r) => r + r);
    const both = (...l: string[]) => l.flatMap((x) => [x + "s", x + "o"]);
    const btn3vsCO = [...pairsFrom("T"), ...both("AK", "AQ"), "AJs", "KQs", "A5s", "A4s", "KJs", "QJs", "JTs", "76s", "65s"];
    const btn3vsHJValue = [...pairsFrom("J"), ...both("AK", "AQ")];
    const btn3vsHJ = [...btn3vsHJValue, "A5s", "A4s", "KQs", "76s"];
    const btnFlat = [...pairsFrom("2", "J"), "ATs", "AJs", "KTs", "QTs", "J9s", "T9s", "98s", "87s", "AQo", "AJo", "KQo"];
    const hasNote = (id: string, ...parts: string[]) => {
      const n = HANDS.find((h) => h.id === id)!.note ?? "";
      for (const x of parts) expect(n, id).toContain(x);
    };

    it("aralık sayıları notlarla aynı (CO ≈ %27, 3-bet ≈ %7 ve ≈ %5)", () => {
      const n = (r: string[]) => r.flatMap(combos).length / 1326;
      expect(n(cash.CO)).toBeCloseTo(0.273, 2);
      expect(n(btn3vsCO)).toBeCloseTo(0.074, 2);
      expect(n(btn3vsHJ)).toBeCloseTo(0.054, 2);
      hasNote("c09", "TT+, AQ+, AJs, KQs", "A5s, A4s, KJs, QJs, JTs, 76s, 65s");
      hasNote("c10", "JJ+, AQ+", "A5s, A4s, KQs, 76s");
      hasNote("c12", "22–JJ, ATs, AJs, KTs, QTs, J9s, T9s, 98s, 87s, AQo, AJo ve KQo");
    });

    it("c07: AQs cutoff'un açılış aralığına karşı ≈ %61", () => {
      const eq = equityVsRange("AhQh", cash.CO);
      expect(eq).toBeGreaterThan(0.59);
      expect(eq).toBeLessThan(0.63);
    });

    it("c08: As blocker'ı AA'yı 6'dan 3'e, AK'yi 16'dan 12'ye indirir", () => {
      const live = (l: string) => combos(l).filter((c) => !c.includes("As") && !c.includes("5s")).length;
      expect(live("AA")).toBe(3);
      expect(live("AKs") + live("AKo")).toBe(12);
    });

    it("c09: QQ nottaki aralığa karşı ≈ %62; yalnızca KK+'ya karşı ≈ %18, gereken ≈ %31,4", () => {
      const eq = equityVsRange("QsQd", btn3vsCO);
      expect(eq).toBeGreaterThan(0.6);
      expect(eq).toBeLessThan(0.64);
      const vsKK = equityVsRange("QsQd", ["KK", "AA"]);
      expect(vsKK).toBeGreaterThan(0.16);
      expect(vsKK).toBeLessThan(0.2);
      expect(required("c09")).toBeCloseTo(5.5 / 17.5, 3);
      expect(vsKK).toBeLessThan(required("c09") - 0.1);
    });

    it("c10 (sınırda): AJo ≈ %34,5, gereken %31,4, gereken realization ≈ %91; value kısmına ≈ %26; geniş aralıkta ≈ %41", () => {
      const need = required("c10");
      expect(need).toBeCloseTo(5.5 / 17.5, 3);
      const eq = equityVsRange("AdJc", btn3vsHJ, 80000);
      expect(eq).toBeGreaterThan(0.33);
      expect(eq).toBeLessThan(0.36);
      expect(eq - need).toBeLessThan(0.035);
      expect(need / eq).toBeGreaterThan(0.89);
      expect(need / eq).toBeLessThan(0.93);
      const v = equityVsRange("AdJc", btn3vsHJValue);
      expect(v).toBeGreaterThan(0.24);
      expect(v).toBeLessThan(0.28);
      const wide = equityVsRange("AdJc", btn3vsCO);
      expect(wide).toBeGreaterThan(0.39);
      expect(wide).toBeLessThan(0.43);
    });

    it("c12: JJ cutoff'a ≈ %68, butonun call aralığına ≈ %74, üç yollu payı ≈ %52", () => {
      const a = equityVsRange("JhJs", cash.CO);
      expect(a).toBeGreaterThan(0.66);
      expect(a).toBeLessThan(0.7);
      const b = equityVsRange("JhJs", btnFlat);
      expect(b).toBeGreaterThan(0.72);
      expect(b).toBeLessThan(0.76);
      // Üç yollu: her iki rakipten birer kombinasyon, kart çakışması olursa yeniden çek.
      const h = cards("JhJs");
      const pool = (r: string[]) => r.flatMap(combos).map(cards).filter((v) => !v.some((c) => h.includes(c)));
      const [p1, p2] = [pool(cash.CO), pool(btnFlat)];
      let score = 0, n = 0;
      while (n < 40000) {
        const v1 = p1[Math.floor(rnd() * p1.length)], v2 = p2[Math.floor(rnd() * p2.length)];
        if (v2.some((c) => v1.includes(c))) continue;
        const used = new Set([...h, ...v1, ...v2]);
        const board: number[] = [];
        while (board.length < 5) {
          const c = Math.floor(rnd() * 52);
          if (!used.has(c)) { used.add(c); board.push(c); }
        }
        const s = [h, v1, v2].map((x) => evaluate7([...x, ...board]));
        const best = Math.max(...s);
        if (s[0] === best) score += 1 / s.filter((x) => x === best).length;
        n++;
      }
      expect(score / n).toBeGreaterThan(0.5);
      expect(score / n).toBeLessThan(0.54);
    });
  });
});

// Seçenek metnindeki all-in tutarı, replay'deki kahraman stack'iyle uyumlu olmalı
// (QA önerisi, docs/ekip/2026-11-11/01-spot-denetimi.md, D-2).
describe("seçeneklerdeki all-in tutarları", () => {
  it("'All-in (N BB)' yazan her seçenekte N, kalan stack'ten en fazla 1 BB farklı", () => {
    let checked = 0;
    for (const h of HANDS) {
      const r = replay(h);
      const seat = r.seats[h.heroPos];
      for (const o of h.options) {
        const m = o.match(/^All-in \(≈?(\d+(?:[.,]\d+)?) BB\)$/);
        if (!m) continue;
        const n = Number(m[1].replace(",", "."));
        const ok = Math.abs(n - seat.stack) <= 1 || Math.abs(n - (seat.stack + seat.bet)) <= 1;
        expect(ok, `${h.id}: seçenek ${n} BB, kalan stack ${seat.stack} BB (+ bu sokaktaki bahis ${seat.bet})`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3);
  });
});

// Q-6 (13. çalışma): c19 gerekçesi rakip kartları kapalıyken 8 / 44 yazıyordu.
// Gerekçedeki "N / 4x" oranının paydası görülmeyen kart sayısıyla aynı olmalı:
// rakip kartları kapalıysa flop'ta 47, turn'de 46; açıksa 45 ve 44.
describe("gerekçelerdeki out oranlarının paydası", () => {
  it("görülmeyen kart sayısıyla tutarlı", () => {
    const bad: string[] = [];
    let checked = 0;
    for (const h of HANDS)
      for (const m of h.reasoning.matchAll(/(\d+)\s*\/\s*(4[4-7])\b/g)) {
        checked++;
        const unseen = 52 - 2 - (h.villain ? 2 : 0) - (h.street === "turn" ? 4 : 3);
        if (+m[2] !== unseen) bad.push(`${h.id}: ${m[0]} (beklenen /${unseen})`);
      }
    expect(checked).toBeGreaterThan(50);
    expect(bad).toEqual([]);
  });
});

// Q-8 (14. çalışma): c27'de 2/3 pot seçeneği "≈6,5 BB" yazıyordu; 9,5 × 2/3 ≈ 6,33.
// "N/M pot bahis (≈X BB)" yazan her seçenekte X, replay potunun N/M'sine yazıldığı basamakta yuvarlanmış olmalı
// (tam sayıysa ±0,5, bir ondalıksa ±0,05).
describe("seçeneklerdeki pot kesri tutarları", () => {
  it("'1/3 pot bahis (≈1,8 BB)' gibi tutarlar replay potuyla tutarlı", () => {
    const bad: string[] = [];
    let checked = 0;
    for (const h of HANDS)
      for (const o of h.options) {
        const m = o.match(/^(\d)\/(\d) pot bahis \(≈(\d+(?:,\d+)?) BB\)$/);
        if (!m) continue;
        checked++;
        const exact = (replay(h).pot * +m[1]) / +m[2];
        const shown = parseFloat(m[3].replace(",", "."));
        const tol = m[3].includes(",") ? 0.05 : 0.5;
        if (Math.abs(shown - exact) > tol + 1e-9) bad.push(`${h.id}: ${o} (doğrusu ≈ ${exact.toFixed(2)})`);
      }
    expect(checked).toBeGreaterThanOrEqual(5);
    expect(bad).toEqual([]);
  });
});

// 13. çalışma: river value spotları (v-). Üreteçten bağımsız yeniden hesap: BB'nin her
// kombinasyonu için bahsin check'e göre farkı (call: B(2s−1), fold: P(1−s)). Geniş (çift ve
// üstü call) ve sıkı (üst çift, overpair ve üstü call) senaryoda işaret cevapla aynı olmalı,
// fark kombinasyon başına en az 0,07 × bahis.
describe("river value spotları", () => {
  const list = HANDS.filter((h) => h.id.startsWith("v-"));
  const R = "23456789TJQKA";
  const bbLabels = (ranges.cash as Record<string, string[]>).BTN.filter((l) => !["AA", "KK", "QQ", "AKs", "AKo"].includes(l));
  const combos: [number, number][] = [];
  for (const l of bbLabels) {
    const a = R.indexOf(l[0]);
    const b = R.indexOf(l[1]);
    for (let s1 = 0; s1 < 4; s1++)
      for (let s2 = 0; s2 < 4; s2++) {
        if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
        combos.push([a * 4 + s1, b * 4 + s2]);
      }
  }
  const cat = (v: number) => Math.floor(v / 16 ** 5);

  it("en az 50 spot, cevaplar iki tarafa dağılmış", () => {
    expect(list.length).toBeGreaterThanOrEqual(50);
    expect(list.filter((h) => h.correct === 1).length).toBeGreaterThanOrEqual(15);
    expect(list.filter((h) => h.correct === 0).length).toBeGreaterThanOrEqual(15);
  });

  it("karar iki call senaryosunda da kombinasyon sayımıyla aynı", () => {
    for (const h of list) {
      const r = replay(h);
      expect(r.pot, h.id).toBeCloseTo(5.5, 5);
      expect(r.toCall, h.id).toBe(0);
      expect(h.options[1]).toContain("1,8 BB");
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      expect(cat(evaluate7(board)), h.id).toBe(0);
      const hv = evaluate7([...hero, ...board]);
      expect(cat(hv), h.id).toBeGreaterThanOrEqual(1);
      const top = Math.max(...board.map((c) => c >> 2));
      for (const strict of [false, true]) {
        let d = 0;
        let n = 0;
        for (const [a, b] of combos) {
          if ([...hero, ...board].includes(a) || [...hero, ...board].includes(b)) continue;
          n++;
          const v = evaluate7([a, b, ...board]);
          const s = hv > v ? 1 : hv === v ? 0.5 : 0;
          const pairRank = Math.floor(v / 16 ** 4) % 16;
          const calls = strict ? cat(v) >= 2 || (cat(v) === 1 && pairRank >= top) : cat(v) >= 1;
          d += calls ? 1.8 * (2 * s - 1) : 5.5 * (1 - s);
        }
        const per = d / n / 1.8;
        expect(per > 0, `${h.id} ${strict ? "sıkı" : "geniş"}`).toBe(h.correct === 1);
        expect(Math.abs(per), h.id).toBeGreaterThanOrEqual(0.07);
      }
    }
  });
});

// 16. çalışma: river blöf spotları (bl-). Üreteçten bağımsız yeniden hesap. Kahramanın çifti yok;
// bahsin check'e göre farkı call eden elde B(2s−1), fold eden elde P(1−s). Üç call senaryosunda
// (temel: çift ve üstü; sıkı: üst çift, overpair ve üstü; geniş: çift ve üstü + elinde as olan her el)
// işaret cevapla aynı, fark kombinasyon başına en az 0,07 × bahis olmalı. Gerekçedeki oran
// (fold edip seni yenecek eller / call eden eller) temel senaryodan yeniden hesaplanır.
describe("river blöf spotları", () => {
  const list = HANDS.filter((h) => h.id.startsWith("bl-"));
  const R = "23456789TJQKA";
  const bbLabels = (ranges.cash as Record<string, string[]>).BTN.filter((l) => !["AA", "KK", "QQ", "AKs", "AKo"].includes(l));
  const combos: [number, number][] = [];
  for (const l of bbLabels) {
    const a = R.indexOf(l[0]);
    const b = R.indexOf(l[1]);
    for (let s1 = 0; s1 < 4; s1++)
      for (let s2 = 0; s2 < 4; s2++) {
        if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
        combos.push([a * 4 + s1, b * 4 + s2]);
      }
  }
  const cat = (v: number) => Math.floor(v / 16 ** 5);

  it("en az 50 spot, cevaplar iki tarafa dağılmış, konu blöf", () => {
    expect(list.length).toBeGreaterThanOrEqual(50);
    expect(list.filter((h) => h.correct === 1).length).toBeGreaterThanOrEqual(15);
    expect(list.filter((h) => h.correct === 0).length).toBeGreaterThanOrEqual(15);
    for (const h of list) expect(h.topic, h.id).toBe("blof");
  });

  it("karar üç call senaryosunda da kombinasyon sayımıyla aynı; gerekçedeki oran doğru", () => {
    for (const h of list) {
      const r = replay(h);
      expect(r.pot, h.id).toBeCloseTo(5.5, 5);
      expect(r.toCall, h.id).toBe(0);
      expect(h.options[1]).toContain("1,8 BB");
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      expect(cat(evaluate7(board)), h.id).toBe(0);
      const hv = evaluate7([...hero, ...board]);
      expect(cat(hv), h.id).toBe(0);
      const top = Math.max(...board.map((c) => c >> 2));
      for (const mode of ["base", "strict", "wide"] as const) {
        let d = 0;
        let n = 0;
        let callers = 0;
        let lose = 0;
        for (const [a, b] of combos) {
          if ([...hero, ...board].includes(a) || [...hero, ...board].includes(b)) continue;
          n++;
          const v = evaluate7([a, b, ...board]);
          const s = hv > v ? 1 : hv === v ? 0.5 : 0;
          const pairRank = Math.floor(v / 16 ** 4) % 16;
          const calls =
            mode === "strict" ? cat(v) >= 2 || (cat(v) === 1 && pairRank >= top)
            : mode === "wide" ? cat(v) >= 1 || a >> 2 === 12 || b >> 2 === 12
            : cat(v) >= 1;
          if (calls) {
            callers++;
            d += 1.8 * (2 * s - 1);
          } else {
            lose += 1 - s;
            d += 5.5 * (1 - s);
          }
        }
        const per = d / n / 1.8;
        expect(per > 0, `${h.id} ${mode}`).toBe(h.correct === 1);
        expect(Math.abs(per), `${h.id} ${mode}`).toBeGreaterThanOrEqual(0.07);
        if (mode === "base") {
          const shown = parseFloat(h.reasoning.match(/burada oran ≈ (\d+,\d+)/)![1].replace(",", "."));
          expect(Math.abs(shown - lose / callers), h.id).toBeLessThanOrEqual(0.006);
          expect(lose / callers > 1.8 / 5.5, h.id).toBe(h.correct === 1);
        }
      }
    }
  });

  // Blog: river-blof-mu-check-mi. Yazıdaki yüzdeler ve oranlar temel senaryodan yeniden hesaplanır.
  it("blog: river blöf yazısındaki örnek sayılar spotlarla aynı", () => {
    const post = POSTS.find((p) => p.slug === "river-blof-mu-check-mi")!;
    const text = post.body.map((b) => b.p).join(" ");
    const stats = (id: string) => {
      const h = HANDS.find((x) => x.id === id)!;
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      const hv = evaluate7([...hero, ...board]);
      let n = 0, callers = 0, lose = 0, win = 0;
      for (const [a, b] of combos) {
        if ([...hero, ...board].includes(a) || [...hero, ...board].includes(b)) continue;
        n++;
        const v = evaluate7([a, b, ...board]);
        const s = hv > v ? 1 : hv === v ? 0.5 : 0;
        if (cat(v) >= 1) callers++;
        else { lose += 1 - s; win += s; }
      }
      return { h, call: Math.round((100 * callers) / n), fold: Math.round((100 * (n - callers)) / n), lose: Math.round((100 * lose) / n), sd: Math.round((100 * win) / n), beatFold: Math.round((100 * win) / (n - callers)), ratio: lose / callers };
    };
    const j9 = stats("bl-Jh9d-4d8c6c2d5s");
    expect(j9.h.correct).toBe(1);
    expect([j9.call, j9.fold, j9.lose, j9.sd]).toEqual([56, 44, 40, 4]);
    expect(j9.ratio).toBeCloseTo(0.71, 2);
    const j4 = stats("bl-Jd4d-2cAc8s7dTs");
    expect(j4.h.correct).toBe(1);
    expect(j4.ratio).toBeCloseTo(0.38, 2);
    const k9 = stats("bl-Kd9c-5sQc2d4s3h");
    expect(k9.h.correct).toBe(0);
    expect([k9.call, k9.fold, k9.beatFold, k9.lose]).toEqual([73, 27, 75, 7]);
    expect(k9.ratio).toBeCloseTo(0.09, 2);
    const e6 = stats("bl-8c6c-TsQsKc5cJh");
    expect(e6.h.correct).toBe(0);
    expect(e6.call).toBe(98);
    expect(e6.ratio).toBeCloseTo(0.01, 2);
    for (const t of ["%56'sı", "%44'ü", "%40'ı", "%4'ünde", "≈ 0,71", "≈ 0,38", "%73'ü", "%27'si", "%75'i", "%7'si", "≈ 0,09", "%98'i", "≈ 0,01", "%24,7", "60 river spotu"])
      expect(text, t).toContain(t);
    expect(HANDS.filter((h) => h.id.startsWith("bl-")).length).toBe(60);
    expect((1.8 / 7.3) * 100).toBeCloseTo(24.7, 1);
  });
});

// 17. çalışma: BB'den açılışa 3-bet all-in ya da fold (r3-). Üreteçten bağımsız yeniden hesap.
// Açanın açılış aralığı ranges.json'dan; call aralıkları spotun kendi metninden (note: temel,
// gerekçe: sıkı ve geniş) geri açılır. Fold'a göre fark (chip EV, BB):
//   Δ = f × 4,5 + (1 − f) × [eq × (2S + 1,5) − (S − 1)]
// f kesin kombinasyon sayımı (kahramanın kartları çıkarılır), eq Monte Carlo (ayrı tohum).
// Üç senaryoda işaret cevapla aynı ve |Δ| ≥ 0,3 BB; gerekçedeki sayılar yeniden hesaba yakın olmalı.
describe("3-bet all-in spotları (r3-)", () => {
  const list = HANDS.filter((h) => h.id.startsWith("r3-"));
  const RK = "23456789TJQKA";
  const expand = (spec: string): string[] => {
    const out: string[] = [];
    for (const raw of spec.split(",").map((x) => x.trim())) {
      const plus = raw.endsWith("+");
      const t = plus ? raw.slice(0, -1) : raw;
      if (t[0] === t[1]) {
        for (let k = RK.indexOf(t[0]); k <= (plus ? 12 : RK.indexOf(t[0])); k++) out.push(RK[k] + RK[k]);
        continue;
      }
      const kinds = t.length === 3 ? [t[2]] : ["s", "o"];
      for (let k = RK.indexOf(t[1]); k <= (plus ? RK.indexOf(t[0]) - 1 : RK.indexOf(t[1])); k++)
        for (const s of kinds) out.push(t[0] + RK[k] + s);
    }
    return out;
  };
  const combosOf = (labels: string[]): [number, number][] => {
    const out: [number, number][] = [];
    for (const l of labels) {
      const a = RK.indexOf(l[0]);
      const b = RK.indexOf(l[1]);
      for (let s1 = 0; s1 < 4; s1++)
        for (let s2 = 0; s2 < 4; s2++) {
          if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
          out.push([a * 4 + s1, b * 4 + s2]);
        }
    }
    return out;
  };
  let seed = 31337;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const measure = (hero: number[], open: string[], call: string[], S: number, trials: number) => {
    const live = (c: [number, number][]) => c.filter(([x, y]) => !hero.includes(x) && !hero.includes(y));
    const callC = live(combosOf(call));
    const f = 1 - callC.length / live(combosOf(open)).length;
    let score = 0;
    for (let t = 0; t < trials; t++) {
      const v = callC[Math.floor(rnd() * callC.length)];
      const used = new Set([...hero, ...v]);
      const board: number[] = [];
      while (board.length < 5) {
        const c = Math.floor(rnd() * 52);
        if (!used.has(c)) {
          used.add(c);
          board.push(c);
        }
      }
      const a = evaluate7([...hero, ...board]);
      const b = evaluate7([...v, ...board]);
      score += a > b ? 1 : a === b ? 0.5 : 0;
    }
    const eq = score / trials;
    const called = eq * (2 * S + 1.5) - (S - 1);
    return { f, eq, called, delta: f * 4.5 + (1 - f) * called };
  };
  const dec = (s: string) => Number(s.replace("−", "-").replace(",", "."));

  it("en az 50 spot, cevaplar iki tarafa dağılmış, konu 3bet, durum doğru", () => {
    expect(list.length).toBeGreaterThanOrEqual(50);
    expect(list.filter((h) => h.correct === 1).length).toBeGreaterThanOrEqual(15);
    expect(list.filter((h) => h.correct === 0).length).toBeGreaterThanOrEqual(15);
    for (const h of list) {
      expect(h.topic, h.id).toBe("3bet");
      expect(h.heroPos).toBe("BB");
      const r = replay(h);
      expect(r.pot, h.id).toBeCloseTo(4.5, 5);
      expect(r.toCall, h.id).toBeCloseTo(1, 5);
      expect(r.next, h.id).toBe("BB");
      expect(h.options, h.id).toEqual(["Fold", `All-in (${h.stackBB} BB)`]);
    }
  });

  it("cevap üç call senaryosunda da yeniden hesapla aynı; gerekçedeki sayılar doğru", () => {
    const cash = ranges.cash as Record<string, string[]>;
    for (const h of list) {
      const opener = h.seq[0].split(" ")[0];
      const open = cash[opener];
      const S = h.stackBB;
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const base = expand(h.note!.match(/yeterli equity'si olan (.+?) ile call eder/)![1]);
      const [, narrowSpec, wideSpec] = h.reasoning.match(/yalnızca (.+?) ile call etse \(daha sıkı\) ya da (.+?) ile call etse \(daha geniş\)/)!;
      for (const spec of [base, expand(narrowSpec), expand(wideSpec)]) {
        for (const l of spec) expect(open, `${h.id}: ${l} açılış aralığında yok`).toContain(l);
        const m = measure(hero, open, spec, S, spec === base ? 60000 : 15000);
        expect(m.delta > 0, `${h.id} Δ=${m.delta.toFixed(2)}`).toBe(h.correct === 1);
        expect(Math.abs(m.delta), h.id).toBeGreaterThanOrEqual(0.3);
        if (spec === base) {
          const [, fP, eP] = h.reasoning.match(/yaklaşık %(\d+)'\S+ fold eder.*?yaklaşık %(\d+) equity/)!;
          expect(Math.abs(Number(fP) - 100 * m.f), h.id).toBeLessThanOrEqual(0.51);
          expect(Math.abs(Number(eP) - 100 * m.eq), h.id).toBeLessThanOrEqual(1.5); // yuvarlama 0,5 + iki Monte Carlo (≈ ±0,2 puan SE)
          const shownDelta = dec(h.reasoning.match(/\) ≈ (−?\d+(?:,\d)?) BB, yani/)![1]);
          expect(Math.abs(shownDelta - m.delta), h.id).toBeLessThanOrEqual(0.4);
        }
      }
    }
  }, 120000);

  // Blog: 3-bet-4-bet-ve-kisa-stack-all-in. Kısa stack örneklerindeki sayılar spotların (yukarıda yeniden
  // hesaplanan) gerekçeleriyle aynı olmalı; cash örnekleri c07–c12'nin testli gerekçeleriyle aynı olmalı.
  it("blog: 3-bet yazısındaki sayılar spotlarla aynı; T6s'de sıkı call senaryosu yeniden ölçülür", () => {
    const post = POSTS.find((p) => p.slug === "3-bet-4-bet-ve-kisa-stack-all-in")!;
    const text = post.body.map((b) => b.p).join(" ");
    const nums = (id: string) => {
      const h = HANDS.find((x) => x.id === id)!;
      const m = h.reasoning.match(/yaklaşık %(\d+)'\S+ fold eder.*?yaklaşık %(\d+) equity.*?≈ (−?\d+(?:,\d)?) BB getirir.*?\) ≈ (−?\d+(?:,\d)?) BB/)!;
      return { h, f: m[1], eq: m[2], called: m[3], delta: m[4] };
    };
    const k9 = nums("r3-BTN25-Kh9h");
    expect(k9.h.correct).toBe(1);
    expect([k9.f, k9.eq, k9.called, k9.delta]).toEqual(["71", "35", "−5,8", "1,5"]);
    const s77 = nums("r3-UTG20-7s7h");
    expect(s77.h.correct).toBe(1);
    expect([s77.f, s77.eq, s77.called, s77.delta]).toEqual(["39", "44", "−0,7", "1,3"]);
    const t6 = nums("r3-UTG20-Ts6s");
    expect(t6.h.correct).toBe(0);
    expect([t6.f, t6.eq, t6.called, t6.delta]).toEqual(["38", "32", "−5,6", "−1,7"]);
    for (const t of ["%71'inde", "%35 equity", "−5,8 BB", "0,71 × 4,5 + 0,29 × (−5,8) ≈ +1,5 BB", "%39'unda", "%44 alır", "−0,7 BB", "≈ +1,3 BB", "%38 fold", "%32 equity", "−5,6 BB", "≈ −1,7 BB", "+2,3 BB", "60 turnuva spotu"])
      expect(text, t).toContain(t);
    expect(list.length).toBe(60);
    // T6s: UTG yalnızca QQ+ ve AK ile call etseydi
    const m = measure(["Ts", "6s"].map(cardFromString), (ranges.cash as Record<string, string[]>).UTG, expand("QQ+, AKs, AKo"), 20, 60000);
    expect(Math.abs(m.delta - 2.3)).toBeLessThanOrEqual(0.15);
    // Cash örnekleri: yazıdaki sayılar spot gerekçelerinde de var (o sayılar "3-bet spotları" testinde ölçülüyor)
    const cashNums: [string, string[]][] = [
      ["c07", ["%61"]],
      ["c08", ["6'dan 3'e", "16'dan 12'ye"]],
      ["c09", ["%62", "%18"]],
      ["c10", ["%31,4", "%34,5", "%91"]],
      ["c12", ["%68", "%74", "%52", "%33"]],
    ];
    for (const [id, ts] of cashNums)
      for (const t of ts) {
        expect(HANDS.find((h) => h.id === id)!.reasoning, `${id} ${t}`).toContain(t);
        expect(text, `${id} ${t}`).toContain(t);
      }
  }, 60000);
});

// 18. çalışma: turn'de ikinci barrel ya da check (b2-). Üreteçten bağımsız yeniden hesap.
// BB'nin aralığı (buton açılışı − AA, KK, QQ, AK) spotun notundaki flop call kuralıyla daraltılır; her
// kombinasyon için kahramanın showdown payı 44 river kartının hepsi sayılarak bulunur. Bahsin check'e göre
// farkı call eden elde 6(2s − 1), fold eden elde 9,1(1 − s). Üç turn call senaryosunda işaret cevapla aynı ve
// fark kombinasyon başına en az 0,07 × 6 olmalı; gerekçedeki yüzdeler ve ortalama fark yeniden hesaplanır.
describe("turn ikinci barrel spotları (b2-)", () => {
  const list = HANDS.filter((h) => h.id.startsWith("b2-"));
  const RK = "23456789TJQKA";
  const bbLabels = (ranges.cash as Record<string, string[]>).BTN.filter((l) => !["AA", "KK", "QQ", "AKs", "AKo"].includes(l));
  const combos: [number, number][] = [];
  for (const l of bbLabels) {
    const a = RK.indexOf(l[0]);
    const b = RK.indexOf(l[1]);
    for (let s1 = 0; s1 < 4; s1++)
      for (let s2 = 0; s2 < 4; s2++) {
        if (l.length === 2 ? s2 <= s1 : l[2] === "s" ? s1 !== s2 : s1 === s2) continue;
        combos.push([a * 4 + s1, b * 4 + s2]);
      }
  }
  const cat = (v: number) => Math.floor(v / 16 ** 5);
  // Kent pencereleri: 5 ardışık rank ve A-2-3-4-5.
  const windows = [[12, 0, 1, 2, 3], ...Array.from({ length: 9 }, (_, i) => [i, i + 1, i + 2, i + 3, i + 4])];
  const hasStraight = (ranks: Set<number>) => windows.some((w) => w.every((r) => ranks.has(r)));
  /** Bu ele bir kart eklendiğinde kent yapan, ama board'a eklendiğinde yapmayan rank'lar. */
  const strOuts = (hole: number[], board: number[]) => {
    const all = new Set([...hole, ...board].map((c) => c >> 2));
    const bd = new Set(board.map((c) => c >> 2));
    if (hasStraight(all)) return 0;
    let k = 0;
    for (let r = 0; r < 13; r++) {
      if (all.has(r)) continue;
      if (hasStraight(new Set([...all, r])) && !hasStraight(new Set([...bd, r]))) k++;
    }
    return k;
  };
  const fd = (hole: number[], board: number[]) =>
    [0, 1, 2, 3].some((s) => hole.some((c) => (c & 3) === s) && [...hole, ...board].filter((c) => (c & 3) === s).length === 4);

  it("en az 50 spot, cevaplar iki tarafa dağılmış, konu c-bet, not kuralları içeriyor", () => {
    expect(list.length).toBeGreaterThanOrEqual(50);
    expect(list.filter((h) => h.correct === 1).length).toBeGreaterThanOrEqual(15);
    expect(list.filter((h) => h.correct === 0).length).toBeGreaterThanOrEqual(15);
    for (const h of list) {
      expect(h.topic, h.id).toBe("cbet");
      for (const t of ["AA, KK, QQ ve AK hariç", "gutshot dahil", "elinde as olan", "board'un üstünde iki kartı", "board'un ikinci büyük kartı ya da daha yüksek bir çift", "check-raise yapmaz", "river'da bahis olmaz"])
        expect(h.note, `${h.id} ${t}`).toContain(t);
    }
  });

  it("karar üç call senaryosunda da tam sayımla aynı; gerekçedeki sayılar doğru", () => {
    for (const h of list) {
      const r = replay(h);
      expect(r.pot, h.id).toBeCloseTo(9.1, 5);
      expect(r.toCall, h.id).toBe(0);
      expect(h.options[1]).toContain("6 BB");
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      const flop = board.slice(0, 3);
      expect(new Set(board.map((c) => c >> 2)).size, h.id).toBe(4);
      expect(cat(evaluate7([...hero, ...board])), h.id).toBe(0);
      const ranks = board.map((c) => c >> 2).sort((x, y) => y - x);
      const flopTop = Math.max(...flop.map((c) => c >> 2));
      const acc = { strict: [0, 0, 0, 0, 0], base: [0, 0, 0, 0, 0], wide: [0, 0, 0, 0, 0] }; // d, n, callers, callScore, foldLose
      for (const [a, b] of combos) {
        const used = [...hero, ...board];
        if (used.includes(a) || used.includes(b)) continue;
        const hole = [a, b];
        const flopCall =
          cat(evaluate7([...hole, ...flop])) >= 1 || fd(hole, flop) || strOuts(hole, flop) >= 1 ||
          a >> 2 === 12 || b >> 2 === 12 || (a >> 2 > flopTop && b >> 2 > flopTop);
        if (!flopCall) continue;
        let s = 0;
        let k = 0;
        for (let c = 0; c < 52; c++) {
          if (used.includes(c) || c === a || c === b) continue;
          const hv = evaluate7([...hero, ...board, c]);
          const vv = evaluate7([...hole, ...board, c]);
          s += hv > vv ? 1 : hv === vv ? 0.5 : 0;
          k++;
        }
        expect(k).toBe(44);
        s /= k;
        const v = evaluate7([...hole, ...board]);
        const pr = Math.floor(v / 16 ** 4) % 16;
        const always = cat(v) >= 2 || fd(hole, board) || strOuts(hole, board) >= 2;
        const calls = {
          strict: always || (cat(v) === 1 && pr >= ranks[0]),
          base: always || (cat(v) === 1 && pr >= ranks[1]),
          wide: always || cat(v) === 1 || strOuts(hole, board) >= 1,
        };
        for (const m of ["strict", "base", "wide"] as const) {
          const x = acc[m];
          x[1]++;
          if (calls[m]) {
            x[0] += 6 * (2 * s - 1);
            x[2]++;
            x[3] += s;
          } else {
            x[0] += 9.1 * (1 - s);
            x[4] += 1 - s;
          }
        }
      }
      for (const m of ["strict", "base", "wide"] as const) {
        const per = acc[m][0] / acc[m][1] / 6;
        expect(per > 0, `${h.id} ${m}`).toBe(h.correct === 1);
        expect(Math.abs(per), `${h.id} ${m}`).toBeGreaterThanOrEqual(0.07);
      }
      const [d, n, callers, callScore, foldLose] = acc.base;
      const m = h.reasoning.match(/Yaklaşık %(\d+)'\S+ 6 BB'ye call eder; onlara karşı payın yaklaşık %(\d+)\./)!;
      const w = h.reasoning.match(/Yaklaşık %(\d+)'\S+ fold eder ama check'te/)!;
      const net = h.reasoning.match(/ortalama ≈ (\d+(?:,\d+)?) BB (ekler|kaybettirir)/)!;
      expect(Math.abs(Number(m[1]) - (100 * callers) / n), h.id).toBeLessThanOrEqual(0.6);
      expect(Math.abs(Number(m[2]) - (100 * callScore) / callers), h.id).toBeLessThanOrEqual(0.6);
      expect(Math.abs(Number(w[1]) - (100 * foldLose) / n), h.id).toBeLessThanOrEqual(0.6);
      expect(net[2], h.id).toBe(h.correct === 1 ? "ekler" : "kaybettirir");
      expect(Math.abs(parseFloat(net[1].replace(",", ".")) - Math.abs(d / n)), h.id).toBeLessThanOrEqual(0.06);
    }
  }, 120000);
});

// 18. çalışma: turn-ikinci-barrel yazısı. Yazıdaki örnek sayılar spot gerekçelerinde de geçmeli
// (gerekçeler yukarıda tam sayımla denetleniyor); başabaş fold sıklığı yeniden hesaplanır.
describe("blog: turn-ikinci-barrel", () => {
  it("örnek sayılar spotlarla aynı, başabaş %39,7", () => {
    const post = POSTS.find((p) => p.slug === "turn-ikinci-barrel")!;
    const text = post.body.map((b) => `${b.h ?? ""} ${b.p}`).join("\n");
    expect((6 / (9.1 + 6)) * 100).toBeCloseTo(39.7, 1);
    expect(text).toContain("%39,7");
    expect(text).toContain("60 turn spotu");
    expect(HANDS.filter((h) => h.id.startsWith("b2-")).length).toBe(60);
    const hi = HANDS.filter((h) => h.id.startsWith("b2-") && /[AK]/.test(h.board!.replace(/[shdc]/g, "")));
    expect(hi.filter((h) => h.correct === 0).length).toBe(24);
    expect(hi.filter((h) => h.correct === 1).length).toBe(8);
    expect(text).toContain("30 check cevabının 24'ünü, 30 bahis cevabının ise yalnızca 8'ini");
    const ex: Record<string, string[]> = {
      "b2-QdJs-7s3c6s2d": ["%30'u", "%17", "6 × (1 − 2 × 0,17) ≈ 4 BB", "%45'i", "≈ 4,1 − 1,2", "≈ 3 BB ekler"],
      "b2-9s7s-Ac2d3d4c": ["%97'si", "%3", "0,03 × 9,1 − 0,97 × 5,2 ≈ 0,3 − 5", "≈ 4,7 BB kaybettirir"],
      "b2-As5s-Ks7h4h3s": ["%61'i", "%43", "6 × (1 − 2 × 0,43) ≈ 0,8 BB", "%21'i", "0,21 × 9,1 − 0,61 × 0,8 ≈ 1,9 − 0,5", "≈ 1,4 BB ekler"],
    };
    for (const [id, nums] of Object.entries(ex)) {
      const h = HANDS.find((x) => x.id === id)!;
      expect(h.correct, id).toBe(id === "b2-9s7s-Ac2d3d4c" ? 0 : 1);
      for (const t of nums) {
        expect(h.reasoning, `${id} ${t}`).toContain(t);
        expect(text, `${id} ${t}`).toContain(t);
      }
    }
  });
});
