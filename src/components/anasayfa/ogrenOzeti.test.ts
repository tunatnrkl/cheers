import { describe, expect, it } from "vitest";
import veri from "@/data/mufredat.json";
import type { Mufredat } from "@/lib/mufredat/tipler";
import { bosDurum, dersBaslat, dersDurumu, type Durum, pistOzeti } from "@/lib/ogren/ilerleme";
import { ORNEK_MUFREDAT } from "@/lib/ogren/ornek-mufredat";
import { dizinKur, pistDersleri } from "@/lib/ogren/yol";
import { inceMufredat, ogrenOzeti, seriNotu } from "./ogrenOzeti";

const simdi = new Date(2026, 10, 13, 12);
const dz = dizinKur(ORNEK_MUFREDAT);
const GERCEK = veri as unknown as Mufredat;

/** Pistteki ilk dersi bitmiş say */
function bitir(durum: Durum, kimlik: string, gun: Date): Durum {
  const k = durum.dersler[kimlik] ?? { sonuclar: [], yanlis: [], tur: 0 };
  return { ...durum, dersler: { ...durum.dersler, [kimlik]: { ...k, basla: gun.toISOString(), tamam: gun.toISOString(), son: gun.toISOString(), tur: 1 } } };
}

describe("ogrenOzeti", () => {
  it("kayıt yokken ilk derse yönlendirir ve seriyi nötr anlatır", () => {
    const o = ogrenOzeti(dz, bosDurum(), simdi);
    expect(o.ilk).toBe(true);
    expect(o.ders).toBeNull();
    expect(o.adres).toBe("/ogren");
    expect(o.seri).toBe(0);
    expect(o.seriNotu).toBe("Bugün bir ders, seriyi başlatır.");
  });

  it("yarıda kalan ders mevcut derstir", () => {
    const ilk = pistOzeti(dz, bosDurum(), "cash").siradaki!;
    const o = ogrenOzeti(dz, dersBaslat(bosDurum(), ilk, simdi), simdi);
    expect(o.ilk).toBe(false);
    expect(o.ders?.kimlik).toBe(ilk);
    expect(o.ders?.basladi).toBe(true);
    expect(o.adres).toBe(`/ogren?pist=cash&ders=${ilk}`);
  });

  it("biten dersten sonra pistteki sıradaki ders gelir", () => {
    const ilk = pistOzeti(dz, bosDurum(), "cash").siradaki!;
    const durum = bitir(bosDurum(), ilk, simdi);
    const o = ogrenOzeti(dz, durum, simdi);
    expect(o.ders?.kimlik).toBe(pistOzeti(dz, durum, "cash").siradaki);
    expect(o.ders?.kimlik).not.toBe(ilk);
    expect(dersDurumu(dz, durum, o.ders!.kimlik)).toBe("acik");
  });

  it("kopmuş seride suçlayıcı olmayan dil", () => {
    const durum = { ...bitir(bosDurum(), "o1-d1", simdi), seri: { gun: "2026-11-01", sayi: 6 } };
    const o = ogrenOzeti(dz, durum, simdi);
    expect(o.seri).toBe(0);
    expect(o.seriNotu).toBe("Bugün bir ders, seriyi yeniden başlatır.");
    expect(seriNotu(3, false, true)).toBe("Bugün bir ders, seriyi sürdürür.");
    expect(seriNotu(3, true, true)).toBe("Bugünkü ders tamam.");
  });

  it("müfredatta olmayan eski kayıtlar yok sayılır", () => {
    const durum = bitir(bosDurum(), "yok-boyle-ders", simdi);
    expect(ogrenOzeti(dz, durum, simdi).ilk).toBe(true);
  });
});

describe("inceMufredat", () => {
  it("gerçek müfredatta yol hesabını değiştirmez, boyutu küçültür", () => {
    const tam = dizinKur(GERCEK);
    const ince = dizinKur(inceMufredat(GERCEK));
    let durum = bosDurum();
    for (const pist of ["cash", "turnuva"] as const) {
      // İlk beş açılabilir dersi sırayla bitir; her adımda iki dizin aynı sonucu verir.
      for (let i = 0; i < 5; i++) {
        expect(pistOzeti(ince, durum, pist)).toEqual(pistOzeti(tam, durum, pist));
        for (const d of pistDersleri(tam, pist)) expect(dersDurumu(ince, durum, d.kimlik)).toBe(dersDurumu(tam, durum, d.kimlik));
        expect(ogrenOzeti(ince, durum, simdi)).toEqual(ogrenOzeti(tam, durum, simdi));
        const s = pistOzeti(tam, durum, pist).siradaki;
        if (!s) break;
        durum = bitir(durum, s, new Date(simdi.getTime() + i * 1000));
      }
    }
    expect(JSON.stringify(inceMufredat(GERCEK)).length).toBeLessThan(JSON.stringify(GERCEK).length / 5);
  });
});
