import { describe, expect, it } from "vitest";
import { parseIcmList } from "./icmInput";
import { icm } from "./math";

describe("parseIcmList (ICM hesap makinesi girişi)", () => {
  it("virgül, boşluk ve noktalı virgülle ayrılmış sayıları okur", () => {
    expect(parseIcmList("5000, 3000;1500  500")).toEqual({ values: [5000, 3000, 1500, 500], dropped: 0, truncated: 0, thousands: 0 });
  });
  it("0, negatif ve sayı olmayan girişleri atar ve sayar (I-1)", () => {
    const r = parseIcmList("5000, 0, abc, -200, 1500");
    expect(r.values).toEqual([5000, 1500]);
    expect(r.dropped).toBe(3);
  });
  it("Türkçe binlik yazımını binlik sayar (I-2): 5.000 → 5000", () => {
    const r = parseIcmList("5.000, 12.500, 1.250.000");
    expect(r.values).toEqual([5000, 12500, 1250000]);
    expect(r.thousands).toBe(3);
  });
  it("tek noktalı kesirleri ondalık bırakır", () => {
    expect(parseIcmList("2.5 10.25 7.5000").values).toEqual([2.5, 10.25, 7.5]);
  });
  it("üst sınırı aşan girişleri keser ve sayar", () => {
    const r = parseIcmList("1 2 3 4 5 6 7 8 9 10 11", 9);
    expect(r.values).toHaveLength(9);
    expect(r.truncated).toBe(2);
  });
  it("yüzde işaretli ödülleri okur (I-3): %50, %30, 20%", () => {
    expect(parseIcmList("%50, %30, 20%")).toEqual({ values: [50, 30, 20], dropped: 0, truncated: 0, thousands: 0 });
  });
  it("boş giriş", () => {
    expect(parseIcmList("  ")).toEqual({ values: [], dropped: 0, truncated: 0, thousands: 0 });
  });
  it("binlik ve düz yazım aynı ICM sonucunu verir", () => {
    const a = icm(parseIcmList("5.000, 3.000, 1.500, 500").values, [50, 30, 20]);
    const b = icm([5000, 3000, 1500, 500], [50, 30, 20]);
    expect(a).toEqual(b);
  });
});
