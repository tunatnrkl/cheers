import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { replay } from "./replay";

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
});

// Üretilen ellerin cevaplarını bağımsız olarak yeniden doğrular.
import { cardFromString, evaluate7 } from "./evaluator";
import ranges from "@/data/ranges.json";

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
