import { describe, expect, it } from "vitest";
import { BOS_FILTRE, SOKAKLAR, filtreOku, filtreYaz, havuz } from "@/app/alistirma/lib/filtreler";
import { HANDS } from "@/data/hands";
import { SPOT_KARTLARI, baglantiSayisi } from "./spotlar";

describe("ana sayfa spot kartları", () => {
  it("her kartın sayısı kendi bağlantısının açtığı havuzdan gelir (sabit)", () => {
    expect(SPOT_KARTLARI.map((k) => [k.href, k.n])).toEqual([
      ["/alistirma?oyun=cash&konu=acilis", 120],
      ["/alistirma?oyun=turnuva&konu=pushfold", 222],
      ["/alistirma?oyun=turnuva&konu=callshove", 122],
      ["/alistirma?oyun=cash&sokak=postflop", 88],
    ]);
    for (const k of SPOT_KARTLARI) expect(k.n).toBe(baglantiSayisi(k.href));
  });
});

describe("postflop sokak filtresi", () => {
  it("preflop dışındaki bütün spotları açar ve adresle gidip gelir", () => {
    const f = filtreOku(new URLSearchParams("oyun=cash&sokak=postflop"));
    expect(f).toEqual({ ...BOS_FILTRE, oyun: "cash", sokak: "postflop" });
    expect(filtreYaz(f)).toBe("oyun=cash&sokak=postflop");
    const p = havuz(f);
    expect(p.length).toBe(HANDS.filter((h) => h.game === "cash" && h.street !== "preflop").length);
    expect(p.every((h) => h.street !== "preflop")).toBe(true);
  });

  it("postflop = flop + turn + river; kurulumda seçenek olarak var", () => {
    const n = (sokak: string) => havuz(filtreOku(new URLSearchParams(`sokak=${sokak}`))).length;
    expect(n("postflop")).toBe(n("flop") + n("turn") + n("river"));
    expect(n("preflop") + n("postflop")).toBe(HANDS.length);
    expect(SOKAKLAR.some((s) => s.v === "postflop")).toBe(true);
  });
});
