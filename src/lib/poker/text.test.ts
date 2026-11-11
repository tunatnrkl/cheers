import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { pctSuffixProblem, pctWithSuffix } from "@/lib/trSuffix";
import { POSTS } from "@/data/blog";
import { cardFromString, evaluate7 } from "./evaluator";
import { replay } from "./replay";
import ranges from "@/data/ranges.json";

// Kullanıcıya görünen spot metinleri: ondalık virgül (CS-5), doğru Türkçe ekler (CS-4).
const visible = (h: (typeof HANDS)[number]) => [h.title, h.note ?? "", h.reasoning, ...h.options];

describe("spot metinleri", () => {
  it("görünen metinde ondalık ayırıcı virgül", () => {
    const bad = HANDS.flatMap((h) => visible(h).flatMap((t) => (t.match(/\S*\d\.\d\S*/g) ?? []).map((m) => `${h.id}: ${m}`)));
    expect(bad).toEqual([]);
  });

  it("pozisyon kısaltmalarında ilgi hâli okunuşa uygun", () => {
    const bad = HANDS.flatMap((h) => visible(h).flatMap((t) => (t.match(/\b(SB'un|CO'un|BTN'un|SB'ın|HJ'in)\b/g) ?? []).map((m) => `${h.id}: ${m}`)));
    expect(bad).toEqual([]);
  });

  it("üretilen metinlerde yüzdeye gelen ek sayının okunuşuna uyuyor", () => {
    const kinds = { "": "i", nd: "inde", yl: "iyle" } as const;
    const bad: string[] = [];
    for (const h of HANDS.filter((h) => /^(r-|p\d|s\d)/.test(h.id)))
      for (const t of visible(h))
        for (const m of t.matchAll(/%(\d+)'(s?[ıiuü])(nd[ae]|yl[ae])?/g)) {
          const kind = kinds[(m[3]?.slice(0, 2) ?? "") as keyof typeof kinds];
          if (m[0] !== pctWithSuffix(Number(m[1]), kind)) bad.push(`${h.id}: ${m[0]}`);
        }
    expect(bad).toEqual([]);
  });

  it("bütün spotlarda ve blogda yüzdeye gelen ek okunuşa uyuyor (Y-1)", () => {
    const texts = [...HANDS.flatMap((h) => visible(h).map((t) => [h.id, t])), ...POSTS.map((p) => [p.slug, JSON.stringify(p)])];
    const bad: string[] = [];
    let checked = 0;
    for (const [id, t] of texts)
      for (const m of t.matchAll(/%(\d+(?:,\d+)?)'(\p{L}+)/gu)) {
        checked++;
        const why = pctSuffixProblem(m[1], m[2]);
        if (why) bad.push(`${id}: ${m[0]} (${why})`);
      }
    expect(checked).toBeGreaterThan(400);
    expect(bad).toEqual([]);
  });

  it("ek denetleyicisi: örnek vakalar", () => {
    for (const [n, s] of [["19", "a"], ["19", "dur"], ["27,3", "lük"], ["34", "e"], ["40", "ın"], ["50", "nin"], ["6", "sı"], ["90", "ından"], ["74", "lük"], ["86", "ya"], ["43", "te"], ["30", "da"], ["12", "sinde"]])
      expect(pctSuffixProblem(n, s), `%${n}'${s}`).toBeNull();
    for (const [n, s] of [["12", "inde"], ["54", "iyle"], ["0", "inde"], ["40", "sı"], ["43", "de"], ["30", "ta"], ["19", "e"], ["27,3", "lik"], ["6", "ı"]])
      expect(pctSuffixProblem(n, s), `%${n}'${s}`).not.toBeNull();
  });

  it("ek yardımcısı: örnek vakalar", () => {
    expect(pctWithSuffix(54, "iyle")).toBe("%54'üyle");
    expect(pctWithSuffix(12, "inde")).toBe("%12'sinde");
    expect(pctWithSuffix(40, "inde")).toBe("%40'ında");
    expect(pctWithSuffix(30, "inde")).toBe("%30'unda");
    expect(pctWithSuffix(6, "i")).toBe("%6'sı");
    expect(pctWithSuffix(100, "i")).toBe("%100'ü");
    expect(pctWithSuffix(68, "iyle")).toBe("%68'iyle");
  });
});

// CS-2: üreticinin 3,5 puan kuralı, örnekleme hatasından bağımsız tekrar ölçülür.
// Rakip aralığı ranges.json'daki push aralığı (yaklaşık, solver çıktısı değil); ICM yok.
describe("all-in'e karşı call spotları (callshove)", () => {
  const S = "shdc";
  const combos = (l: string): number[][] => {
    const out: number[][] = [];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        if (l.length === 2 ? j <= i : l[2] === "s" ? i !== j : i === j) continue;
        out.push([cardFromString(l[0] + S[i]), cardFromString(l[1] + S[j])]);
      }
    return out;
  };
  let seed = 9090;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const equity = (hero: number[], range: string[], trials: number) => {
    const live = range.flatMap(combos).filter(([a, b]) => !hero.includes(a) && !hero.includes(b));
    let score = 0;
    const deck: number[] = [];
    for (let t = 0; t < trials; t++) {
      const v = live[Math.floor(rnd() * live.length)];
      deck.length = 0;
      for (let c = 0; c < 52; c++) if (!hero.includes(c) && !v.includes(c)) deck.push(c);
      for (let i = 0; i < 5; i++) {
        const j = i + Math.floor(rnd() * (deck.length - i));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      const b = deck.slice(0, 5);
      const x = evaluate7([...hero, ...b]);
      const y = evaluate7([...v, ...b]);
      score += x > y ? 1 : x === y ? 0.5 : 0;
    }
    return score / trials;
  };
  const list = HANDS.filter((h) => h.topic === "callshove" && /^s\d/.test(h.id));

  it("cevap doğru ve eşiğe en az 3 puan uzak (20.000 deneme, ±0,35 puan)", () => {
    expect(list.length).toBeGreaterThanOrEqual(100);
    const bad: string[] = [];
    for (const h of list) {
      const [, bb, pos] = h.id.match(/^s(\d+)-(\w+)-/)!;
      const r = replay(h);
      const req = r.toCall / (r.pot + r.toCall);
      const hero = h.hero.match(/.{2}/g)!.map(cardFromString);
      const eq = equity(hero, (ranges.push as Record<string, Record<string, string[]>>)[bb][pos], 20000);
      if (eq > req !== (h.correct === 1) || Math.abs(eq - req) < 0.03) bad.push(`${h.id}: gereken ${(req * 100).toFixed(1)}, ölçülen ${(eq * 100).toFixed(1)}`);
    }
    expect(bad).toEqual([]);
  }, 30000);

  it("CS-2'de sınırda kalan spotlar listede yok", () => {
    for (const id of ["s6-SB-85o", "s10-CO-A4s"]) expect(HANDS.some((h) => h.id === id), id).toBe(false);
  });

  it("aralığa duyarlı spotların gerekçesi bunu söylüyor (CS-1)", () => {
    const sensitive = ["s6-SB-94o", "s6-SB-93o", "s6-SB-84o", "s10-SB-K7o", "s10-SB-J3s", "s10-SB-J2s", "s10-BTN-A3o", "s15-BTN-A7s", "s15-BTN-KQo", "s15-BTN-QTo", "s10-CO-A7s", "s10-CO-A5s", "s15-CO-ATs"];
    for (const id of sensitive) expect(HANDS.find((h) => h.id === id)?.reasoning, id).toMatch(/rakibin aralığı belirliyor/);
  });
});
