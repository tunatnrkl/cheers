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

describe("üretilen ellerin cevapları", () => {
  // Pot odds spotları (o-…): rakibin kartları görünmez; cevap, notta "Varsayım:" diye yazılan
  // turn all-in aralığına karşı equity ile fiyatın karşılaştırmasıdır. Bu denetim aralığı
  // üreticinin kodundan değil NOT METNİNDEN kurar ve equity'yi tam sayımla yeniden hesaplar.
  // Aralıklar yaklaşık varsayımdır, solver çıktısı değildir.
  it("pot odds elleri: nottaki aralığa karşı tam sayımla karar doğru ve eşiğe en az 3,5 puan uzak", () => {
    const list = HANDS.filter((h) => h.id.startsWith("o-"));
    expect(list.length).toBe(70);
    const ORDER = "23456789TJQKA";
    const rankOf = (c: number) => c >> 2;
    const isStraight = (ranks: Set<number>) => {
      for (let hi = 4; hi <= 12; hi++) if ([0, 1, 2, 3, 4].every((k) => ranks.has(hi - k))) return true;
      return [12, 0, 1, 2, 3].every((r) => ranks.has(r));
    };
    // Kenti tamamlayan farklı değer sayısı (board'un tek başına tamamladıkları sayılmaz)
    const straightRanks = (hole: number[], board: number[]) => {
      const all = new Set([...hole, ...board].map(rankOf));
      if (isStraight(all)) return 0;
      const onlyBoard = new Set(board.map(rankOf));
      let n = 0;
      for (let r = 0; r < 13; r++) if (isStraight(new Set([...all, r])) && !isStraight(new Set([...onlyBoard, r]))) n++;
      return n;
    };
    const hasFlushDraw = (hole: number[], board: number[]) =>
      [0, 1, 2, 3].some((s) => hole.some((c) => (c & 3) === s) && [...hole, ...board].filter((c) => (c & 3) === s).length === 4);
    const label = (a: number, b: number) => {
      const [hi, lo] = rankOf(a) >= rankOf(b) ? [a, b] : [b, a];
      const x = ORDER[rankOf(hi)] + ORDER[rankOf(lo)];
      return rankOf(hi) === rankOf(lo) ? x : x + ((hi & 3) === (lo & 3) ? "s" : "o");
    };
    const btnOpen = new Set((ranges.cash as Record<string, string[]>).BTN);
    const bad: string[] = [];
    let calls = 0;
    for (const h of list) {
      const note = h.note ?? "";
      expect(note, h.id).toContain("Varsayım:");
      const pos = note.match(/^Pot odds alıştırması: (BTN|BB) turn'de all-in yaptı/)?.[1];
      expect(pos, h.id).toBe(h.heroPos === "BB" ? "BTN" : "BB");
      const m = note.match(/(?:üst çift|ikinci çift) \((10|[2-9JQKA])\) ve daha iyi her el|: (10|[2-9JQKA]) tutan eller ve daha iyi her el/);
      expect(m, `${h.id}: hazır el eşiği notta yok`).not.toBeNull();
      const floorRank = ORDER.indexOf((m![1] ?? m![2]).replace("10", "T"));
      const minStraight = /iki uçlu kent çekişleri/.test(note) ? 2 : /kent çekişleri \(içten çekişler dahil\)/.test(note) ? 1 : 99;
      const withFlush = /floş çekişleri/.test(note);
      const preflop = /açılış aralığındaki ellerden/.test(note);
      expect(preflop, h.id).toBe(pos === "BTN");

      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const board = h.board!.match(/.{2}/g)!.map(cardFromString);
      expect(board.some((c) => rankOf(c) === floorRank), `${h.id}: eşik değeri board'da yok`).toBe(true);
      const free = [...Array(52).keys()].filter((c) => !board.includes(c));
      // Eşik: nottaki değerde bir kart tutan en zayıf el
      let floor = Infinity;
      for (const c of free) if (rankOf(c) === floorRank) for (const d of free) if (d !== c) floor = Math.min(floor, evaluate7([c, d, ...board]));

      let score = 0;
      let n = 0;
      let combos = 0;
      for (let i = 0; i < free.length; i++)
        for (let j = i + 1; j < free.length; j++) {
          const v = [free[i], free[j]];
          if (hero.includes(v[0]) || hero.includes(v[1])) continue;
          if (preflop && !btnOpen.has(label(v[0], v[1]))) continue;
          const inRange = evaluate7([...v, ...board]) >= floor || (withFlush && hasFlushDraw(v, board)) || straightRanks(v, board) >= minStraight;
          if (!inRange) continue;
          combos++;
          for (const c of free) {
            if (hero.includes(c) || v.includes(c)) continue;
            const a = evaluate7([...hero, ...board, c]);
            const b = evaluate7([...v, ...board, c]);
            score += a > b ? 1 : a === b ? 0.5 : 0;
            n++;
          }
        }
      expect(n, h.id).toBe(combos * 44);
      const eq = score / n;
      const r = replay(h);
      const req = r.toCall / (r.pot + r.toCall);
      if (h.correct === 1) calls++;
      if ((h.correct === 1) !== eq > req || Math.abs(eq - req) < 0.035)
        bad.push(`${h.id}: gereken ${(req * 100).toFixed(1)}, aralığa karşı ${(eq * 100).toFixed(1)}, cevap ${h.options[h.correct]}`);
      // Gerekçedeki yuvarlanmış sayılar bu ölçümle tutmalı; başlık out sayısı vermemeli
      expect(h.reasoning, h.id).toContain(`gereken equity %${Math.round(req * 100)}.`);
      expect(h.reasoning, h.id).toContain(`equity'n yaklaşık %${Math.round(eq * 100)} (`);
      expect(h.reasoning, h.id).toContain(`aralıkta ${combos} kombinasyon`);
      expect(h.title, h.id).not.toMatch(/\d/);
    }
    expect(bad, bad.join("; ")).toEqual([]);
    // Tek yöne yığılmış bir set fiyat hesabını öğretmez
    expect(calls).toBeGreaterThanOrEqual(25);
    expect(list.length - calls).toBeGreaterThanOrEqual(25);
  }, 30000);

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
