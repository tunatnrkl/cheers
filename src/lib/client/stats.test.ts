import { describe, expect, it } from "vitest";
import { firstVsRepeat, MIN_SAMPLE, positionStats, weeklyTrend, wilson, type StatAttempt } from "./stats";

const NOW = new Date("2026-11-11T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const many = (n: number, ok: number, handId: string, at: string): StatAttempt[] =>
  Array.from({ length: n }, (_, i) => ({ handId, correct: i < ok, at }));

describe("weeklyTrend", () => {
  it("kayan 7 günlük pencerelere böler, en eski başta", () => {
    const a = [...many(12, 9, "c01", daysAgo(1)), ...many(3, 1, "c01", daysAgo(8)), ...many(10, 5, "c01", daysAgo(20))];
    const w = weeklyTrend(a, NOW, 4);
    expect(w.map((b) => b.weeksAgo)).toEqual([3, 2, 1, 0]);
    expect(w[3]).toMatchObject({ ok: 9, total: 12, rate: 0.75 });
    expect(w[2]).toMatchObject({ ok: 1, total: 3, rate: null }); // az veri
    expect(w[1]).toMatchObject({ ok: 5, total: 10, rate: 0.5 });
    expect(w[0]).toMatchObject({ total: 0, rate: null });
  });

  it("pencere sınırı: tam 7 gün önce bir önceki pencereye düşer", () => {
    const w = weeklyTrend([{ handId: "c01", correct: true, at: daysAgo(7) }], NOW, 2);
    expect(w[0].total).toBe(1);
    expect(w[1].total).toBe(0);
  });

  it("gelecek tarihli, geçersiz ve pencere dışı kayıtlar sayılmaz", () => {
    const w = weeklyTrend(
      [
        { handId: "c01", correct: true, at: daysAgo(-1) },
        { handId: "c01", correct: true, at: "geçersiz" },
        { handId: "c01", correct: true, at: daysAgo(100) },
      ],
      NOW,
      8,
    );
    expect(w.reduce((s, b) => s + b.total, 0)).toBe(0);
  });
});

describe("positionStats", () => {
  it("masa sırasıyla, yalnızca cevap olan pozisyonlar; bilinmeyen el atlanır", () => {
    const a = [...many(10, 7, "c05", daysAgo(1)), ...many(2, 2, "c01", daysAgo(1)), ...many(5, 5, "yok-boyle-el", daysAgo(1))];
    const s = positionStats(a);
    expect(s.map((p) => p.pos)).toEqual(["UTG", "BB"]);
    expect(s[0]).toMatchObject({ pos: "UTG", total: 2, rate: null });
    expect(s[1]).toMatchObject({ pos: "BB", ok: 7, total: 10, rate: 0.7 });
  });

  it("oyun tipine göre süzer", () => {
    const a = [...many(3, 3, "c02", daysAgo(1)), ...many(4, 1, "t24", daysAgo(1))]; // ikisi de BTN
    expect(positionStats(a, "cash")).toMatchObject([{ pos: "BTN", total: 3 }]);
    expect(positionStats(a, "turnuva")).toMatchObject([{ pos: "BTN", total: 4, ok: 1 }]);
  });
});

describe("firstVsRepeat", () => {
  it("bir elin ilk cevabı 'ilk görüş', sonrakiler 'tekrar'; sıra tarihe göre", () => {
    const a: StatAttempt[] = [
      { handId: "c01", correct: true, at: daysAgo(1) }, // tekrar
      { handId: "c01", correct: false, at: daysAgo(3) }, // ilk
      { handId: "c02", correct: true, at: daysAgo(2) }, // ilk
    ];
    const r = firstVsRepeat(a);
    expect(r.first).toMatchObject({ ok: 1, total: 2 });
    expect(r.repeat).toMatchObject({ ok: 1, total: 1 });
  });
});

describe("wilson", () => {
  it("bilinen değerler", () => {
    const [lo, hi] = wilson(7, 10);
    expect(lo).toBeCloseTo(0.3968, 3);
    expect(hi).toBeCloseTo(0.8922, 3);
    expect(wilson(0, 0)).toEqual([0, 1]);
    const [lo2, hi2] = wilson(10, 10);
    expect(hi2).toBe(1);
    expect(lo2).toBeGreaterThan(0.69);
  });

  it("MIN_SAMPLE'da aralık hâlâ geniş: oran tek başına sunulmamalı", () => {
    const [lo, hi] = wilson(MIN_SAMPLE / 2, MIN_SAMPLE);
    expect(hi - lo).toBeGreaterThan(0.5);
  });
});
