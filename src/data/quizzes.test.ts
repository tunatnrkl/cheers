import { describe, expect, it } from "vitest";
import { QUIZZES, QUIZ_BY_SLUG } from "./quizzes";
import { HANDS } from "./hands";
import { POST_BY_SLUG } from "./blog";
import { pctSuffixProblem } from "@/lib/trSuffix";
import { cardFromString, evaluate7 } from "@/lib/poker/evaluator";
import { requiredEquity, bluffBreakEven, icm, outsProbability } from "@/lib/poker/math";
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

  // 19. çalışma: bd- spotlarına bağlı sorular ve blog'daki "gereken oran" bölümü
  it("9: A7o HJ'ye karşı ~%42,5; %70 realization'da eşiğin üstünde, gereken oran ~%64", () => {
    const eq = eqVs("Ac7h", cash.HJ);
    expect(Math.abs(eq - 0.425)).toBeLessThan(0.006);
    expect(eq * 0.7).toBeGreaterThan(need);
    expect(Math.abs(0.7 * 42.5 - 29.75)).toBeLessThan(0.01); // metinde ≈ %29,7
    expect(Math.round((100 * need) / 0.425)).toBe(64);
    expect(answer("blind-savunmasi", 9)).toMatch(/^0,7 × 42,5 ≈ %29,7/);
    const spot = HANDS.find((h) => h.id === question("blind-savunmasi", 9).spot)!;
    expect(spot.correct).toBe(1);
    expect(spot.reasoning).toContain("%42,5");
    expect(spot.reasoning).toContain("%29,7");
  });

  it("10: 83s CO'nun 3 BB açılışına karşı ~%32,9; gereken oran ~%93, 2,5 BB'de ~%83", () => {
    const eq = eqVs("8s3s", cash.CO);
    expect(Math.abs(eq - 0.329)).toBeLessThan(0.006);
    const need3 = requiredEquity(4.5, 2);
    expect(need3).toBeCloseTo(2 / 6.5, 10);
    expect(eq * 0.9).toBeLessThan(need3);
    expect(answer("blind-savunmasi", 10)).toBe("%93");
    expect(Math.abs((100 * need3) / eq - 93.5)).toBeLessThan(1.5);
    expect(Math.abs((100 * need) / eq - 83)).toBeLessThan(1.5);
    const spot = HANDS.find((h) => h.id === question("blind-savunmasi", 10).spot)!;
    expect(spot.correct).toBe(0);
    for (const t of ["%30,8", "%32,9", "%93'ünü", "%29,6"]) expect(spot.reasoning, t).toContain(t);
  });

  it("blog: blind savunması yazısındaki gereken oran örnekleri spotlarla ve sorularla aynı", () => {
    const post = POST_BY_SLUG.get("blind-savunmasi-fiyat-aralik-pozisyon")!;
    const text = post.body.map((b) => b.p).join(" ");
    for (const t of ["27,3 / 42,5 ≈ %64", "≈ %29,7", "30,8 / 32,9 ≈ %93", "≈ %29,6", "yaklaşık %83'ünü", "60 BB savunması spotu"])
      expect(text, t).toContain(t);
    expect(HANDS.filter((h) => h.id.startsWith("bd-")).length).toBe(60);
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

// 20. çalışma: sp- spotlarına bağlı SPR soruları
describe("SPR ve value quiz'i: sp- spotları (8–9)", () => {
  it("8: 12 BB, 10 BB all-in → 10 / 25,5 ≈ %39,2; spot call ve aynı sayıları kullanıyor", () => {
    expect(10 / 25.5).toBeCloseTo(0.392, 3);
    expect(answer("spr-ve-value", 8)).toBe("%39");
    const h = HANDS.find((x) => x.id === question("spr-ve-value", 8).spot)!;
    expect(h.stackBB).toBe(12);
    expect(h.correct).toBe(1);
    expect(replay(h).pot).toBeCloseTo(15.5, 5);
    for (const t of ["%39,2", "%70,1", "üst çift"]) expect(h.reasoning, t).toContain(t);
  });

  it("9: 40 BB, 38 BB all-in → 38 / 81,5 ≈ %46,6; spot fold, geniş komşuda ≈ %39,8", () => {
    expect(38 / 81.5).toBeCloseTo(0.466, 3);
    expect(answer("spr-ve-value", 9)).toMatch(/^≈ %46,6/);
    const h = HANDS.find((x) => x.id === question("spr-ve-value", 9).spot)!;
    expect(h.stackBB).toBe(40);
    expect(h.correct).toBe(0);
    for (const t of ["%46,6", "%10 equity", "≈ %39,8"]) expect(h.reasoning, t).toContain(t);
    expect(h.note).toContain("overpair, iki çift ve üstü ile all-in");
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

describe("pot odds quiz'i: hesaplar", () => {
  const Z = "pot-odds-ve-cekisler";
  const spot = (id: string) => replay(HANDS.find((h) => h.id === id)!);
  const cards = (s: string) => (s.match(/.{2}/g) ?? []).map(cardFromString);
  /** Hero'nun rakibi river'da geçtiği kart sayısı ve görülmeyen kart sayısı. */
  const riverOuts = (hero: string, board: string, villain: string, villainKnown: boolean) => {
    const h = cards(hero);
    const b = cards(board);
    const v = cards(villain);
    const used = new Set([...h, ...b, ...v]);
    let outs = 0;
    for (let c = 0; c < 52; c++) {
      if (used.has(c)) continue;
      if (evaluate7([...h, ...b, c]) > evaluate7([...v, ...b, c])) outs++;
    }
    return { outs, unseen: 52 - h.length - b.length - (villainKnown ? v.length : 0) };
  };

  it("1: c17 fiyatı 3,7 / 12,9 ≈ %28,7; yaygın hatalar %40 ve %67", () => {
    const r = spot("c17");
    expect(r.pot).toBeCloseTo(9.2, 5);
    expect(r.toCall).toBeCloseTo(3.7, 5);
    expect(requiredEquity(r.pot, r.toCall)).toBeCloseTo(0.287, 3);
    expect(answer(Z, 1)).toBe("%29");
    expect(3.7 / 9.2).toBeCloseTo(0.402, 3);
    expect(3.7 / 5.5).toBeCloseTo(0.673, 3);
  });

  it("2: 9 out, flop'tan turn'e 9/47 ≈ %19,1; river'a kadar ≈ %35,0", () => {
    const p = outsProbability(9, "flop");
    expect(p.nextCard).toBeCloseTo(0.191, 3);
    expect(p.byRiver).toBeCloseTo(0.350, 3);
    expect(p.nextCard).toBeLessThan(requiredEquity(9.2, 3.7));
  });

  it("3: c18 gutshot 4/46 ≈ %8,7, gereken %33,3; başabaş için ≈ 102 BB ek kazanç, geride ≈ 72 BB", () => {
    const r = spot("c18");
    expect(r.toCall).toBeCloseTo(12, 5);
    expect(r.pot).toBeCloseTo(24, 5);
    const need = requiredEquity(r.pot, r.toCall);
    expect(need).toBeCloseTo(1 / 3, 4);
    const p = 4 / 46;
    expect(r.toCall / p - (r.pot + r.toCall)).toBeCloseTo(102, 0);
    const behind = r.seats.BB.stack - r.toCall;
    expect(behind).toBeCloseTo(72.25, 2);
    expect(behind).toBeLessThan(102);
    // Gutshot gerçekten 4 out: tek pair'e (A) karşı yalnızca 9'lar kazanıyor
    const h = HANDS.find((x) => x.id === "c18")!;
    expect(riverOuts(h.hero, h.board!, "AhQs", false).outs).toBe(4);
  });

  it("4: c19 (Q-6) 8/46 ≈ %17,4 > gereken 4/24 ≈ %16,7, fark 1 puandan az", () => {
    const r = spot("c19");
    expect(r.pot).toBeCloseTo(20, 5);
    expect(r.toCall).toBeCloseTo(4, 5);
    const need = requiredEquity(r.pot, r.toCall);
    const h = HANDS.find((x) => x.id === "c19")!;
    const { outs, unseen } = riverOuts(h.hero, h.board!, "KhQs", false);
    expect(outs).toBe(8);
    expect(unseen).toBe(46);
    expect(outs / unseen).toBeCloseTo(0.174, 3);
    expect(outs / unseen - need).toBeGreaterThan(0);
    expect(outs / unseen - need).toBeLessThan(0.01);
    expect(answer(Z, 4)).toBe("8 / 46 ≈ %17,4");
    expect(h.reasoning).toContain("8 / 46");
    expect(h.reasoning).not.toContain("8 / 44");
    expect(r.seats.BTN.stack).toBeCloseTo(72.25, 2);
  });

  it("5: açık kartlı all-in spotu 9 out / 44, gereken ≈ %43,2", () => {
    const h = HANDS.find((x) => x.id === "o-QhKc-6cAh7hJc")!;
    const r = replay(h);
    const { outs, unseen } = riverOuts(h.hero, h.board!, h.villain!.cards, true);
    expect(unseen).toBe(44);
    expect(outs).toBe(9);
    expect(requiredEquity(r.pot, r.toCall)).toBeCloseTo(0.432, 3);
    expect(answer(Z, 5)).toBe("44");
    expect(h.correct).toBe(0);
  });

  it("6: 15 out, iki kart ≈ %54,1; 4 kuralı %60", () => {
    const p = outsProbability(15, "flop");
    expect(p.byRiver).toBeCloseTo(0.541, 3);
    expect(p.rule).toBeCloseTo(0.6, 6);
    expect(answer(Z, 6)).toBe("%54");
    expect(outsProbability(9, "flop").rule).toBeCloseTo(0.36, 6);
  });

  it("7: c13 derin stack (200 BB), set ≈ %11,8", () => {
    const h = HANDS.find((x) => x.id === "c13")!;
    expect(h.note).toContain("200 BB");
    expect(h.correct).toBe(1);
    const C3 = (n: number) => (n * (n - 1) * (n - 2)) / 6;
    expect(1 - C3(48) / C3(50)).toBeCloseTo(0.118, 3);
  });

  it("8: yarım pot %25, pot kadar %33, üçte bir pot %20", () => {
    expect(requiredEquity(15, 5)).toBeCloseTo(0.25, 6);
    expect(requiredEquity(20, 10)).toBeCloseTo(1 / 3, 6);
    expect(requiredEquity(10 + 10 / 3, 10 / 3)).toBeCloseTo(0.2, 6);
    expect(answer(Z, 8)).toBe("%25");
  });
});

// 14. çalışma: c-bet quiz'i. Fiyatlar ve potlar replay'den; out'lar evaluator ile kart kart sayılır.
describe("quiz: c-bet-ve-barrel", () => {
  const Z = "c-bet-ve-barrel";
  const spot = (id: string) => replay(HANDS.find((h) => h.id === id)!);
  const cards = (s: string) => (s.match(/.{2}/g) ?? []).map(cardFromString);
  const category = (v: number) => Math.floor(v / 16 ** 5);

  it("blog yazısının 'Quiz ile tekrarla' düğmesi bu quiz'i açar; bağlı spotlar cbet ya da blof konulu", () => {
    expect(QUIZZES.find((z) => z.posts[0] === "c-bet-ne-zaman")?.slug).toBe(Z);
    for (const q of QUIZ_BY_SLUG.get(Z)!.questions)
      if (q.spot) expect(["cbet", "blof"]).toContain(HANDS.find((h) => h.id === q.spot)!.topic);
  });

  it("1–2: c15 pot 5,5; 1/3 pot blöf başabaşı %25, call edenin gereken equity'si %20; pot kadar %50", () => {
    const r = spot("c15");
    expect(r.pot).toBeCloseTo(5.5, 5);
    expect(r.next).toBe("BTN");
    const bet = r.pot / 3;
    expect(bet).toBeCloseTo(1.83, 2);
    expect(bluffBreakEven(r.pot, bet)).toBeCloseTo(0.25, 6);
    expect(requiredEquity(r.pot + bet, bet)).toBeCloseTo(0.2, 6);
    expect(bluffBreakEven(r.pot, r.pot)).toBeCloseTo(0.5, 6);
    expect(requiredEquity(r.pot + r.pot, r.pot)).toBeCloseTo(1 / 3, 6);
    expect(requiredEquity(r.pot + (2 * r.pot) / 3, (2 * r.pot) / 3)).toBeCloseTo(0.286, 3);
    expect(answer(Z, 1)).toBe("%25");
    expect(answer(Z, 2)).toBe("%20");
    // c15'in doğru cevabı küçük c-bet, board quiz'deki kuru board
    const h = HANDS.find((x) => x.id === "c15")!;
    expect(h.options[h.correct]).toMatch(/^1\/3 pot/);
    expect(h.board).toBe("Ks7d2c");
    expect(answer(Z, 3)).toBe("K-7-2, üç farklı renk");
  });

  it("4: iki rakip, her biri %35: en az biri ≈ %57,8; c29'da check doğru", () => {
    expect(1 - 0.65 ** 2).toBeCloseTo(0.5775, 4);
    expect(answer(Z, 4)).toBe("%58");
    const h = HANDS.find((x) => x.id === "c29")!;
    expect(h.board).toBe("8s7s6d");
    expect(h.options[h.correct]).toBe("Check");
    expect(spot("c29").entries.filter((e) => e.kind === "act" && e.act === "call")).toHaveLength(2);
  });

  it("5: c27 AhJh, Ts6d2cKs: river'da yalnızca 4 dam kent yaptırır, 4/46 ≈ %8,7", () => {
    const h = HANDS.find((x) => x.id === "c27")!;
    expect(h.hero).toBe("AhJh");
    expect(h.board).toBe("Ts6d2cKs");
    const hero = cards(h.hero), board = cards(h.board!);
    const used = new Set([...hero, ...board]);
    let straightOrBetter = 0, unseen = 0;
    const improvers: string[] = [];
    for (let c = 0; c < 52; c++) {
      if (used.has(c)) continue;
      unseen++;
      if (category(evaluate7([...hero, ...board, c])) >= 4) {
        straightOrBetter++;
        improvers.push("23456789TJQKA"[c >> 2]);
      }
    }
    expect(unseen).toBe(46);
    expect(straightOrBetter).toBe(4);
    expect(new Set(improvers)).toEqual(new Set(["Q"]));
    expect(straightOrBetter / unseen).toBeCloseTo(0.087, 3);
    expect(answer(Z, 5)).toBe("4 / 46 ≈ %8,7");
  });

  it("6: c27 pot 9,5; 2/3 pot ≈ 6,33 → blöf başabaşı %40, call eden %28,6; seçenek metni ≈6,3", () => {
    const r = spot("c27");
    expect(r.pot).toBeCloseTo(9.5, 5);
    const bet = (2 * r.pot) / 3;
    expect(bet).toBeCloseTo(6.33, 2);
    expect(bluffBreakEven(r.pot, bet)).toBeCloseTo(0.4, 6);
    expect(requiredEquity(r.pot + bet, bet)).toBeCloseTo(0.286, 3);
    expect(answer(Z, 6)).toBe("%40");
    expect(HANDS.find((x) => x.id === "c27")!.options[1]).toBe("2/3 pot bahis (≈6,3 BB)");
  });

  it("7: t15 SPR ≈ 3,3; 1/3 flop + 2/3 turn sonrası river'da geride ≈ 10,06 BB, pot ≈ 21,39 (≈ %47)", () => {
    const r = spot("t15");
    expect(r.pot).toBeCloseTo(5.5, 5);
    let behind = r.seats.BTN.stack;
    expect(behind).toBeCloseTo(18, 5);
    expect(r.seats.BB.stack).toBeCloseTo(18, 5);
    expect(behind / r.pot).toBeCloseTo(3.27, 2);
    let pot = r.pot;
    const f = pot / 3;
    pot += 2 * f;
    behind -= f;
    expect(pot).toBeCloseTo(9.17, 2);
    expect(behind).toBeCloseTo(16.17, 2);
    const t = (2 * pot) / 3;
    pot += 2 * t;
    behind -= t;
    expect(t).toBeCloseTo(6.11, 2);
    expect(pot).toBeCloseTo(21.39, 2);
    expect(behind).toBeCloseTo(10.06, 2);
    expect(behind / pot).toBeCloseTo(0.47, 2);
    expect(answer(Z, 7)).toContain("≈10 BB");
  });

  it("8: c28 pot 9, 2/3 pot = 6 BB → %40; doğru cevap check; gutshot (T) gerçekten 4 kart", () => {
    const r = spot("c28");
    expect(r.pot).toBeCloseTo(9, 5);
    expect(bluffBreakEven(r.pot, 6)).toBeCloseTo(0.4, 6);
    expect(bluffBreakEven(r.pot, 9)).toBeCloseTo(0.5, 6);
    const h = HANDS.find((x) => x.id === "c28")!;
    expect(h.options[h.correct]).toBe("Check");
    expect(h.note).toMatch(/fold etmeyen/);
    const hero = cards(h.hero), board = cards(h.board!);
    const used = new Set([...hero, ...board]);
    let st = 0;
    for (let c = 0; c < 52; c++) if (!used.has(c) && category(evaluate7([...hero, ...board, c])) >= 4) st++;
    expect(st).toBe(4);
    expect(answer(Z, 8)).toMatch(/^%40 fold gerekir/);
  });

  // 9–10: turn ikinci barrel spotları (b2-). Spotların sayıları hands.test.ts'te tam sayımla yeniden
  // hesaplanıyor; burada soru metnindeki sayıların spot gerekçesindekilerle aynı olduğu denetlenir.
  it("9–10: b2 spotlarının cevabı ve sayıları quiz'le aynı; yazı quiz'e bağlı", () => {
    expect(QUIZ_BY_SLUG.get(Z)!.posts).toContain("turn-ikinci-barrel");
    expect(POST_BY_SLUG.has("turn-ikinci-barrel")).toBe(true);
    const cases = [
      { n: 9, id: "b2-QdJs-7s3c6s2d", bet: true, nums: ["%30'u", "%45'i", "%17", "0,17) ≈ 4 BB", "4,1", "≈ 3 BB ekler"] },
      { n: 10, id: "b2-9s7s-Ac2d3d4c", bet: false, nums: ["%97'si", "%3", "0,03 × 9,1 − 0,97 × 5,2 ≈ 0,3 − 5", "≈ 4,7 BB kaybettirir"] },
    ];
    for (const c of cases) {
      const q = question(Z, c.n);
      const h = HANDS.find((x) => x.id === c.id)!;
      expect(q.spot).toBe(c.id);
      expect(h.correct, c.id).toBe(c.bet ? 1 : 0);
      expect(answer(Z, c.n).startsWith(c.bet ? "Bahis" : "Check"), c.id).toBe(true);
      expect(spot(c.id).pot).toBeCloseTo(9.1, 5);
      for (const t of c.nums) {
        expect(h.reasoning, `${c.id} ${t}`).toContain(t);
        expect(q.q + " " + q.why, `${c.id} ${t}`).toContain(t);
      }
    }
  });
});

describe("quiz: 3-bet-ve-squeeze", () => {
  const Z = "3-bet-ve-squeeze";
  const at = (heroPos: "CO" | "BB" | "HJ", seq: string[]) => {
    const r = replay({ heroPos, stackBB: 100, seq });
    expect(r.errors).toEqual([]);
    expect(r.next).toBe(heroPos);
    return r;
  };
  const S = "shdc";
  const combos = (l: string) => {
    const out: string[] = [];
    if (l.length === 2) { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(l[0] + S[i] + l[1] + S[j]); }
    else if (l[2] === "s") { for (let i = 0; i < 4; i++) out.push(l[0] + S[i] + l[1] + S[i]); }
    else { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) out.push(l[0] + S[i] + l[1] + S[j]); }
    return out;
  };

  it("bağlı spotlar 3bet konulu; quiz 3-bet yazısının düğmesinden (pozisyon yazısından da) açılır", () => {
    for (const q of QUIZ_BY_SLUG.get(Z)!.questions) if (q.spot) expect(HANDS.find((h) => h.id === q.spot)!.topic).toBe("3bet");
    expect(QUIZZES.find((z) => z.posts[0] === "3-bet-4-bet-ve-kisa-stack-all-in")?.slug).toBe(Z);
    // Blog sayfası önce posts[0], sonra posts içinde arar; pozisyon yazısını başka quiz posts[0] olarak almıyor.
    expect(QUIZZES.find((z) => z.posts[0] === "pozisyon-neden-onemli")).toBeUndefined();
    expect(QUIZZES.find((z) => z.posts.includes("pozisyon-neden-onemli"))?.slug).toBe(Z);
  });

  it("1: 2,5 açılışa 7,5 3-bet → cutoff 5 / 16,5 ≈ %30,3; yaygın hatalar %43 ve %67", () => {
    const r = at("CO", ["CO r2.5", "BTN r7.5", "SB f", "BB f"]);
    expect(r.pot).toBeCloseTo(11.5, 5);
    expect(r.toCall).toBeCloseTo(5, 5);
    expect(requiredEquity(r.pot, r.toCall)).toBeCloseTo(0.303, 3);
    expect(r.toCall / r.pot).toBeCloseTo(0.435, 3);
    expect(r.toCall / 7.5).toBeCloseTo(0.667, 3);
    expect(answer(Z, 1)).toBe("%30");
  });

  it("2: maça as + maça beşli → 3 AA, 12 AK (c08 gerekçesiyle aynı)", () => {
    const live = (l: string) => combos(l).filter((c) => !c.includes("As") && !c.includes("5s")).length;
    expect(live("AA")).toBe(3);
    expect(live("AKs") + live("AKo")).toBe(12);
    expect(answer(Z, 2)).toBe("3 AA, 12 AK");
    expect(HANDS.find((h) => h.id === "c08")!.reasoning).toContain("6'dan 3'e, AK'yi 16'dan 12'ye");
  });

  it("4–5: c09 ve c10 fiyatı 5,5 / 17,5 ≈ %31,4; c10 gereken realization ≈ %91; sayılar spot gerekçeleriyle aynı", () => {
    for (const id of ["c09", "c10"]) {
      const r = replay(HANDS.find((h) => h.id === id)!);
      expect(requiredEquity(r.pot, r.toCall)).toBeCloseTo(5.5 / 17.5, 6);
    }
    expect(5.5 / 17.5 / 0.345).toBeCloseTo(0.91, 2);
    expect(answer(Z, 5)).toBe("≈ %91");
    const c09 = HANDS.find((h) => h.id === "c09")!, c10 = HANDS.find((h) => h.id === "c10")!;
    expect(c09.reasoning).toContain("%62");
    expect(c09.reasoning).toContain("%18");
    expect(c09.options[c09.correct]).toMatch(/^4-bet/);
    expect(c10.reasoning).toContain("%34,5");
    expect(c10.reasoning).toContain("%91");
    expect(c10.options[c10.correct]).toBe("Fold");
  });

  it("6: c12 pot 6,5; 13 BB saf blöf squeeze'i 12 / 18,5 ≈ %64,9 fold ister", () => {
    const r = replay(HANDS.find((h) => h.id === "c12")!);
    expect(r.pot).toBeCloseTo(6.5, 5);
    expect(bluffBreakEven(r.pot, 13 - 1)).toBeCloseTo(0.649, 3);
    expect(answer(Z, 6)).toBe("%65");
  });

  it("7: squeeze 9 BB → cutoff 6,5 / 21 ≈ %31; 13 BB → 10,5 / 29 ≈ %36,2", () => {
    const a = at("CO", ["CO r2.5", "BTN c", "SB f", "BB r9"]);
    expect(a.pot).toBeCloseTo(14.5, 5);
    expect(requiredEquity(a.pot, a.toCall)).toBeCloseTo(0.31, 2);
    const b = at("CO", ["CO r2.5", "BTN c", "SB f", "BB r13"]);
    expect(b.pot).toBeCloseTo(18.5, 5);
    expect(requiredEquity(b.pot, b.toCall)).toBeCloseTo(0.362, 3);
    expect(a.toCall / a.pot).toBeCloseTo(0.45, 2);
    expect(b.toCall / b.pot).toBeCloseTo(0.57, 2);
    expect(answer(Z, 7)).toBe("9 BB'de ≈ %31, 13 BB'de ≈ %36");
  });
});
