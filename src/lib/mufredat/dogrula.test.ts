import { describe, expect, it } from "vitest";
import veri from "@/data/mufredat.json";
import { GLOSSARY } from "@/data/glossary";
import { HANDS } from "@/data/hands";
import { dogrula } from "./dogrula";
import type { Alistirma, Mufredat } from "./tipler";

const m = veri as unknown as Mufredat;
const baglam = { terimler: new Set(GLOSSARY.map((g) => g.term)), spotKimlikleri: new Set(HANDS.map((h) => h.id)) };
const kopya = (): Mufredat => JSON.parse(JSON.stringify(m));

describe("müfredat verisi", () => {
  it("yüklenen dosya hatasız", () => {
    expect(dogrula(m, baglam)).toEqual([]);
  });

  it("ölçek: pist başına 10–14 ünite, ünite başına 4–8 normal ders, her ünitede kontrol ve tekrar", () => {
    for (const u of m.uniteler) {
      const n = u.dersler.filter((d) => d.tur === "ders").length;
      expect(n, u.kimlik).toBeGreaterThanOrEqual(4);
      expect(n, u.kimlik).toBeLessThanOrEqual(8);
      expect(u.dersler.filter((d) => d.tur === "kontrol").length, u.kimlik).toBe(1);
      expect(u.dersler.filter((d) => d.tur === "tekrar").length, u.kimlik).toBe(1);
    }
  });

  it("her pistte seviye 1'den 10'a ulaşılır ve en geç 3 ünitede bir seviye testi vardır", () => {
    const by = new Map(m.uniteler.map((u) => [u.kimlik, u]));
    for (const p of m.pistler) {
      const us = p.uniteler.map((k) => by.get(k)!);
      expect(us[0].seviye).toBe(1);
      expect(us.at(-1)!.seviye).toBe(10);
      let ara = 0;
      for (const u of us) {
        ara++;
        if (u.dersler.some((d) => d.tur === "test")) ara = 0;
        expect(ara, `${p.kimlik} ${u.kimlik}`).toBeLessThanOrEqual(3);
      }
      expect(ara, `${p.kimlik} bitirme testi`).toBe(0);
    }
  });
});

describe("doğrulayıcı hataları yakalar", () => {
  it("önkoşul döngüsü", () => {
    const k = kopya();
    k.uniteler[0].dersler[0].onkosul = [k.uniteler[0].dersler[1].kimlik];
    expect(dogrula(k).join("\n")).toMatch(/önkoşul döngüsü/);
  });
  it("sonradan öğretilen derse dayanma", () => {
    const k = kopya();
    k.uniteler.find((u) => u.kimlik === "o1")!.dersler[1].onkosul.push("c8-d4");
    expect(dogrula(k).join("\n")).toMatch(/kendinden sonra gelen c8-d4/);
  });
  it("eksik önkoşul ve bilinmeyen terim", () => {
    const k = kopya();
    k.uniteler[0].dersler[2].onkosul.push("yok-d9");
    k.uniteler[0].dersler[2].terimler = ["Uydurma Terim"];
    const h = dogrula(k, baglam).join("\n");
    expect(h).toMatch(/önkoşul bulunamadı: yok-d9/);
    expect(h).toMatch(/sözlükte olmayan terim: Uydurma Terim/);
  });
  it("dolu derste alıştırma sayısı, tip çeşitliliği ve rakip eli sızıntısı", () => {
    const k = kopya();
    const d = k.uniteler[0].dersler[0];
    const a = (i: number, ek: Partial<Alistirma> = {}): Alistirma => ({
      kimlik: `a${i}`, tip: "secmeli", zorluk: 1, soru: "Soru?", secenekler: ["A", "B"], dogru: 0, neden: "Çünkü.", yanilgi: "Yanılgı.", dogrulamaGerekli: false, ...ek,
    });
    d.durum = "dolu";
    d.anlatim = ["Bir.", "İki."];
    d.alistirmalar = [a(1), a(2), a(3, {
      tip: "spot", dogru: 1,
      spot: { oyun: "cash", oyuncuSayisi: 6, stackBB: 100, heroPoz: "BB", heroEl: "AhKd", aksiyonlar: ["BTN r2.5", "SB f"], rakipAraligi: "BTN elinde Qs Qd tutuyor" },
    })];
    const h = dogrula(k).join("\n");
    expect(h).toMatch(/8 ile 12 alıştırma ister \(şu an 3\)/);
    expect(h).toMatch(/en az 3 farklı alıştırma tipi/);
    expect(h).toMatch(/rakip aralığında somut bir el yazılmış/);
  });
  it("sayı sorusunda tolerans, seçmelide geçersiz cevap", () => {
    const k = kopya();
    const d = k.uniteler[0].dersler[0];
    d.durum = "dolu";
    d.anlatim = ["Bir.", "İki."];
    const temel = { zorluk: 1, soru: "S?", neden: "N.", yanilgi: "Y.", dogrulamaGerekli: false };
    d.alistirmalar = [
      { ...temel, kimlik: "a1", tip: "sayi", dogru: 27.3 },
      { ...temel, kimlik: "a2", tip: "secmeli", secenekler: ["A", "B"], dogru: 2 },
    ] as Alistirma[];
    const h = dogrula(k).join("\n");
    expect(h).toMatch(/a1: sayı sorusunda tolerans/);
    expect(h).toMatch(/a2: doğru cevap seçeneklerden birinin sırası olmalı/);
  });
});
