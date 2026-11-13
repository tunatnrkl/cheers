import { describe, expect, it } from "vitest";
import gercek from "@/data/mufredat.json";
import { GLOSSARY } from "@/data/glossary";
import { HANDS } from "@/data/hands";
import { dogrula } from "@/lib/mufredat/dogrula";
import type { AlistirmaTipi, Mufredat } from "@/lib/mufredat/tipler";
import { replay } from "@/lib/poker/replay";
import { type Cevap, degerlendir, karistir, rangeEvreni, sayiCoz, spotEl } from "./alistirma";
import {
  type Durum,
  type OturumCevabi,
  XP_DERS,
  XP_DOGRU,
  acilabilir,
  bosDurum,
  bugunSayaci,
  depodanOku,
  dersBaslat,
  dersDurumu,
  disaAktar,
  durumCoz,
  eksikOnkosullar,
  gunAnahtari,
  gunFarki,
  iceAktar,
  oncekiGun,
  oturumSorulari,
  oturumUygula,
  pistOzeti,
  seriGorunen,
  seriGuncelle,
  tekrarOner,
  ustaMi,
  ustalikOrani,
  zayifDersler,
} from "./ilerleme";
import { ORNEK_MUFREDAT } from "./ornek-mufredat";
import { dersinPisti, dizinKur, etkinOnkosul, icerikVar, pistDersleri, testKapsami } from "./yol";

const dz = dizinKur(ORNEK_MUFREDAT);
const gun = (g: number, saat = 12, dk = 0) => new Date(2026, 10, g, saat, dk);

/** Dersi bitirir: `yanlis` sayıda ilk soru yanlış, kalanı doğru. */
function bitir(durum: Durum, kimlik: string, simdi: Date, yanlis = 0, mod: "ders" | "tekrar" = "ders") {
  const cevaplar: OturumCevabi[] = oturumSorulari(dz, durum, kimlik, mod).map((s, i) => ({ ders: s.ders, alistirma: s.a.kimlik, sonuc: i < yanlis ? "y" : "d" }));
  return oturumUygula(dz, durum, { kimlik, mod, cevaplar }, simdi);
}
const sirayla = (kimlikler: string[], simdi = gun(1)) => kimlikler.reduce((d, k) => bitir(d, k, simdi).durum, bosDurum());

