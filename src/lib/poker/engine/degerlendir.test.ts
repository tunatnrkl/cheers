// Değerlendirme (ilk karar: spot cevabı; sonrakiler: tahmini), el adları ve el sonu özeti.
import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { applyHero, createHand, evaluate, legalActions, optionKind, summarize } from "./index";
import { elAdi, kartlar } from "./kartlar";
import type { EngineState, HeroAksiyon } from "./types";

const spot = (id: string) => HANDS.find((h) => h.id === id)!;
const pasif = (s: EngineState): HeroAksiyon => (legalActions(s).check ? { tür: "check" } : { tür: "call" });
const TEK_CUMLE = (g: string) => g.endsWith(".") && !/[.!?]\s+[A-ZÇĞİÖŞÜ]/.test(g.slice(0, -1));

describe("optionKind (PokerTable kopyası)", () => {
  it("seçenek metinlerini aksiyon türüne çevirir", () => {
    expect(optionKind("Fold")).toBe("fold");
    expect(optionKind("Limp (1 BB)")).toBe("call");
    expect(optionKind("Call (3,7 BB)")).toBe("call");
    expect(optionKind("Check (kartları aç)")).toBe("check");
    expect(optionKind("Check-raise 13 BB")).toBe("raise");
    expect(optionKind("1/2 pot bahis (≈5,5 BB)")).toBe("bet");
    expect(optionKind("All-in (78 BB)")).toBe("allin");
    expect(optionKind("2,5 BB aç")).toBe("raise");
  });
});

describe("ilk karar: spotun yazılı cevabı", () => {
  it("doğru seçeneğe eşlenen hamle en-iyi, yanlışı hata; tahmini değil", () => {
    const s = createHand(spot("c17")); // doğru: Call (3,7 BB)
    expect(evaluate(s, { tür: "call" })).toMatchObject({ kademe: "en-iyi", tahmini: false });
    const f = evaluate(s, { tür: "fold" });
    expect(f).toMatchObject({ kademe: "hata", tahmini: false });
    expect(f.gerekce).toContain("Call (3,7 BB)");
    expect(evaluate(s, { tür: "allin" })).toMatchObject({ kademe: "hata", tahmini: false });
  });

  it("serbest boyut en yakın seçeneğe eşlenir; boyut çok farklıysa kabul", () => {
    const s = createHand(spot("c07")); // doğru: 3-bet 7,5 BB
    expect(evaluate(s, { tür: "raise", miktar: 7.5 }).kademe).toBe("en-iyi");
    expect(evaluate(s, { tür: "raise", miktar: 8 }).kademe).toBe("en-iyi");
    expect(evaluate(s, { tür: "raise", miktar: 15 })).toMatchObject({ kademe: "kabul", tahmini: false });
    expect(evaluate(s, { tür: "call" }).kademe).toBe("hata");
  });

  it("all-in ve min-raise seçenekleri eşlenir", () => {
    const s = createHand(spot("t01")); // Fold, Min-raise (2 BB), All-in (10 BB); doğru: all-in
    expect(evaluate(s, { tür: "allin" }).kademe).toBe("en-iyi");
    expect(evaluate(s, { tür: "raise", miktar: legalActions(s).raise!.max }).kademe).toBe("en-iyi");
    expect(evaluate(s, { tür: "raise", miktar: 2 }).kademe).toBe("hata");
  });

  it("preflop'ta seçeneklerde olmayan hamle spotun önerisine göre hata", () => {
    const s = createHand(spot("c03")); // Fold, 2,5 BB aç, 5 BB aç
    const e = evaluate(s, { tür: "call" });
    expect(e).toMatchObject({ kademe: "hata", tahmini: false });
    expect(e.gerekce).toContain("2,5 BB aç");
  });

  it("tüm spotlarda doğru seçeneğe karşılık gelen hamle en-iyi çıkar", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const s = createHand(h);
      const l = legalActions(s);
      const opt = h.options[h.correct];
      const k = optionKind(opt);
      const a = l.bet ?? l.raise;
      let act: HeroAksiyon | null = null;
      if (k === "fold") act = { tür: "fold" };
      else if (k === "check") act = l.check ? { tür: "check" } : null;
      else if (k === "call") act = { tür: "call" };
      else if (k === "allin") act = { tür: "allin" };
      else if (a) {
        const m = opt.match(/(\d+(?:,\d+)?)\s*BB/);
        const f = opt.match(/(\d+)\/(\d+)\s*pot/);
        const to = m ? Number(m[1].replace(",", ".")) : f ? (Number(f[1]) / Number(f[2])) * s.pot : opt.toLowerCase().startsWith("pot") ? s.pot : a.min;
        act = { tür: l.bet ? "bet" : "raise", miktar: Math.min(Math.max(to, a.min), a.max) };
      }
      if (!act) continue;
      const e = evaluate(s, act);
      if (e.kademe !== "en-iyi" || e.tahmini) bad.push(`${h.id}: "${opt}" → ${e.kademe}`);
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });
});

