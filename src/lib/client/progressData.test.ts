import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { buildExport, collectPages, rankTopics, topicTotals, type ExportAttempt } from "./progressData";

describe("rankTopics / topicTotals (G-2)", () => {
  it("listeden ve sunucu toplamından aynı tablo çıkar", () => {
    const list = [
      { topic: "acilis" as const, correct: true },
      { topic: "acilis" as const, correct: false },
      { topic: "odds" as const, correct: false },
      { topic: "odds" as const, correct: false },
      { topic: "odds" as const, correct: true },
    ];
    const fromList = rankTopics(topicTotals(list));
    const fromServer = rankTopics([
      { topic: "acilis", total: 2, ok: 1 },
      { topic: "odds", total: 3, ok: 1 },
    ]);
    expect(fromServer).toEqual(fromList);
    expect(fromList.map((s) => s.topic)).toEqual(["odds", "acilis"]);
    expect(fromList[0].rate).toBeCloseTo(1 / 3, 10);
  });

  it("eşit oranda daha çok çözülen konu önce gelir; boş satır atılır", () => {
    const r = rankTopics([
      { topic: "acilis", total: 2, ok: 1 },
      { topic: "odds", total: 10, ok: 5 },
      { topic: "icm", total: 0, ok: 0 },
    ]);
    expect(r.map((s) => s.topic)).toEqual(["odds", "acilis"]);
  });
});

describe("collectPages (G-2)", () => {
  // 12.345 kayıtlık sahte sunucu: id azalan, sayfa 5000
  const ids = Array.from({ length: 12_345 }, (_, i) => 12_345 - i);
  const server = async (before: string | null) => {
    const rest = before === null ? ids : ids.filter((id) => id < Number(before));
    const page = rest.slice(0, 5000);
    return { attempts: page, next: page.length === 5000 ? String(page[page.length - 1]) : null };
  };

  it("bütün sayfaları sırayla, eksiksiz ve tekrarsız toplar", async () => {
    let calls = 0;
    const all = await collectPages(async (b) => (calls++, server(b)));
    expect(all.length).toBe(12_345);
    expect(new Set(all).size).toBe(12_345);
    expect(calls).toBe(3);
  });

  it("tam 5000 kayıtta son sayfa boş gelir ve döngü biter", async () => {
    const five = ids.slice(0, 5000);
    const all = await collectPages(async (b) => {
      const rest = b === null ? five : five.filter((id) => id < Number(b));
      const page = rest.slice(0, 5000);
      return { attempts: page, next: page.length === 5000 ? String(page[page.length - 1]) : null };
    });
    expect(all.length).toBe(5000);
  });

  it("ilerlemeyen imleçte ve sayfa sınırında hata verir (yarım dosya indirilmez)", async () => {
    await expect(collectPages(async () => ({ attempts: [1], next: "7" }))).rejects.toThrow();
    let n = 1_000_000;
    await expect(collectPages(async () => ({ attempts: [1], next: String(n--) }), 3)).rejects.toThrow(/sınır/);
  });

  it("sayfa isteği hata verirse hata yukarı taşınır", async () => {
    await expect(collectPages(async () => Promise.reject(new Error("ağ")))).rejects.toThrow("ağ");
  });
});

describe("buildExport (G-2)", () => {
  const h = HANDS[0];
  const attempts: ExportAttempt[] = [
    { handId: h.id, chosen: h.correct, correct: true, topic: h.topic, at: "2026-01-01T10:00:00.000Z" },
    { handId: h.id, chosen: (h.correct + 1) % h.options.length, correct: false, topic: h.topic, at: "2026-03-01T10:00:00.000Z" },
    { handId: "silinmis-el", chosen: 0, correct: false, topic: "eski-konu", at: "2026-02-01T10:00:00.000Z" },
  ];

  it("JSON: cevaplar yeniden eskiye, bilinmeyen el kimliğiyle kalır", () => {
    const j = JSON.parse(buildExport("json", attempts, [{ handId: h.id, note: "not", at: "2026-01-02" }]));
    expect(j.alistirmalar.map((r: { tarih: string }) => r.tarih)).toEqual([
      "2026-03-01T10:00:00.000Z",
      "2026-02-01T10:00:00.000Z",
      "2026-01-01T10:00:00.000Z",
    ]);
    expect(j.alistirmalar[1].el).toBe("silinmis-el");
    expect(j.alistirmalar[1].konu).toBe("eski-konu");
    expect(j.alistirmalar[2].dogru).toBe("evet");
    expect(j.kaydedilenEller[0].not).toBe("not");
  });

  it("CSV: BOM, başlık, satır sayısı ve tırnak kaçışı", () => {
    const csv = buildExport("csv", attempts, [{ handId: h.id, note: 'dedi ki "fold"\nikinci satır', at: "2026-01-02" }]);
    expect(csv.startsWith("﻿")).toBe(true);
    const header = csv.slice(1).split("\n")[0];
    expect(header).toBe("tur,tarih,el,konu,secim,onerilen,dogru,not");
    expect(csv).toContain('"dedi ki ""fold""');
    expect(csv.match(/^"alistirma"/gm)?.length).toBe(3);
    expect(csv.match(/^"kayitli-el"/gm)?.length).toBe(1);
  });

  it("girdi dizisini değiştirmez", () => {
    const copy = attempts.map((a) => ({ ...a }));
    buildExport("csv", attempts, []);
    expect(attempts).toEqual(copy);
  });
});
