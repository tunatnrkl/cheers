import { describe, expect, it } from "vitest";
import { icm, outsProbability, parseNumberList, requiredEquity, spr, bluffBreakEven } from "./math";
import { cardFromString, evaluate7 } from "./evaluator";
import { matrixLabel, rangePercent } from "./cards";

const ev = (s: string) => evaluate7(s.split(" ").map(cardFromString));

describe("pot odds", () => {
  it("yarım pot bahse karşı %25 equity gerekir", () => {
    expect(requiredEquity(150, 50)).toBeCloseTo(0.25);
  });
  it("pot kadar blöf %50 fold ister", () => {
    expect(bluffBreakEven(100, 100)).toBeCloseTo(0.5);
  });
});

describe("outs", () => {
  it("floş çekişi (9 out) river'a kadar yaklaşık %35", () => {
    const r = outsProbability(9, "flop");
    expect(r.byRiver).toBeCloseTo(0.3497, 3);
    expect(r.nextCard).toBeCloseTo(9 / 47);
  });
  it("turn'de 8 out yaklaşık %17", () => {
    expect(outsProbability(8, "turn").byRiver).toBeCloseTo(8 / 46);
  });
});

describe("spr", () => {
  it("efektif stack küçük olandır", () => {
    expect(spr(100, 60, 12)).toEqual({ effective: 60, spr: 5 });
  });
});

describe("icm", () => {
  it("eşit stack'ler ödülü eşit paylaşır", () => {
    const r = icm([1000, 1000, 1000], [50, 30, 20]);
    r.forEach((v) => expect(v).toBeCloseTo(100 / 3));
  });
  it("toplam ödül korunur ve chip lideri chip payından az alır", () => {
    const r = icm([6000, 3000, 1000], [50, 30, 20]);
    expect(r.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(r[0]).toBeLessThan(60);
    expect(r[2]).toBeGreaterThan(20);
  });
  it("elle hesaplanan değerlerle aynı (Malmuth-Harville)", () => {
    // 3000/1000, 70/30: 0,75·70 + 0,25·30 = 60
    const hu = icm([3000, 1000], [70, 30]);
    expect(hu[0]).toBeCloseTo(60);
    expect(hu[1]).toBeCloseTo(40);
    // 5000/3000/2000, 50/30/20: P(1.)=0,5; P(2.)=0,3·5/7+0,2·5/8; P(3.)=kalan → 38,39
    const r = icm([5000, 3000, 2000], [50, 30, 20]);
    const p2 = 0.3 * (5 / 7) + 0.2 * (5 / 8);
    expect(r[0]).toBeCloseTo(0.5 * 50 + p2 * 30 + (1 - 0.5 - p2) * 20, 6);
    expect(r[0]).toBeCloseTo(38.39, 2);
  });
  it("sıfır stack'li oyuncu ödül almaz, diğerlerinin değeri onsuz hesapla aynı", () => {
    const withZero = icm([5000, 0, 3000, 2000], [50, 30, 20]);
    const without = icm([5000, 3000, 2000], [50, 30, 20]);
    expect(withZero[1]).toBe(0);
    expect([withZero[0], withZero[2], withZero[3]].map((v) => v.toFixed(9))).toEqual(without.map((v) => v.toFixed(9)));
  });
});

describe("parseNumberList (hesap makinesi girdisi)", () => {
  it("virgül, boşluk ve noktalı virgülle ayırır", () => {
    expect(parseNumberList("5000, 3000;1500  500")).toEqual({ values: [5000, 3000, 1500, 500], ignored: 0 });
  });
  it("Türkçe binlik ayırıcıyı binlik okur, ondalığı korur", () => {
    expect(parseNumberList("1.500, 12.000, 1.250.000").values).toEqual([1500, 12000, 1250000]);
    expect(parseNumberList("12.5 7.25 0.125").values).toEqual([12.5, 7.25, 0.125]);
  });
  it("sıfır, negatif ve okunamayan değerleri sayar, sessizce atmaz", () => {
    expect(parseNumberList("5000, 0, -20, abc, 3000")).toEqual({ values: [5000, 3000], ignored: 3 });
    expect(parseNumberList("")).toEqual({ values: [], ignored: 0 });
  });
});

describe("evaluator", () => {
  it("el sıralaması doğru", () => {
    const hands = [
      ev("Ah Kd 9s 7c 5h 3d 2c"), // yüksek kart
      ev("Ah Ad 9s 7c 5h 3d 2c"), // per
      ev("Ah Ad 9s 9c 5h 3d 2c"), // iki per
      ev("Ah Ad As 7c 5h 3d 2c"), // set
      ev("Ah 2d 3s 4c 5h Kd Qc"), // wheel
      ev("Ah Kh 9h 7h 5h 3d 2c"), // floş
      ev("Ah Ad As 7c 7h 3d 2c"), // full
      ev("Ah Ad As Ac 7h 3d 2c"), // kare
      ev("9h Th Jh Qh Kh 3d 2c"), // floş kent
    ];
    for (let i = 1; i < hands.length; i++) expect(hands[i]).toBeGreaterThan(hands[i - 1]);
  });
  it("kicker'ı ayırt eder", () => {
    expect(ev("Ah Kd Ac 7c 5h 3d 2c")).toBeGreaterThan(ev("As Qd Ad 7c 5h 3d 2c"));
  });
});

describe("matris", () => {
  it("etiketler", () => {
    expect(matrixLabel(0, 0)).toBe("AA");
    expect(matrixLabel(0, 1)).toBe("AKs");
    expect(matrixLabel(1, 0)).toBe("AKo");
  });
  it("tüm eller %100", () => {
    const all: string[] = [];
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) all.push(matrixLabel(r, c));
    expect(rangePercent(all)).toBeCloseTo(100);
  });
});
