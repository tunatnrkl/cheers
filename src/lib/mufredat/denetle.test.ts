import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import veri from "@/data/mufredat.json";
import { alistirmaDenetle, denetle } from "../../../scripts/mufredat/denetle.mts";

type Al = Parameters<typeof alistirmaDenetle>[0];
const m = veri as unknown as Parameters<typeof denetle>[0];
const kok = path.resolve(import.meta.dirname, "../../..");

describe("müfredat olgu denetimi (scripts/mufredat/denetle.mts)", () => {
  it("dolu derslerdeki hesaplanabilir cevapların hepsi doğru", () => {
    const s = denetle(m);
    expect(s.hatalar).toEqual([]);
    expect(s.eksik).toEqual([]);
    expect(s.denetlenen).toBeGreaterThan(0);
  });

  it("src/data/mufredat.json içerik dosyalarından üretilmiş ve güncel", () => {
    // --kontrol dosya yazmaz; çıktı güncel değilse 1 ile çıkar (execFileSync fırlatır).
    expect(() => execFileSync("python3", [path.join(kok, "scripts/mufredat/iskelet.py"), "--kontrol"], { stdio: "pipe" })).not.toThrow();
  });

  const temel = { kimlik: "a1", soru: "", neden: "", yanilgi: "" };
  const s = (soru: string, secenekler: string[], dogru: number, denetim: Al["denetim"]): Al => ({ ...temel, tip: "secmeli", soru, secenekler, dogru, denetim });

  it("yanlış kazananı yakalar (kicker)", () => {
    const a = s("Board: A♣ 8♦ 5♠ 3♥ 2♦. Ali: A♠ K♥. Berk: A♦ J♣.", ["Ali", "Berk", "Beraberlik"], 0,
      { tur: "kazanan", board: "A♣ 8♦ 5♠ 3♥ 2♦", eller: { Ali: "A♠ K♥", Berk: "A♦ J♣" } });
    expect(alistirmaDenetle(a)).toEqual([]);
    expect(alistirmaDenetle({ ...a, dogru: 2 }).join()).toMatch(/kazanan Ali/);
  });

  it("A-2-3-4-5 kentini ve astan dönmeyen kenti doğru tanır", () => {
    expect(alistirmaDenetle(s("A♠ 2♦ 3♣ 4♥ 5♠", ["Yüksek kart", "Kent"], 1, { tur: "kategori", kartlar: "A♠ 2♦ 3♣ 4♥ 5♠" }))).toEqual([]);
    expect(alistirmaDenetle(s("Q♠ K♦ A♣ 2♥ 3♠", ["Yüksek kart", "Kent"], 1, { tur: "kategori", kartlar: "Q♠ K♦ A♣ 2♥ 3♠" })).join()).toMatch(/Yüksek kart/);
  });

  it("nuts sorusunda daha zayıf floşu kabul etmez", () => {
    const a = s("Board: Q♥ J♥ 7♥ 4♠ 2♦.", ["A♥ 3♥", "A♥ K♥"], 0, { tur: "nuts", board: "Q♥ J♥ 7♥ 4♠ 2♦" });
    expect(alistirmaDenetle(a).join()).toMatch(/nuts eli/);
    expect(alistirmaDenetle({ ...a, dogru: 1 })).toEqual([]);
  });

  it("pot toplamını yeniden hesaplar ve virgüllü seçenekleri okur", () => {
    const a = s("Pot?", ["4 BB", "5 BB", "5,5 BB"], 2, { tur: "toplam", terimler: [0.5, 2.5, 2.5] });
    expect(alistirmaDenetle(a)).toEqual([]);
    expect(alistirmaDenetle({ ...a, dogru: 1 }).join()).toMatch(/hesaplanan 5.5/);
    const n: Al = { ...temel, tip: "sayi", soru: "Pot?", dogru: 34, denetim: { tur: "toplam", terimler: [6, 12, 12] } };
    expect(alistirmaDenetle(n).join()).toMatch(/hesaplanan 30/);
  });

  it("aynı kartın iki kez kullanılmasını ve soruda görünmeyen kartı yakalar", () => {
    expect(alistirmaDenetle(s("Board: A♣ 8♦ 5♠ 3♥ 2♦. Ali: A♣ K♥. Berk: A♦ J♣.", ["Ali", "Berk", "Beraberlik"], 0,
      { tur: "kazanan", board: "A♣ 8♦ 5♠ 3♥ 2♦", eller: { Ali: "A♣ K♥", Berk: "A♦ J♣" } })).join()).toMatch(/iki kez/);
    expect(alistirmaDenetle(s("Hangi eldir?", ["Per", "Kent"], 0, { tur: "kategori", kartlar: "K♠ K♦ 9♣ 5♥ 2♠" })).join()).toMatch(/görünmüyor/);
  });

  it("belirsiz 'kaç kapalı kart' sorusunu reddeder", () => {
    // Board A-A-K-K-Q, el Q-x: kız board'dan da elden de gelebilir.
    const a: Al = { ...temel, tip: "sayi", soru: "Elin: Q♦ 2♣. Board: A♠ A♥ K♣ K♦ Q♠.", dogru: 0, denetim: { tur: "cepKartSayisi", el: "Q♦ 2♣", board: "A♠ A♥ K♣ K♦ Q♠" } };
    expect(alistirmaDenetle(a).join()).toMatch(/belirsiz/);
  });
});
