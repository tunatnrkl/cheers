import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import veri from "@/data/mufredat.json";
import { HANDS } from "@/data/hands";
import { acilisDurumu, alistirmaDenetle, denetle, sayiOku } from "../../../scripts/mufredat/denetle.mts";

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

  it("seçenek sayılarını Türkçe yazımla okur (nokta binlik, virgül ondalık)", () => {
    expect(sayiOku("20.000")).toBe(20000);
    expect(sayiOku("1.000.000 chip")).toBe(1000000);
    expect(sayiOku("%27,3")).toBe(27.3);
    expect(sayiOku("1.250,5 BB")).toBe(1250.5);
    expect(sayiOku("5,5 BB")).toBe(5.5);
    // Eski okuma "20.000"i 20 sanıyordu: bölüm sorusunda yanlış seçeneği kabul etmemeli.
    const a = s("600.000 / 30?", ["2.000", "20", "20.000"], 2, { tur: "bolum", terimler: [600000, 30] });
    expect(alistirmaDenetle(a)).toEqual([]);
    expect(alistirmaDenetle({ ...a, dogru: 1 }).join()).toMatch(/hesaplanan 20000/);
  });

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
    // Bölüm yuvarlaması: 17,8 / 2,2 = 8,09… → 8,1 (tolerans 0,1) kabul; tolerans 0 ya da 1 reddedilir.
    const b: Al = { ...temel, tip: "sayi", soru: "", dogru: 8.1, tolerans: 0.1, denetim: { tur: "bolum", terimler: [17.8, 2.2] } } as Al;
    expect(alistirmaDenetle(b)).toEqual([]);
    expect(alistirmaDenetle({ ...b, tolerans: 0 } as Al).join()).toMatch(/hesaplanan 8.09/);
    expect(alistirmaDenetle({ ...b, dogru: 9, tolerans: 1 } as Al).join()).toMatch(/tolerans 1/);
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

  it("pozisyon: konuşma sırası, koltuk ve sonraki el", () => {
    const sira: Al = { ...temel, tip: "siralama", soru: "", secenekler: ["SB", "BB", "CO"], denetim: { tur: "konusmaSirasi", sokak: "postflop", oyuncular: ["SB", "CO", "BB"] } };
    expect(alistirmaDenetle(sira)).toEqual([]);
    expect(alistirmaDenetle({ ...sira, denetim: { ...sira.denetim!, sokak: "preflop" } }).join()).toMatch(/CO, SB, BB/);
    expect(alistirmaDenetle(s("Kim pozisyonda?", ["BTN", "BB"], 1, { tur: "konusmaSirasi", sokak: "postflop", oyuncular: ["BTN", "BB"], soru: "son" })).join()).toMatch(/son konuşan BTN/);
    const sonraki: Al = { ...temel, tip: "sayi", soru: "", dogru: 3, denetim: { tur: "konusmaSirasi", sokak: "preflop", soru: "sonraki", poz: "CO" } };
    expect(alistirmaDenetle(sonraki)).toEqual([]);
    expect(alistirmaDenetle({ ...sonraki, dogru: 5 }).join()).toMatch(/hesaplanan 3/);
    expect(alistirmaDenetle(s("?", ["UTG", "BB", "HJ"], 1, { tur: "sonrakiEl", poz: "UTG" }))).toEqual([]);
    expect(alistirmaDenetle(s("?", ["UTG", "BB", "HJ"], 2, { tur: "sonrakiEl", poz: "UTG" })).join()).toMatch(/koltuk BB/);
  });

  it("efektif stack: küçük stack ve BB'ye çevirme", () => {
    const a: Al = { ...temel, tip: "sayi", soru: "", dogru: 75, denetim: { tur: "efektif", stackler: [12000, 7500], bb: 100 } };
    expect(alistirmaDenetle(a)).toEqual([]);
    expect(alistirmaDenetle({ ...a, dogru: 120 }).join()).toMatch(/hesaplanan 75/);
    const e: Al = { ...temel, tip: "eslestirme", soru: "", secenekler: [["2.500 chip", "25 BB"], ["4.000 chip", "4 BB"], ["10.000 chip", "100 BB"]], denetim: { tur: "bolumEsleme", bb: 100 } };
    expect(alistirmaDenetle(e).join()).toMatch(/4\.000 chip/);
  });

  it("başlangıç elleri: kombinasyon, yüzde, yazım, matris ve aralık", () => {
    const k = (eller: string[], dogru: number): Al => ({ ...temel, tip: "sayi", soru: "", dogru, denetim: { tur: "kombo", eller } });
    expect(alistirmaDenetle(k(["AA", "AKs", "AKo"], 22))).toEqual([]);
    expect(alistirmaDenetle(k(["AKo"], 16)).join()).toMatch(/hesaplanan 12/);
    expect(alistirmaDenetle(k(["KAs"], 4)).join()).toMatch(/geçersiz el adı/);
    const y: Al = { ...temel, tip: "sayi", soru: "", dogru: 1.4, tolerans: 0.05, denetim: { tur: "yuzde", eller: ["AA", "KK", "QQ"] } } as Al;
    expect(alistirmaDenetle(y)).toEqual([]);
    expect(alistirmaDenetle({ ...y, dogru: 1.8 }).join()).toMatch(/1\.357/);
    expect(alistirmaDenetle(s("A♠ K♦", ["AKs", "AKo"], 0, { tur: "yazim", kartlar: "A♠ K♦" })).join()).toMatch(/AKo/);
    expect(alistirmaDenetle(s("?", ["AQs", "AQo"], 0, { tur: "matris", satir: "Q", sutun: "A" })).join()).toMatch(/hücre AQo/);
    const r: Al = { ...temel, tip: "range", soru: "", dogru: ["AKs", "KQs", "QJs", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s", "43s", "32s"], denetim: { tur: "rangeKume", kurallar: [{ tip: "suited", bosluk: 1 }] } };
    expect(alistirmaDenetle(r)).toEqual([]);
    expect(alistirmaDenetle({ ...r, dogru: [...(r.dogru as string[]).slice(1), "A2s"] }).join()).toMatch(/eksik: AKs, fazla: A2s/);
  });
});

