import { describe, expect, it } from "vitest";
import { QUIZZES, QUIZ_BY_SLUG } from "./quizzes";
import { HANDS } from "./hands";
import { POST_BY_SLUG } from "./blog";
import { pctSuffixProblem } from "@/lib/trSuffix";
import { cardFromString, evaluate7 } from "@/lib/poker/evaluator";
import { requiredEquity, bluffBreakEven, icm } from "@/lib/poker/math";
import { replay } from "@/lib/poker/replay";
import ranges from "./ranges.json";

const texts = QUIZZES.flatMap((z) => [
  [z.slug, z.title],
  [z.slug, z.summary],
  [z.slug, z.assumptions],
  ...z.questions.flatMap((q, i) => [q.q, q.why, ...q.options].map((t) => [`${z.slug}#${i + 1}`, t])),
]);
const question = (slug: string, n: number) => QUIZ_BY_SLUG.get(slug)!.questions[n - 1];
const answer = (slug: string, n: number) => {
  const q = question(slug, n);
  return q.options[q.correct];
};

describe("quiz yapısı", () => {
  it("kimlikler tekil, her quiz 5–10 soru", () => {
    expect(new Set(QUIZZES.map((z) => z.slug)).size).toBe(QUIZZES.length);
    for (const z of QUIZZES) {
      expect(z.questions.length, z.slug).toBeGreaterThanOrEqual(5);
      expect(z.questions.length, z.slug).toBeLessThanOrEqual(10);
    }
  });

  it("doğru cevap seçeneklerin içinde, seçenekler tekil, gerekçe boş değil", () => {
    for (const z of QUIZZES)
      z.questions.forEach((q, i) => {
        expect(q.correct, `${z.slug}#${i + 1}`).toBeGreaterThanOrEqual(0);
        expect(q.correct, `${z.slug}#${i + 1}`).toBeLessThan(q.options.length);
        expect(new Set(q.options).size, `${z.slug}#${i + 1}`).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.why.length).toBeGreaterThan(20);
      });
  });

  it("bağlanan spotlar ve yazılar var", () => {
    for (const z of QUIZZES) {
      for (const s of z.posts) expect(POST_BY_SLUG.has(s), `${z.slug} → ${s}`).toBe(true);
      for (const q of z.questions)
        if (q.spot) {
          const h = HANDS.find((x) => x.id === q.spot);
          expect(h, `${z.slug} → ${q.spot}`).toBeDefined();
        }
    }
  });

  it("doğru cevap her zaman aynı sırada değil (ezber önleme)", () => {
    for (const z of QUIZZES) expect(new Set(z.questions.map((q) => q.correct)).size, z.slug).toBeGreaterThan(1);
  });
});

