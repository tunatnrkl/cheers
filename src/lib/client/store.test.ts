import { describe, expect, it } from "vitest";
import { addToTotals, statsFromCounts, topicStats, weakTopics, type Totals } from "./store";

// G-2: konu tablosu üyede sunucu toplamlarından gelir; listeden hesapla aynı sonucu vermeli.
describe("konu toplamları", () => {
  const list = [
    { topic: "acilis" as const, correct: true },
    { topic: "acilis" as const, correct: false },
    { topic: "acilis" as const, correct: false },
    { topic: "value" as const, correct: true },
  ];

  it("statsFromCounts listeden hesaplanan tabloyla aynı", () => {
    const fromCounts = statsFromCounts([
      { topic: "value", total: 1, ok: 1 },
      { topic: "acilis", total: 3, ok: 1 },
    ]);
    expect(fromCounts).toEqual(topicStats(list));
    expect(fromCounts[0].topic).toBe("acilis"); // en zayıf başta
    expect(weakTopics(fromCounts).map((s) => s.topic)).toEqual(["acilis"]);
  });

  it("sıfır cevaplı konu tabloya girmez (bölme hatası yok)", () => {
    expect(statsFromCounts([{ topic: "value", total: 0, ok: 0 }])).toEqual([]);
  });

  it("addToTotals genel ve konu toplamını birlikte artırır", () => {
    let t: Totals = { total: 3, ok: 1, byTopic: [{ topic: "acilis", total: 3, ok: 1 }] };
    t = addToTotals(t, { topic: "acilis", correct: true });
    t = addToTotals(t, { topic: "value", correct: false });
    expect(t).toEqual({
      total: 5,
      ok: 2,
      byTopic: [
        { topic: "acilis", total: 4, ok: 2 },
        { topic: "value", total: 1, ok: 0 },
      ],
    });
  });

  it("byTopic yoksa (eski sunucu) yalnızca genel toplam artar", () => {
    expect(addToTotals({ total: 1, ok: 1 }, { topic: "value", correct: true })).toEqual({ total: 2, ok: 2, byTopic: undefined });
  });
});
