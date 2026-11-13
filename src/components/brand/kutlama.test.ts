import { describe, expect, it } from "vitest";
import { KUTLAMA_ESIKLERI, kutlamaDuyurusu, kutlamaEsigi } from "./kutlama";

/** Trainer'daki akışın aynısı: her yeni seri değerinde eşik sorulur, kutlanan eşik kümeye eklenir. */
function oyna(seriler: number[]): number[] {
  const gorulen = new Set<number>();
  const kutlanan: number[] = [];
  for (const n of seriler) {
    const e = kutlamaEsigi(n, gorulen);
    if (e !== null) {
      gorulen.add(e);
      kutlanan.push(e);
    }
  }
  return kutlanan;
}

const kadar = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("kutlamaEsigi", () => {
  it("yalnızca 5 ve 10", () => {
    expect(KUTLAMA_ESIKLERI).toEqual([5, 10]);
    const bos = new Set<number>();
    expect(kadar(40).filter((n) => kutlamaEsigi(n, bos) !== null)).toEqual([5, 10]);
    expect(kutlamaEsigi(0, bos)).toBeNull();
  });

  it("kesintisiz 30 doğruda 5 ve 10 birer kez; 20 ve 30'da yok", () => {
    expect(oyna(kadar(30))).toEqual([5, 10]);
  });

  it("seri bozulup yeniden 5'e ulaşınca tekrar kutlanmaz", () => {
    expect(oyna([...kadar(6), 0, ...kadar(5)])).toEqual([5]);
  });

  it("5 kutlandıktan sonra seri bozulsa da 10 ilk kez gelince kutlanır", () => {
    expect(oyna([...kadar(7), 0, ...kadar(10)])).toEqual([5, 10]);
  });

  it("10'a ikinci kez ulaşınca kutlama yok", () => {
    expect(oyna([...kadar(10), 0, ...kadar(12)])).toEqual([5, 10]);
  });

  it("verilen kümeyi değiştirmez", () => {
    const g = new Set<number>();
    kutlamaEsigi(5, g);
    expect(g.size).toBe(0);
  });

  it("duyuru Türkçe ve kısa", () => {
    expect(kutlamaDuyurusu(5)).toBe("Şerefe! Üst üste 5 doğru karar.");
  });
});