describe("örnek müfredat", () => {
  it("ders ve alıştırma düzeyinde doğrulayıcıdan geçer (ölçek kuralı hariç)", () => {
    const baglam = { terimler: new Set(GLOSSARY.map((g) => g.term)), spotKimlikleri: new Set(HANDS.map((h) => h.id)) };
    const hatalar = dogrula(ORNEK_MUFREDAT, baglam).filter((h) => !/pist 10 ile 14 ünite içermeli/.test(h));
    expect(hatalar).toEqual([]);
  });

  it("her pistte 2 ünite, ünitede 3 dolu ders; yedi alıştırma tipinin hepsi var", () => {
    for (const p of ORNEK_MUFREDAT.pistler) expect(p.uniteler.length).toBe(2);
    for (const u of ORNEK_MUFREDAT.uniteler) expect(u.dersler.filter((d) => d.tur === "ders" && d.durum === "dolu").length).toBe(3);
    const tipler = new Set(ORNEK_MUFREDAT.uniteler.flatMap((u) => u.dersler).flatMap((d) => d.alistirmalar.map((a) => a.tip)));
    expect([...tipler].sort()).toEqual((["dogruYanlis", "eslestirme", "range", "sayi", "secmeli", "siralama", "spot"] satisfies AlistirmaTipi[]).sort());
    const tekDers = new Set(dz.dersler.get("c5-d1")!.alistirmalar.map((a) => a.tip));
    expect(tekDers.size).toBe(7);
  });

  it("spot alıştırmaları masaya çevrilir, aksiyon dizisi hatasızdır ve rakip eli taşınmaz", () => {
    const spotlar = [...dz.dersler.values()].flatMap((d) => d.alistirmalar).filter((a) => a.tip === "spot");
    expect(spotlar.length).toBeGreaterThan(3);
    for (const a of spotlar) {
      const el = spotEl(a)!;
      expect(el, a.kimlik).toBeTruthy();
      expect(replay(el).errors, a.kimlik).toEqual([]);
      expect(JSON.stringify(el)).not.toContain("villain");
      expect(el.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("bağlanan spotun kopyasında rakip kartı ya da durum notu taşınmaz", () => {
    // villain alanı veriden kaldırıldı (kapı B); pot odds spotları notta yalnızca aralık anlatır.
    const odds = HANDS.find((h) => h.id.startsWith("o-"))!;
    const el = spotEl({ kimlik: "x", tip: "spot", zorluk: 1, soru: "?", secenekler: odds.options, dogru: 0, neden: "n", yanilgi: "y", dogrulamaGerekli: false, spotKimlik: odds.id })!;
    expect(JSON.stringify(el)).not.toContain("villain");
    expect(replay(el).errors).toEqual([]);
  });
});

describe("gerçek müfredat (iskelet) ile uyum", () => {
  const g = dizinKur(gercek as unknown as Mufredat);
  it("iskelet dersler 'yakında' görünür, açılamaz; özet sıfıra bölmez", () => {
    for (const p of ["cash", "turnuva"] as const) {
      const o = pistOzeti(g, bosDurum(), p);
      expect(o.yuzde).toBeGreaterThanOrEqual(0);
      expect(o.yuzde).toBeLessThanOrEqual(100);
      expect(o.seviye).toBeGreaterThanOrEqual(1);
      for (const d of pistDersleri(g, p)) {
        const s = dersDurumu(g, bosDurum(), d.kimlik);
        if (!icerikVar(g, d)) {
          expect(s).toBe("yakinda");
          expect(acilabilir(g, bosDurum(), d.kimlik)).toBe(false);
        }
      }
    }
  });
  it("test kapsamı: ortak test yalnızca ortak üniteleri, pist testi o üniteye kadarki her şeyi kapsar", () => {
    const ortak = testKapsami(g, "o4-t");
    expect(ortak.length).toBeGreaterThan(0);
    expect(ortak.every((k) => k.startsWith("o"))).toBe(true);
    expect(ortak).toContain("o1-d1");
    expect(ortak).not.toContain("o4-t");
    const pist = testKapsami(g, "c6-t");
    expect(pist).toEqual(expect.arrayContaining(["o1-d1", "o4-k", "c5-d1", "c6-k"]));
    expect(pist.some((k) => k.startsWith("c7") || k.startsWith("t"))).toBe(false);
  });
});

describe("gün ve seri (yerel saat)", () => {
  it("gün anahtarı yerel saate göredir; gece yarısı sınırdır", () => {
    expect(gunAnahtari(new Date(2026, 10, 12, 23, 59))).toBe("2026-11-12");
    expect(gunAnahtari(new Date(2026, 10, 13, 0, 0))).toBe("2026-11-13");
    expect(oncekiGun("2026-03-01")).toBe("2026-02-28");
    expect(oncekiGun("2027-01-01")).toBe("2026-12-31");
    expect(gunFarki(new Date(2026, 10, 12, 23, 59), new Date(2026, 10, 13, 0, 1))).toBe(1);
  });
  it("aynı gün ikinci ders seriyi artırmaz; ertesi gün artırır; boşluk 1'den başlatır", () => {
    let s = seriGuncelle({ gun: null, sayi: 0 }, gun(10));
    expect(s).toEqual({ gun: "2026-11-10", sayi: 1 });
    s = seriGuncelle(s, gun(10, 23, 59));
    expect(s.sayi).toBe(1);
    s = seriGuncelle(s, gun(11, 0, 1));
    expect(s.sayi).toBe(2);
    s = seriGuncelle(s, gun(14));
    expect(s).toEqual({ gun: "2026-11-14", sayi: 1 });
  });
  it("görünen seri: dün çalışıldıysa sürer, iki gün geçtiyse 0", () => {
    const s = { gun: "2026-11-10", sayi: 4 };
    expect(seriGorunen(s, gun(10))).toEqual({ sayi: 4, bugunTamam: true });
    expect(seriGorunen(s, gun(11))).toEqual({ sayi: 4, bugunTamam: false });
    expect(seriGorunen(s, gun(12))).toEqual({ sayi: 0, bugunTamam: false });
  });
});

describe("kilit ve ders durumu", () => {
  it("başlangıçta yalnızca ilk ders açık; test kilitliyken de girilebilir", () => {
    const d = bosDurum();
    expect(dersDurumu(dz, d, "o1-d1")).toBe("acik");
    expect(dersDurumu(dz, d, "o1-d2")).toBe("kilitli");
    expect(acilabilir(dz, d, "c5-d1")).toBe(false);
    expect(eksikOnkosullar(dz, d, "o1-d2")).toEqual(["o1-d1"]);
    expect(dersDurumu(dz, d, "o1-t")).toBe("acik");
    expect(dersDurumu(dz, d, "c5-t")).toBe("acik");
    expect(dersDurumu(dz, d, "o1-r")).toBe("kilitli");
  });
  it("devam ediyor → tamamlandı; sonraki ders açılır", () => {
    let d = dersBaslat(bosDurum(), "o1-d1", gun(1));
    expect(dersDurumu(dz, d, "o1-d1")).toBe("devam");
    expect(dersBaslat(d, "o1-d1", gun(2))).toBe(d);
    d = bitir(d, "o1-d1", gun(1), 3).durum;
    expect(dersDurumu(dz, d, "o1-d1")).toBe("tamam");
    expect(dersDurumu(dz, d, "o1-d2")).toBe("acik");
  });
  it("iskelet ders 'yakında'dır, yolu kilitlemez ve atlanarak bedava kapı açmaz", () => {
    expect(dersDurumu(dz, bosDurum(), "c5-d4")).toBe("yakinda");
    expect(etkinOnkosul(dz, "c5-k")).toEqual(["c5-d3"]);
    let d = sirayla(["o1-d1", "o1-d2", "o1-d3", "o1-k", "c5-d1", "c5-d2"]);
    expect(dersDurumu(dz, d, "c5-k")).toBe("kilitli");
    d = bitir(d, "c5-d3", gun(1)).durum;
    expect(dersDurumu(dz, d, "c5-d4")).toBe("yakinda");
    expect(dersDurumu(dz, d, "c5-k")).toBe("acik");
  });
  it("ortak ünite: bir pistte biten ders diğerinde de bitmiş sayılır", () => {
    const d = sirayla(["o1-d1", "o1-d2", "o1-d3", "o1-k"]);
    expect(pistOzeti(dz, d, "cash").tamam).toBe(4);
    expect(pistOzeti(dz, d, "turnuva").tamam).toBe(4);
    expect(dersDurumu(dz, d, "c5-d1")).not.toBe("kilitli");
    expect(dersDurumu(dz, d, "t1-d1")).not.toBe("kilitli");
    expect(dersinPisti(dz, "o1-d1", "turnuva")).toBe("turnuva");
    expect(dersinPisti(dz, "c5-d1", "turnuva")).toBe("cash");
  });
});

describe("ustalık", () => {
  const ders = dz.dersler.get("o1-d1")!; // son 8, oran 0,8
  it("son N alıştırmadaki oran; kabul edilebilir cevap paydaya girmez", () => {
    expect(ustalikOrani(undefined, ders)).toEqual({ oran: null, n: 0 });
    expect(ustalikOrani({ sonuclar: ["d", "d", "y", "k"], yanlis: [], tur: 1 }, ders).oran).toBeCloseTo(2 / 3);
    const eskiYanlislar = { sonuclar: [..."yyyy", ..."dddddddd"] as ("d" | "y")[], yanlis: [], tur: 2 };
    expect(ustalikOrani(eskiYanlislar, ders)).toEqual({ oran: 1, n: 8 });
  });
  it("eşiğin altında 'tamam', üstünde 'usta'; tekrar çalışınca ustalaşır", () => {
    let d = bitir(bosDurum(), "o1-d1", gun(1), 3).durum; // 5/8
    expect(dersDurumu(dz, d, "o1-d1")).toBe("tamam");
    const s = bitir(d, "o1-d1", gun(1), 0);
    d = s.durum;
    expect(s.ozet.ustaOldu).toBe(true);
    expect(s.ozet.ilkTamamlama).toBe(false);
    expect(dersDurumu(dz, d, "o1-d1")).toBe("usta");
    expect(ustaMi({ tamam: "2026-11-01T10:00:00.000Z", sonuclar: ["d", "d"], yanlis: [], tur: 1 }, ders)).toBe(false); // pencere dolmadı
  });
});

describe("XP, günlük sayaç, oturum", () => {
  it("sabit kural: doğru başına 10, ders bitirme 20; çarpan yok", () => {
    const s = bitir(bosDurum(), "o1-d1", gun(1), 2);
    expect(s.ozet.xp).toBe(6 * XP_DOGRU + XP_DERS);
    expect(s.ozet).toMatchObject({ dogru: 6, yanlis: 2, dogruluk: 75, seriOnce: 0, seriSonra: 1, seriIslendi: true, testGecti: null, hedefTamam: true, ilkTamamlama: true });
    expect(s.durum.xp).toBe(80);
    const s2 = bitir(s.durum, "o1-d2", gun(1), 0);
    expect(s2.ozet.xp).toBe(100);
    expect(s2.ozet.seriIslendi).toBe(false);
    expect(s2.ozet.hedefTamam).toBe(false);
    expect(bugunSayaci(s2.durum, gun(1))).toEqual({ ders: 2, xp: 180, hedef: 1 });
    expect(bugunSayaci(s2.durum, gun(2))).toEqual({ ders: 0, xp: 0, hedef: 1 });
  });
  it("kabul edilebilir cevap XP vermez, yanlış da sayılmaz", () => {
    const cevaplar: OturumCevabi[] = [
      { ders: "c5-d1", alistirma: "a8", sonuc: "k" },
      { ders: "c5-d1", alistirma: "a1", sonuc: "d" },
    ];
    const s = oturumUygula(dz, bosDurum(), { kimlik: "c5-d1", mod: "ders", cevaplar }, gun(1));
    expect(s.ozet).toMatchObject({ xp: 30, kabul: 1, dogruluk: 100 });
    expect(s.durum.dersler["c5-d1"].yanlis).toEqual([]);
  });
  it("yanlışlar kaydedilir, sonraki doğru cevapla silinir; girdi durumu değişmez", () => {
    const once = bosDurum();
    const s = bitir(once, "o1-d1", gun(1), 2);
    expect(once).toEqual(bosDurum());
    expect(s.durum.dersler["o1-d1"].yanlis).toEqual(["a1", "a2"]);
    expect(bitir(s.durum, "o1-d1", gun(1), 0).durum.dersler["o1-d1"].yanlis).toEqual([]);
  });
  it("tekrar düğümü: sorular ünitenin derslerinden gelir, geçmiş yanlışlar öne alınır, sonuç köken derse yazılır", () => {
    let d = sirayla(["o1-d1", "o1-d2", "o1-d3", "o1-k"]);
    d = { ...d, dersler: { ...d.dersler, "o1-d3": { ...d.dersler["o1-d3"], yanlis: ["a7"] } } };
    expect(dersDurumu(dz, d, "o1-r")).toBe("acik");
    const sorular = oturumSorulari(dz, d, "o1-r", "ders");
    expect(sorular.length).toBe(8);
    expect(sorular[0]).toMatchObject({ ders: "o1-d3", a: { kimlik: "a7" } });
    const s = bitir(d, "o1-r", gun(2));
    expect(s.durum.dersler["o1-d3"].yanlis).toEqual([]);
    expect(dersDurumu(dz, s.durum, "o1-r")).toBe("tamam");
  });
});

describe("seviye atlama testi", () => {
  it("geçilirse kapsamdaki dersler 'testle açıldı' olur; kalırsa hiçbir şey açılmaz", () => {
    const kalan = bitir(bosDurum(), "o1-t", gun(1), 3); // 9/12 = %75 < %85
    expect(kalan.ozet.testGecti).toBe(false);
    expect(kalan.ozet.acilan).toBe(0);
    expect(dersDurumu(dz, kalan.durum, "o1-d2")).toBe("kilitli");
    expect(dersDurumu(dz, kalan.durum, "o1-t")).toBe("devam");

    const gecen = bitir(kalan.durum, "o1-t", gun(1), 1); // 11/12
    expect(gecen.ozet.testGecti).toBe(true);
    expect(gecen.ozet.acilan).toBe(5); // d1, d2, d3, k, r
    expect(gecen.durum.dersler["o1-d2"]).toMatchObject({ testle: true });
    expect(dersDurumu(dz, gecen.durum, "o1-k")).toBe("tamam");
    expect(dersDurumu(dz, gecen.durum, "c5-d1")).toBe("acik");
    expect(dersDurumu(dz, gecen.durum, "t1-d1")).toBe("acik");
  });
  it("önceden bitirilmiş ders 'testle' işareti almaz; pist testi ortak üniteyi de açar", () => {
    const d = bitir(bitir(bosDurum(), "o1-d1", gun(1)).durum, "c5-t", gun(1)).durum;
    expect(d.dersler["o1-d1"].testle).toBeUndefined();
    expect(d.dersler["o1-k"].testle).toBe(true);
    expect(d.dersler["c5-d4"].testle).toBe(true);
    expect(dersDurumu(dz, d, "c5-d4")).toBe("yakinda");
    expect(pistOzeti(dz, d, "cash")).toMatchObject({ yuzde: 100, tamam: 8, toplam: 8, siradaki: null, hazirlaniyor: true });
    expect(dersDurumu(dz, d, "t1-d1")).toBe("acik");
  });
});

describe("pist özeti ve seviye", () => {
  it("iskelet dersler ilerleme hesabına girmez", () => {
    const o = pistOzeti(dz, bosDurum(), "cash");
    expect(o).toEqual({ yuzde: 0, tamam: 0, toplam: 8, seviye: 1, siradaki: "o1-d1", hazirlaniyor: true });
  });
  it("seviye bulunulan ünitenin seviyesidir", () => {
    const d = sirayla(["o1-d1", "o1-d2", "o1-d3", "o1-k"]);
    expect(pistOzeti(dz, d, "cash")).toMatchObject({ yuzde: 50, seviye: 3, siradaki: "c5-d1" });
    expect(pistOzeti(dz, d, "turnuva")).toMatchObject({ seviye: 2, siradaki: "t1-d1" });
  });
});

describe("aralıklı tekrar", () => {
  it("zayıf ders ertesi gün önerilir; aynı gün ve boş durumda öneri yok", () => {
    expect(tekrarOner(dz, bosDurum(), gun(1))).toBeNull();
    let d = bitir(bosDurum(), "o1-d1", gun(1), 4).durum;
    d = bitir(d, "o1-d2", gun(1), 0).durum;
    expect(tekrarOner(dz, d, gun(1))).toBeNull();
    expect(tekrarOner(dz, d, gun(2))).toBe("o1-d1");
    expect(zayifDersler(dz, d)).toEqual([{ kimlik: "o1-d1", baslik: "Deste ve kartlar", oran: 0.5 }]);
  });
  it("güçlü ders 7 gün görülmezse önerilir; günde bir kez", () => {
    const d = bitir(bosDurum(), "o1-d2", gun(1), 0).durum;
    expect(tekrarOner(dz, d, gun(7))).toBeNull();
    expect(tekrarOner(dz, d, gun(8))).toBe("o1-d2");
    const s = bitir(d, "o1-d2", gun(8), 0, "tekrar");
    expect(s.durum.sonTekrar).toBe("2026-11-08");
    expect(tekrarOner(dz, s.durum, gun(8, 23))).toBeNull();
  });
  it("tekrar oturumu: en fazla 6 soru, önce yanlışlar", () => {
    const d = bitir(bosDurum(), "o1-d1", gun(1), 0).durum;
    const y = { ...d, dersler: { "o1-d1": { ...d.dersler["o1-d1"], yanlis: ["a8", "a5"] } } };
    const s = oturumSorulari(dz, y, "o1-d1", "tekrar").map((x) => x.a.kimlik);
    expect(s).toEqual(["a5", "a8", "a1", "a2", "a3", "a4"]);
  });
});

describe("kayıt: şema denetimi, içe/dışa aktarma", () => {
  it("dışa aktarılan dosya içe aktarılınca aynı durumu verir", () => {
    const d = sirayla(["o1-d1", "o1-d2"]);
    const s = iceAktar(disaAktar(d, gun(3)));
    expect(s).toEqual({ ok: true, durum: d });
  });
  it("yabancı ya da bozuk dosya nötr bir hatayla reddedilir", () => {
    expect(iceAktar("{bozuk")).toMatchObject({ ok: false });
    expect(iceAktar("[]")).toMatchObject({ ok: false });
    expect(iceAktar(JSON.stringify({ uygulama: "baska", tur: "x", durum: bosDurum() }))).toMatchObject({ ok: false });
    const kotu = JSON.parse(disaAktar(bosDurum(), gun(1)));
    kotu.durum.xp = -5;
    expect(iceAktar(JSON.stringify(kotu))).toEqual({ ok: false, hata: "XP değeri geçersiz." });
    kotu.durum.xp = 0;
    kotu.durum.surum = 99;
    expect(iceAktar(JSON.stringify(kotu))).toMatchObject({ ok: false });
  });
  it("depodan okuma: boş → boş durum; bozuk → sıfırlanır ve bildirilir; eksik alanlar varsayılanla dolar", () => {
    expect(depodanOku(null)).toEqual({ durum: bosDurum(), bozuk: false });
    expect(depodanOku("{{{")).toEqual({ durum: bosDurum(), bozuk: true });
    expect(depodanOku('{"surum":1,"dersler":{"o1-d1":{"sonuclar":["x"]}}}')).toEqual({ durum: bosDurum(), bozuk: true });
    expect(depodanOku('{"surum":1,"seri":"dün"}').bozuk).toBe(true);
    expect(depodanOku("null").bozuk).toBe(true);
    const eksik = depodanOku('{"surum":1,"xp":40,"dersler":{"o1-d1":{"tamam":"2026-11-01T10:00:00.000Z"}}}');
    expect(eksik.bozuk).toBe(false);
    expect(eksik.durum).toMatchObject({ xp: 40, hedef: 1, seri: { gun: null, sayi: 0 }, dersler: { "o1-d1": { sonuclar: [], yanlis: [], tur: 0 } } });
  });
  it("şema denetimi istisna fırlatmaz", () => {
    for (const v of [undefined, 3, "x", [], { surum: "1" }, { surum: 1, dersler: [] }, { surum: 1, dersler: { a: null } }, { surum: 1, hedef: 9 }]) {
      expect("hata" in durumCoz(v)).toBe(true);
    }
  });
});

describe("alıştırma değerlendirme", () => {
  const al = (ders: string, k: string) => dz.dersler.get(ders)!.alistirmalar.find((a) => a.kimlik === k)!;
  const dogruCevap = (a: ReturnType<typeof al>): Cevap => {
    switch (a.tip) {
      case "secmeli":
      case "spot":
        return { tip: "secim", sira: a.dogru as number };
      case "dogruYanlis":
        return { tip: "dy", deger: a.dogru as boolean };
      case "sayi":
        return { tip: "sayi", metin: String(a.dogru).replace(".", ",") };
      case "range":
        return { tip: "range", eller: [...(a.dogru as string[])].reverse() };
      case "eslestirme":
        return { tip: "eslestirme", eslesme: (a.secenekler ?? []).map((_, i) => i) };
      case "siralama":
        return { tip: "siralama", sira: (a.secenekler ?? []).map((_, i) => i) };
    }
  };
  it("örnek verideki her alıştırmanın doğru cevabı 'doğru' sayılır", () => {
    for (const d of dz.dersler.values()) for (const a of d.alistirmalar) expect(degerlendir(a, dogruCevap(a)), `${d.kimlik}/${a.kimlik}`).toBe("d");
  });
  it("seçmeli ve spot: yanlış, kabul edilebilir", () => {
    const spot = al("c5-d1", "a8");
    expect(degerlendir(spot, { tip: "secim", sira: 0 })).toBe("y");
    expect(degerlendir(spot, { tip: "secim", sira: 2 })).toBe("k");
    expect(degerlendir(al("o1-d1", "a2"), { tip: "dy", deger: true })).toBe("y");
  });
  it("sayı: ondalık virgül, yüzde işareti, tolerans", () => {
    expect(sayiCoz("12,5")).toBe(12.5);
    expect(sayiCoz(" %33,3 ")).toBe(33.3);
    expect(sayiCoz("25 %")).toBe(25);
    expect(sayiCoz("1.250,5")).toBe(1250.5);
    expect(sayiCoz("-2")).toBe(-2);
    for (const k of ["", "abc", "1,2,3", "12 BB", "1e3", ","]) expect(sayiCoz(k), k).toBeNull();
    const a = al("c5-d3", "a5"); // 33,3 ± 0,5
    expect(degerlendir(a, { tip: "sayi", metin: "33" })).toBe("d");
    expect(degerlendir(a, { tip: "sayi", metin: "33,8" })).toBe("d");
    expect(degerlendir(a, { tip: "sayi", metin: "34" })).toBe("y");
    expect(degerlendir(a, { tip: "sayi", metin: "" })).toBe("y");
    expect(degerlendir(al("t1-d3", "a3"), { tip: "sayi", metin: "10,5" })).toBe("d");
  });
  it("range: küme eşitliği; evren sınırlıysa yalnızca o eller", () => {
    const a = al("c5-d1", "a7");
    expect(degerlendir(a, { tip: "range", eller: ["AA"] })).toBe("y");
    expect(degerlendir(a, { tip: "range", eller: [...(a.dogru as string[]), "AKs"] })).toBe("y");
    expect(rangeEvreni(a).size).toBe(169);
    expect(rangeEvreni(al("t1-d3", "a6")).size).toBe(8);
  });
  it("eşleştirme ve sıralama: yanlış dizilim yanlıştır; karıştırma özgün sırayı vermez", () => {
    expect(degerlendir(al("o1-d1", "a4"), { tip: "eslestirme", eslesme: [1, 0, 2, 3] })).toBe("y");
    expect(degerlendir(al("o1-d1", "a5"), { tip: "siralama", sira: [1, 0, 2, 3, 4, 5] })).toBe("y");
    for (const n of [2, 3, 4, 6, 8]) {
      for (const t of ["a", "o1-d1/a5", "x9"]) {
        const k = karistir(n, t);
        expect([...k].sort((x, y) => x - y)).toEqual(Array.from({ length: n }, (_, i) => i));
        expect(k.every((v, i) => v === i)).toBe(false);
        expect(karistir(n, t)).toEqual(k);
      }
    }
  });
});