describe("sonraki kararlar: kural tabanlı tahmin", () => {
  /** Pasif hatla, ilk karardan sonraki tüm hero karar anlarını toplar. */
  function sonrakiDurumlar(limit: number): EngineState[] {
    const out: EngineState[] = [];
    for (const h of HANDS.filter((x) => x.street !== "preflop" || x.id.startsWith("c"))) {
      let s = applyHero(createHand(h), pasif(createHand(h))).state;
      while (!s.result && out.length < limit) {
        out.push(s);
        s = applyHero(s, pasif(s)).state;
      }
      if (out.length >= limit) break;
    }
    return out;
  }
  const durumlar = sonrakiDurumlar(60);

  it("her zaman tahmini, Türkçe tek cümle ve kesinlik iddiası yok", () => {
    expect(durumlar.length).toBeGreaterThan(20);
    for (const s of durumlar) {
      const l = legalActions(s);
      const acts: HeroAksiyon[] = [];
      if (l.fold) acts.push({ tür: "fold" });
      if (l.check) acts.push({ tür: "check" });
      if (l.call !== undefined) acts.push({ tür: "call" });
      const a = l.bet ?? l.raise;
      if (a) acts.push({ tür: l.bet ? "bet" : "raise", miktar: a.kısayollar[0].miktar }, { tür: "allin" });
      for (const act of acts) {
        const e = evaluate(s, act);
        expect(e.tahmini).toBe(true);
        expect(["en-iyi", "kabul", "hata"]).toContain(e.kademe);
        expect(TEK_CUMLE(e.gerekce), e.gerekce).toBe(true);
        expect(e.gerekce).not.toMatch(/kesin|mutlaka|her zaman|solver/i);
        expect(e.gerekce).not.toMatch(/\d\.\d/); // ondalık virgül
      }
    }
  });

  it("call/fold kademesi equity ile pot odds farkına uyar; ±5 puan içi kabul", () => {
    let kontrol = 0;
    for (const s of durumlar) {
      const l = legalActions(s);
      if (l.call === undefined) continue;
      for (const act of [{ tür: "call" }, { tür: "fold" }] as HeroAksiyon[]) {
        const e = evaluate(s, act);
        const m = e.gerekce.match(/equity'n yaklaşık %(\d+), call için gereken %(\d+)/);
        expect(m, e.gerekce).not.toBeNull();
        const fark = Number(m![1]) - Number(m![2]);
        if (Math.abs(Math.abs(fark) - 5) <= 1) continue; // yuvarlama sınırı
        if (Math.abs(fark) < 5) expect(e.kademe).toBe("kabul");
        else if (act.tür === "fold") expect(e.kademe).toBe(fark < 0 ? "en-iyi" : "hata");
        else if (fark > 0) expect(e.kademe).toBe("en-iyi");
        else expect(["kabul", "hata"]).toContain(e.kademe); // çekiş payı kabul'e çekebilir
        kontrol++;
      }
    }
    expect(kontrol).toBeGreaterThan(5);
  });

  it("değerlendirme deterministiktir ve gerçek rakip eline bakmaz (aynı açık bilgi → aynı sonuç)", () => {
    for (const s of durumlar.slice(0, 10)) {
      expect(evaluate(s, pasif(s))).toEqual(evaluate(s, pasif(s)));
    }
  });
});

describe("el adları (Türkçe)", () => {
  const ad = (s: string) => elAdi(kartlar(s));
  it("kategoriler", () => {
    expect(ad("AsKsQsJsTs")).toBe("royal floş");
    expect(ad("9s8s7s6s5sAhAd")).toBe("kent floş");
    expect(ad("AsAhAdAc2s")).toBe("kare");
    expect(ad("KsKhKd2c2s")).toBe("full house");
    expect(ad("As9s7s4s2sKd")).toBe("floş");
    expect(ad("5h4d3c2sAh")).toBe("kent");
    expect(ad("7s7h7dKc2s")).toBe("üçlü");
    expect(ad("KsKh2d2cAs")).toBe("iki per");
    expect(ad("QsQh9d4c2s")).toBe("per");
    expect(ad("AsJh9d4c2s")).toBe("yüksek kart");
  });
});

describe("el sonu özeti", () => {
  it("showdown'lı elde kararlar, pot seyri, sonuç ve ders var", () => {
    let s = createHand(spot("t17"));
    s = applyHero(s, { tür: "call" }).state;
    const o = summarize(s);
    expect(o.kararlar).toHaveLength(1);
    expect(o.kararlar[0]).toMatchObject({ sokak: "preflop", aksiyon: "call", tahmini: false });
    expect(o.potSeyri.map((p) => p.sokak)).toEqual(["preflop", "flop", "turn", "river", "son"]);
    // İlk değer karar anındaki pot; son değer dağıtılan pot (karşılanmayan fazla iade edildiği için düşebilir)
    expect(o.potSeyri[0].pot).toBe(spot("t17").potBB);
    expect(o.potSeyri.at(-1)!.pot).toBe(s.result!.pot);
    expect(o.showdown).toHaveLength(2);
    expect(o.sonucMetni).toMatch(/^Showdown: /);
    expect(o.sonucMetni).not.toMatch(/\d\.\d/);
    expect(o.ders.length).toBeGreaterThan(20);
  });

  it("fold edilen elde rakip kartı yok ve sonuç metni fold'u anlatır", () => {
    const { state } = applyHero(createHand(spot("c17")), { tür: "fold" });
    const o = summarize(state);
    expect(o.showdown).toBeNull();
    expect(o.sonuc!.neden).toBe("hero-fold");
    expect(o.sonucMetni).toMatch(/^Fold ettin/);
    expect(o.ders).toContain("flop kararın"); // doğru cevap call'du: fold hata
  });
});