describe("strateji denetimleri (ranges.json, gereken equity, spot bağları)", () => {
  const temel = { kimlik: "a1", soru: "", neden: "", yanilgi: "" };
  it("sitedeki 115 açılış spotunun cevabı betiğin aralık okumasıyla aynı", () => {
    const acilis = HANDS.filter((h) => h.id.startsWith("r-"));
    expect(acilis.length).toBeGreaterThan(100);
    const farkli = acilis.filter((h) => acilisDurumu(h.heroPos, h.id.split("-")[2]) !== (h.correct ? "ac" : "fold")).map((h) => h.id);
    expect(farkli).toEqual([]);
  });

  it("müfredattaki her spot alıştırması bağlandığı elin seçenek ve cevabıyla birebir aynı", () => {
    const byId = new Map(HANDS.map((h) => [h.id, h]));
    const hatali: string[] = [];
    for (const u of m.uniteler)
      for (const d of u.dersler)
        for (const a of d.alistirmalar as Al[] & { spotKimlik?: string }[]) {
          const k = (a as { spotKimlik?: string }).spotKimlik;
          if (!k) continue;
          const h = byId.get(k);
          if (!h || JSON.stringify(h.options) !== JSON.stringify(a.secenekler) || h.correct !== a.dogru) hatali.push(`${d.kimlik}/${a.kimlik} → ${k}`);
        }
    expect(hatali).toEqual([]);
  });

  it("açılış: kenardaki el işaretsizse ve yanlış karar verilmişse yakalar", () => {
    const s = (el: string, poz: string, dogru: number, ek: Record<string, unknown> = {}): Al =>
      ({ ...temel, tip: "secmeli", secenekler: ["Fold", "2,5 BB aç"], dogru, dogrulamaGerekli: false, denetim: { tur: "acilis", poz, el, ...ek } }) as Al;
    expect(alistirmaDenetle(s("AA", "UTG", 1))).toEqual([]);
    expect(alistirmaDenetle(s("72o", "BTN", 1)).join()).toMatch(/aralığa göre fold/);
    expect(alistirmaDenetle(s("AJo", "UTG", 1)).join()).toMatch(/kenarında/);
    expect(alistirmaDenetle(s("AJo", "UTG", 1, { sinir: true })).join()).toMatch(/dogrulamaGerekli/);
    expect(alistirmaDenetle({ ...s("AJo", "UTG", 1, { sinir: true }), dogrulamaGerekli: true } as Al)).toEqual([]);
    expect(alistirmaDenetle(s("AA", "UTG", 1, { sinir: true })).join()).toMatch(/sınırda değil/);
  });

  it("gereken equity = ödenecek / (pot + ödenecek)", () => {
    const n: Al = { ...temel, tip: "sayi", soru: "", dogru: 27.3, tolerans: 0.1, denetim: { tur: "gerekenEquity", call: 1.5, pot: 4 } } as Al;
    expect(alistirmaDenetle(n)).toEqual([]);
    expect(alistirmaDenetle({ ...n, dogru: 37.5 }).join()).toMatch(/27\.27/);
  });
});