describe("quiz metinleri", () => {
  it("ondalık ayırıcı virgül", () => {
    const bad = texts.flatMap(([id, t]) => (t.match(/\S*\d\.\d\S*/g) ?? []).filter((m) => !/^\d{1,3}\.\d{3}/.test(m)).map((m) => `${id}: ${m}`));
    expect(bad).toEqual([]);
  });

  it("yüzdeye gelen ek okunuşa uyuyor", () => {
    const bad: string[] = [];
    let checked = 0;
    for (const [id, t] of texts)
      for (const m of t.matchAll(/%(\d+(?:,\d+)?)'(\p{L}+)/gu)) {
        checked++;
        const why = pctSuffixProblem(m[1], m[2]);
        if (why) bad.push(`${id}: ${m[0]} (${why})`);
      }
    expect(checked).toBeGreaterThan(5);
    expect(bad).toEqual([]);
  });

  it("parasal kazanç vaadi yok", () => {
    const bad = texts.filter(([, t]) => /garanti|kesin kazan|para kazan|zengin/i.test(t));
    expect(bad).toEqual([]);
  });
});

describe("blind savunması quiz'i: hesaplar", () => {
  it("fiyat soruları (1–4)", () => {
    expect(requiredEquity(4, 1.5)).toBeCloseTo(0.273, 3);
    expect(answer("blind-savunmasi", 1)).toBe("%27");
    expect(requiredEquity(3.5, 1)).toBeCloseTo(0.222, 3);
    expect(answer("blind-savunmasi", 2)).toBe("%22");
    expect(requiredEquity(6.5, 1.5)).toBeCloseTo(0.1875, 4);
    expect(answer("blind-savunmasi", 3)).toBe("%19");
    expect(requiredEquity(2.2 + 0.5 + 1 + 1, 1.2)).toBeCloseTo(0.203, 3);
    expect(answer("blind-savunmasi", 4)).toBe("%20");
  });

  it("t25 ve c36 spotları quiz'deki fiyatla aynı", () => {
    const t25 = replay(HANDS.find((h) => h.id === "t25")!);
    expect(t25.toCall / (t25.pot + t25.toCall)).toBeCloseTo(0.203, 3);
    const c36 = replay(HANDS.find((h) => h.id === "c36")!);
    expect(c36.toCall / (c36.pot + c36.toCall)).toBeCloseTo(0.1875, 4);
  });
});

// Equity soruları: ranges.json'daki yaklaşık aralıklara karşı Monte Carlo (sabit tohum).
describe("blind savunması quiz'i: equity iddiaları", () => {
  const S = "shdc";
  const combos = (l: string): string[] => {
    const out: string[] = [];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        if (l.length === 2 ? j <= i : l[2] === "s" ? i !== j : i === j) continue;
        out.push(l[0] + S[i] + l[1] + S[j]);
      }
    return out;
  };
  const cards = (s: string) => (s.match(/.{2}/g) ?? []).map(cardFromString);
  let seed = 31337;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const eqVs = (hero: string, range: string[], trials = 60000) => {
    const h = cards(hero);
    const vs = range.flatMap(combos).map(cards).filter((v) => !h.includes(v[0]) && !h.includes(v[1]));
    let score = 0;
    for (let t = 0; t < trials; t++) {
      const v = vs[Math.floor(rnd() * vs.length)];
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
  const cash = ranges.cash as Record<string, string[]>;
  const need = requiredEquity(4, 1.5);

  it("5: 72o butona karşı ~%29,5, eşiğin az üstünde; gereken realization ~%92", () => {
    const eq = eqVs("7d2c", cash.BTN);
    expect(eq).toBeGreaterThan(0.28);
    expect(eq).toBeLessThan(0.305);
    expect(eq).toBeGreaterThan(need);
    expect(need / eq).toBeGreaterThan(0.905);
    expect(need / eq).toBeLessThan(0.94);
    // 3 BB'lik açılışta (c34) eşiğin altında
    expect(eq).toBeLessThan(2 / 6.5);
  });

  it("6: T8s ~%41, gereken realization ~%66", () => {
    const eq = eqVs("Th8h", cash.BTN);
    expect(eq).toBeGreaterThan(0.395);
    expect(eq).toBeLessThan(0.425);
    expect(answer("blind-savunmasi", 6)).toBe("%66");
    expect(Math.abs(need / eq - 0.66)).toBeLessThan(0.025);
  });

  it("7: K4o butona karşı ~%41, gereken ~%20", () => {
    const eq = eqVs("Kd4c", cash.BTN);
    expect(eq).toBeGreaterThan(0.395);
    expect(eq).toBeLessThan(0.43);
    expect(answer("blind-savunmasi", 7)).toBe("Call");
  });

  it("8: J4o UTG'ye karşı ~%29, butona karşı belirgin daha iyi", () => {
    const utg = eqVs("Jd4c", cash.UTG);
    expect(utg).toBeGreaterThan(0.28);
    expect(utg).toBeLessThan(0.30);
    // c35 gerekçesi: equity'nin yaklaşık %94'ünü kullanması gerekir (Q-4)
    expect(need / utg).toBeGreaterThan(0.92);
    expect(need / utg).toBeLessThan(0.965);
    expect(eqVs("Jd4c", cash.BTN) - utg).toBeGreaterThan(0.03);
  });
});

describe("SPR ve value quiz'i: hesaplar", () => {
  it("SPR soruları (1–3)", () => {
    expect(97.5 / 5.5).toBeCloseTo(17.7, 1);
    expect(answer("spr-ve-value", 1)).toBe("18");
    expect(91 / 19.5).toBeCloseTo(4.67, 2);
    expect(answer("spr-ve-value", 2)).toBe("4,7");
    expect(78 / 45.5).toBeCloseTo(1.71, 2);
  });

  it("4: flop'ta set ya da daha iyisi ≈ %11,8 (kesin)", () => {
    const C3 = (n: number) => (n * (n - 1) * (n - 2)) / 6;
    expect(C3(48)).toBe(17296);
    expect(C3(50)).toBe(19600);
    expect(1 - C3(48) / C3(50)).toBeCloseTo(0.1176, 4);
    expect((1 - 0.1176) / 0.1176).toBeCloseTo(7.5, 1);
  });

  it("5: kısa stack'li UTG'ye karşı kazanç/call oranı 7,2 < 7,5 (c38 ile aynı)", () => {
    const c38 = replay(HANDS.find((h) => h.id === "c38")!);
    expect(c38.pot).toBeCloseTo(4.5, 5);
    expect((17 + 4.5) / 3).toBeCloseTo(7.17, 2);
    expect((17 + 4.5) / 3).toBeLessThan(7.5);
  });

  it("7: pot büyüklüğünde bahiste blöf oranı 1/3", () => {
    const pot = 10;
    const bet = 10;
    expect(bet / (pot + 2 * bet)).toBeCloseTo(1 / 3, 6);
    expect(bluffBreakEven(pot, bet)).toBeCloseTo(0.5, 6); // blöfün kendi başabaşı ayrı bir sayı
    expect(answer("spr-ve-value", 7)).toBe("%33");
  });
});

describe("bubble call/fold quiz'i: ib01 sayıları", () => {
  const h = HANDS.find((x) => x.id === "ib01")!;
  const r = replay(h);
  const seats = (h.players ?? []) as (keyof typeof r.seats)[];
  const vil = seats.find((s) => r.seats[s].allin)!;
  const me = seats.indexOf(h.heroPos);
  const hs = r.seats[h.heroPos].stack;
  const after = (hero: number, v: number) => seats.map((s) => (s === h.heroPos ? hero : s === vil ? v : r.seats[s].stack));
  const P = [50, 30, 20];
  const F = icm(after(hs, r.pot), P)[me];
  const W = icm(after(hs + r.pot, 0), P)[me];
  const L = icm(after(hs - r.toCall, r.pot + r.toCall), P)[me];

  it("2: call sonrası pot 21,5 BB, call 9 BB, chip eşiği ≈ %41,9", () => {
    expect(r.toCall).toBeCloseTo(9, 5);
    expect(r.pot + r.toCall).toBeCloseTo(21.5, 5);
    expect(answer("bubble-call-fold", 2)).toBe("%42");
  });

  it("3: fold %16,4, kazanç %31,9, kayıp 0 → eşik ≈ %51,5", () => {
    expect(F).toBeCloseTo(16.4, 1);
    expect(W).toBeCloseTo(31.9, 1);
    expect(L).toBeCloseTo(0, 5);
    expect((F - L) / (W - L)).toBeCloseTo(0.515, 2);
    expect(answer("bubble-call-fold", 3)).toBe("%51,5");
  });
});