describe("turnuva hesapları (ante'li pot, M oranı, BB erimesi, ortalama stack, ödül payları)", () => {
  const temel = { kimlik: "a1", soru: "", neden: "", yanilgi: "" };
  const n = (dogru: number, denetim: Al["denetim"], tolerans = 0): Al => ({ ...temel, tip: "sayi", dogru, tolerans, denetim }) as Al;

  it("ante'li pot: BB ante tek ante, klasik ante oyuncu başına", () => {
    expect(alistirmaDenetle(n(2.5, { tur: "antePot", sb: 0.5, bb: 1, ante: 1 }))).toEqual([]);
    // BB ante'yi oyuncu başına saymak (9 × 1) yakalanır.
    expect(alistirmaDenetle(n(10.5, { tur: "antePot", sb: 0.5, bb: 1, ante: 1 })).join()).toMatch(/hesaplanan 2.5/);
    expect(alistirmaDenetle(n(525, { tur: "antePot", sb: 100, bb: 200, ante: 25, anteTuru: "klasik", oyuncu: 9 }))).toEqual([]);
    expect(alistirmaDenetle(n(325, { tur: "antePot", sb: 100, bb: 200, ante: 25, anteTuru: "klasik", oyuncu: 9 })).join()).toMatch(/hesaplanan 525/);
    expect(alistirmaDenetle(n(525, { tur: "antePot", sb: 100, bb: 200, ante: 25, anteTuru: "klasik" })).join()).toMatch(/oyuncu sayısı/);
    expect(alistirmaDenetle(n(5, { tur: "antePot", sb: 0.5, bb: 1, ante: 1, ekler: [2.5] }))).toEqual([]);
  });

  it("M oranı = stack / (SB + BB + toplam ante); ante'yi unutan cevap yakalanır", () => {
    const m = n(20, { tur: "mOrani", stack: "10.000", sb: 100, bb: 200, ante: 200 });
    expect(alistirmaDenetle(m)).toEqual([]);
    expect(alistirmaDenetle({ ...m, dogru: 33.3, tolerans: 0.1 } as Al).join()).toMatch(/M: hesaplanan 20/);
    // Yuvarlama: 13,33… → 13,3 (tolerans 0,1) kabul; tolerans 1 reddedilir.
    expect(alistirmaDenetle(n(13.3, { tur: "mOrani", stack: 4000, sb: 100, bb: 200 }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(13, { tur: "mOrani", stack: 4000, sb: 100, bb: 200 }, 1)).join()).toMatch(/tolerans 1/);
    const sec: Al = { ...temel, tip: "secmeli", secenekler: ["M = 8", "M = 10", "M = 25"], dogru: 2, denetim: { tur: "mOrani", stack: 25, sb: 0.5, bb: 1, ante: 1 } };
    expect(alistirmaDenetle(sec).join()).toMatch(/M 10/);
    const dy: Al = { ...temel, tip: "dogruYanlis", dogru: true, denetim: { tur: "mOrani", stack: 25, sb: 0.5, bb: 1, ante: 1, iddia: 25 } };
    expect(alistirmaDenetle(dy).join()).toMatch(/hesaplanan cevap false/);
  });

  it("blind artışı: stack aynıyken BB cinsinden erime", () => {
    const y = n(25, { tur: "bbErime", stack: "10.000", eskiBb: 200, yeniBb: 400, sonuc: "yeni" });
    expect(alistirmaDenetle(y)).toEqual([]);
    expect(alistirmaDenetle({ ...y, dogru: 50 } as Al).join()).toMatch(/hesaplanan 25/);
    expect(alistirmaDenetle(n(25, { tur: "bbErime", stack: 10000, eskiBb: 200, yeniBb: 400, sonuc: "kayip" }))).toEqual([]);
  });

  it("ortalama stack = başlangıç × giriş / kalan", () => {
    const o = n(40, { tur: "ortalamaStack", baslangic: "20.000", giris: 200, kalan: 50, bb: 2000 });
    expect(alistirmaDenetle(o)).toEqual([]);
    expect(alistirmaDenetle({ ...o, dogru: 10 } as Al).join()).toMatch(/hesaplanan 40/);
    // Stack'in ortalamaya oranı (%): 45.000 / 50.000
    expect(alistirmaDenetle(n(90, { tur: "ortalamaStack", baslangic: 10000, giris: 100, kalan: 20, stack: "45.000" }))).toEqual([]);
    expect(alistirmaDenetle(n(45, { tur: "ortalamaStack", baslangic: 10000, giris: 100, kalan: 20, stack: "45.000" })).join()).toMatch(/hesaplanan 90/);
  });

  it("stack bölgesi: 40 BB ve üstü derin, 20–40 orta, 20'nin altı kısa", () => {
    const b = (stack: number, bb: number, dogru: number): Al => ({ ...temel, tip: "secmeli", secenekler: ["Derin stack", "Orta stack", "Kısa stack"], dogru, denetim: { tur: "bolge", stack, bb } });
    expect(alistirmaDenetle(b(24000, 1200, 1))).toEqual([]); // tam 20 BB: orta
    expect(alistirmaDenetle(b(24000, 1200, 2)).join()).toMatch(/20 BB: Orta/);
    expect(alistirmaDenetle(b(38000, 2000, 2))).toEqual([]);
    expect(alistirmaDenetle(b(20000, 500, 1)).join()).toMatch(/40 BB: Derin/);
  });

  it("ödül payları: toplamı 100 olmayan ya da artan tablo reddedilir", () => {
    expect(alistirmaDenetle(n(20, { tur: "odul", paylar: [50, 30, 20], soru: "fark", siralar: [1, 2] }))).toEqual([]);
    expect(alistirmaDenetle(n(30, { tur: "odul", paylar: [50, 30, 20], soru: "fark", siralar: [1, 2] })).join()).toMatch(/hesaplanan 20/);
    expect(alistirmaDenetle(n(3, { tur: "odul", paylar: [50, 30, 25], soru: "itm" })).join()).toMatch(/toplamı 100 değil/);
    expect(alistirmaDenetle(n(3, { tur: "odul", paylar: [50, 20, 30], soru: "itm" })).join()).toMatch(/artıyor/);
    expect(alistirmaDenetle(n(15, { tur: "odul", paylar: [40, 25, 20, 15], soru: "pay", sira: 5 })).join()).toMatch(/ödül almıyor/);
    expect(alistirmaDenetle(n(33.3, { tur: "odul", paylar: [50, 30, 20], soru: "itmOrani", katilimci: 18 }, 0.1)).join()).toMatch(/hesaplanan 16.6/);
    expect(alistirmaDenetle(n(33.3, { tur: "odul", paylar: [50, 30, 20], soru: "itmOrani", katilimci: 9 }, 0.1))).toEqual([]);
  });
});

describe("turnuva strateji hesapları (başabaş fold, oran, SPR, flop'ta set)", () => {
  const temel = { kimlik: "a1", soru: "", neden: "", yanilgi: "" };
  const n = (dogru: number, denetim: Al["denetim"], tolerans = 0): Al => ({ ...temel, tip: "sayi", dogru, tolerans, denetim }) as Al;

  it("başabaş fold oranı = risk / (risk + pot)", () => {
    expect(alistirmaDenetle(n(45.7, { tur: "basabasFold", risk: 2.1, pot: 2.5 }, 0.1))).toEqual([]);
    // Ante'siz pot (1,5 BB) ile hesaplanan %58,3 yakalanır.
    expect(alistirmaDenetle(n(58.3, { tur: "basabasFold", risk: 2.1, pot: 2.5 }, 0.1)).join()).toMatch(/başabaş fold oranı: hesaplanan 45.6/);
  });

  it("SPR = kalan efektif stack / flop'taki pot", () => {
    expect(alistirmaDenetle(n(2.6, { tur: "spr", stackler: [17.8, 40], pot: 6.9 }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(5.8, { tur: "spr", stackler: [17.8, 40], pot: 6.9 }, 0.1)).join()).toMatch(/SPR: hesaplanan 2.57/);
  });

  it("oran yüzdesi", () => {
    expect(alistirmaDenetle(n(8.8, { tur: "oranYuzde", terimler: [2.2, 25] }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(11.4, { tur: "oranYuzde", terimler: [2.2, 25] }, 0.1)).join()).toMatch(/hesaplanan 8.8/);
  });

  it("cep çifti flop'ta yaklaşık %11,8 set ya da daha iyisini yapar (19.600 flop sayılır)", () => {
    expect(alistirmaDenetle(n(11.8, { tur: "flopTutma", cep: "77" }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(7.5, { tur: "flopTutma", cep: "77", sonuc: "oran" }, 0.1))).toEqual([]);
    // Yanlış bir yüzde (%8) yakalanır.
    expect(alistirmaDenetle(n(8, { tur: "flopTutma", cep: "77" }, 0.1)).join()).toMatch(/flop'ta tutma yüzdesi: hesaplanan 11.7/);
    expect(alistirmaDenetle(n(11.8, { tur: "flopTutma", cep: "A7" }, 0.1)).join()).toMatch(/cep çifti/);
  });
});

describe("cash c7–c8 hesapları (bloker, outs, 2 ve 4 kuralı, equity, implied odds, spot fiyatı)", () => {
  const temel = { kimlik: "a1", soru: "", neden: "", yanilgi: "" };
  const n = (dogru: number, denetim: Al["denetim"], tolerans = 0, soru = ""): Al => ({ ...temel, soru, tip: "sayi", dogru, tolerans, denetim }) as Al;

  it("bloker: elinde A varken AA 3, AK 12; A ve K varken AK 9 kombinasyon", () => {
    expect(alistirmaDenetle(n(3, { tur: "blokerKombo", kartlar: "A♠", eller: ["AA"] }, 0, "A♠"))).toEqual([]);
    expect(alistirmaDenetle(n(12, { tur: "blokerKombo", kartlar: "A♠", eller: ["AKs", "AKo"] }, 0, "A♠"))).toEqual([]);
    expect(alistirmaDenetle(n(9, { tur: "blokerKombo", kartlar: "A♠ K♦", eller: ["AKs", "AKo"] }, 0, "A♠ K♦"))).toEqual([]);
    // Bloker etkisini unutan cevaplar (6, 16) yakalanır.
    expect(alistirmaDenetle(n(6, { tur: "blokerKombo", kartlar: "A♠", eller: ["AA"] }, 0, "A♠")).join()).toMatch(/hesaplanan 3/);
    expect(alistirmaDenetle(n(16, { tur: "blokerKombo", kartlar: "A♠", eller: ["AKs", "AKo"] }, 0, "A♠")).join()).toMatch(/hesaplanan 12/);
    expect(alistirmaDenetle(n(3, { tur: "blokerKombo", kartlar: "A♠", eller: ["AA"] }, 0, "elinde as")).join()).toMatch(/görünmüyor/);
  });

  it("outs kartlar tek tek denenerek sayılır; çifte sayım ve kirli out yakalanır", () => {
    const s = "9♥ 8♥ / T♥ 7♥ 2♠";
    expect(alistirmaDenetle(n(15, { tur: "outs", el: "9♥ 8♥", board: "T♥ 7♥ 2♠", hedef: "Kent" }, 0, s))).toEqual([]);
    expect(alistirmaDenetle(n(17, { tur: "outs", el: "9♥ 8♥", board: "T♥ 7♥ 2♠", hedef: "Kent" }, 0, s)).join()).toMatch(/outs: hesaplanan 15/);
    expect(alistirmaDenetle(n(9, { tur: "outs", el: "A♥ 5♥", board: "K♥ 9♥ 3♣", hedef: "Floş" }, 0, "A♥ 5♥ K♥ 9♥ 3♣"))).toEqual([]);
    // Eli zaten hedefte olan soru reddedilir.
    expect(alistirmaDenetle(n(0, { tur: "outs", el: "A♥ 5♥", board: "K♥ 9♥ 3♥", hedef: "Floş" }, 0, "A♥ 5♥ K♥ 9♥ 3♥")).join()).toMatch(/zaten/);
    // Öğretim örneği: 8 kent kartından ikisi rakibe floş verir → 6.
    const k = { tur: "kazandiranKart", el: "9♣ 8♣", rakip: "K♥ Q♥", board: "T♥ 7♥ 2♠ K♦" };
    const ks = "9♣ 8♣ K♥ Q♥ T♥ 7♥ 2♠ K♦";
    expect(alistirmaDenetle(n(6, k, 0, ks))).toEqual([]);
    expect(alistirmaDenetle(n(8, k, 0, ks)).join()).toMatch(/hesaplanan 6/);
  });

  it("2 ve 4 kuralı ile kesin ihtimal: 1 − C(47−outs, 2) / C(47, 2)", () => {
    expect(alistirmaDenetle(n(35.0, { tur: "tutma", outs: 9, sokak: "flop", kart: 2, sonuc: "gercek" }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(36, { tur: "tutma", outs: 9, sokak: "flop", kart: 2, sonuc: "gercek" }, 0.1)).join()).toMatch(/hesaplanan 34\.96/);
    expect(alistirmaDenetle(n(19.6, { tur: "tutma", outs: 9, sokak: "turn", sonuc: "gercek" }, 0.1))).toEqual([]);
    // Turn'de 47'ye bölmek (19,1) yakalanır.
    expect(alistirmaDenetle(n(19.1, { tur: "tutma", outs: 9, sokak: "turn", sonuc: "gercek" }, 0.1)).join()).toMatch(/hesaplanan 19\.56/);
    expect(alistirmaDenetle(n(5.9, { tur: "tutma", outs: 15, sokak: "flop", kart: 2, sonuc: "fark" }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(36, { tur: "tutma", outs: 9, sokak: "turn", kart: 2, sonuc: "kural" })).join()).toMatch(/sokak/);
    // Kartlar tek tek sayıldığında formülle aynı sonuç.
    const t = n(35.0, { tur: "tutmaKart", el: "A♥ 5♥", board: "K♥ 9♥ 3♣", hedef: "Floş" }, 0.1, "A♥ 5♥ K♥ 9♥ 3♣");
    expect(alistirmaDenetle(t)).toEqual([]);
    expect(alistirmaDenetle({ ...t, dogru: 36 } as Al).join()).toMatch(/tutma yüzdesi/);
  });

  it("el ele equity: flop'ta kesin sayım, preflop'ta Monte Carlo yalnızca seçmeli", () => {
    const e = n(45.9, { tur: "equityEle", el: "A♥ 5♥", rakip: "K♠ Q♦", board: "K♥ 9♥ 3♣" }, 0.1, "A♥ 5♥ K♠ Q♦ K♥ 9♥ 3♣");
    expect(alistirmaDenetle(e)).toEqual([]);
    expect(alistirmaDenetle({ ...e, dogru: 35 } as Al).join()).toMatch(/equity: hesaplanan 45\.8/);
    const s: Al = { ...temel, tip: "secmeli", soru: "A♠ A♥ K♣ K♦", secenekler: ["%50", "%82"], dogru: 1, denetim: { tur: "equityEle", el: "A♠ A♥", rakip: "K♣ K♦", yaklasik: 82 } };
    expect(alistirmaDenetle(s)).toEqual([]);
    expect(alistirmaDenetle({ ...s, denetim: { ...s.denetim!, yaklasik: 70 } }).join()).toMatch(/metinde %70/);
    expect(alistirmaDenetle(n(82, s.denetim, 1, s.soru)).join()).toMatch(/seçmeli yaz/);
  });

  it("implied odds başabaşı: X = call × (1/eq − 1) − pot", () => {
    // 3,7 × (47/9 − 1) − 9,2 ≈ 6,42
    expect(alistirmaDenetle(n(6.4, { tur: "impliedBasabas", call: 3.7, pot: 9.2, outs: 9, sokak: "flop" }, 0.1))).toEqual([]);
    // Potu düşmeyi unutmak (15,6) yakalanır.
    expect(alistirmaDenetle(n(15.6, { tur: "impliedBasabas", call: 3.7, pot: 9.2, outs: 9, sokak: "flop" }, 0.1)).join()).toMatch(/hesaplanan 6\.42/);
    expect(alistirmaDenetle(n(14.8, { tur: "impliedBasabas", call: 2.5, pot: 4, eq: 11.7551 }, 0.1))).toEqual([]);
    expect(alistirmaDenetle(n(1, { tur: "impliedBasabas", call: 2.5, pot: 4 })).join()).toMatch(/eq ya da outs/);
  });

  it("o-… spotlarının fiyatı drills.json'dan okunur", () => {
    const a: Al = { ...temel, tip: "spot", soru: "", denetim: { tur: "spotFiyat", spot: "o-Qc4c-3cTh7h8c", gereken: 45.4 } };
    expect(alistirmaDenetle(a)).toEqual([]);
    expect(alistirmaDenetle({ ...a, denetim: { ...a.denetim!, gereken: 54.8 } }).join()).toMatch(/gereken equity %45\.4/);
    // Gevşek tolerans yok: %45,44 yerine %45,6 (ya da yuvarlanmış %45) yakalanır.
    expect(alistirmaDenetle({ ...a, denetim: { ...a.denetim!, gereken: 45.6 } }).join()).toMatch(/gereken equity %45\.4/);
    expect(alistirmaDenetle({ ...a, denetim: { ...a.denetim!, gereken: 45 } }).join()).toMatch(/gereken equity %45\.4/);
    expect(alistirmaDenetle({ ...a, denetim: { ...a.denetim!, spot: "o-yok" } }).join()).toMatch(/spot yok/);
  });
});
