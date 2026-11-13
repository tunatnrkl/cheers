import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HAND_BY_ID, HANDS, type Hand } from "@/data/hands";
import { applyHero, createHand, legalActions, type EngineState, type HeroKarar } from "@/lib/poker/engine";
import { kalanBoard, boyutSikistir, hizOku, hizYaz } from "./elAkisi";
import {
  BOS_FILTRE,
  PF_CASH,
  PF_TURNUVA,
  etkinFiltre,
  filtreOku,
  filtreYaz,
  havuz,
  pfOf,
  preflopTuru,
  sayilar,
  type PreflopTuru,
} from "./filtreler";
import { aksiyonCumlesi, aksiyonEtiketi, baslangicGorunumu, gorunumHesapla, sonRakipAksiyonu } from "./gorunum";
import { geriBildirimCumlesi, secenekBoyutu, secenekSirasi, spotKisayollari } from "./ilkKarar";
import { KARAR_ANAHTARI, KARAR_SINIRI, elKararlariniYaz, kararlariOku } from "./kararDeposu";
import { SERBEST_SORU_YANITI, boardDokusu, nedenYaniti, planYaniti, potOddsYaniti, soruTuru, sprHesapla } from "./koc";

const el = (id: string) => HAND_BY_ID.get(id)!;

class Bellek {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

/** Pasif hatla eli sonuna kadar oynatır. */
function pasif(s: EngineState): EngineState {
  for (let i = 0; i < 12 && !s.result; i++) {
    const l = legalActions(s);
    s = applyHero(s, l.check ? { tür: "check" } : { tür: "call" }).state;
  }
  return s;
}

describe("kurulum filtreleri", () => {
  it("her spotun bir preflop türü var ve oyuna uygun", () => {
    for (const h of HANDS) {
      const t = preflopTuru(h);
      if (h.game === "cash") expect(PF_CASH, h.id).toContain(t);
      else expect([...PF_CASH, ...PF_TURNUVA], h.id).toContain(t);
    }
  });

  it("veriden çıkarılan türler: örnek spotlar", () => {
    const beklenen: Record<string, PreflopTuru> = {
      c01: "acilis", // UTG ilk giren
      c11: "iso", // limp'e karşı karar
      c10: "3bet", // açılış + 3-bet
      c24: "4bet", // raise, raise, raise, call
      c36: "squeeze", // açılış + call, karar hero'da
      c26: "srp", // tek açılış ve call, flop
      t13: "callshove", // önünde all-in
    };
    for (const [id, t] of Object.entries(beklenen)) expect(pfOf(el(id)), id).toBe(t);
    expect(HANDS.filter((h) => h.game === "turnuva" && h.street === "preflop" && h.seq.length === 0).every((h) => pfOf(h) === "pushfold")).toBe(true);
  });

  it("veride karşılığı olmayan seçenek 0 sayılır; toplamlar tutarlı", () => {
    const n = sayilar(BOS_FILTRE, "pf", [...PF_CASH, ...PF_TURNUVA]);
    expect(n.get("limp")).toBe(0);
    const toplam = [...n.values()].reduce((a, b) => a + b, 0);
    expect(toplam).toBe(HANDS.length);
    const sokak = sayilar(BOS_FILTRE, "sokak", ["preflop", "flop", "turn", "river"]);
    expect([...sokak.values()].reduce((a, b) => a + b, 0)).toBe(HANDS.length);
  });

  it("filtreler birleşir; Karışık = tüm spotlar", () => {
    expect(havuz(BOS_FILTRE)).toHaveLength(HANDS.length);
    const f = { oyun: "cash" as const, sokak: "turn" as const, pf: "srp" as const, konu: "odds" as const };
    const h = havuz(f);
    expect(h.length).toBeGreaterThan(0);
    expect(h.every((x) => x.game === "cash" && x.street === "turn" && x.topic === "odds" && pfOf(x) === "srp")).toBe(true);
    expect(etkinFiltre(f)).toBe(4);
    expect(etkinFiltre(BOS_FILTRE)).toBe(0);
  });

  it("adres parametreleri okunur ve yazılır; geçersizler yok sayılır", () => {
    const q = new URLSearchParams("oyun=turnuva&sokak=flop&pf=srp&konu=spr");
    const f = filtreOku(q);
    expect(f).toEqual({ oyun: "turnuva", sokak: "flop", pf: "srp", konu: "spr" });
    expect(filtreOku(new URLSearchParams(filtreYaz(f)))).toEqual(f);
    expect(filtreOku(new URLSearchParams("oyun=poker&sokak=x&pf=y&konu=z"))).toEqual(BOS_FILTRE);
    expect(filtreYaz(BOS_FILTRE)).toBe("");
  });
});

describe("karar kaydı deposu", () => {
  const karar = (sokak: HeroKarar["sokak"], kademe: HeroKarar["kademe"], tahmini: boolean): HeroKarar => ({
    sokak,
    aksiyon: "call",
    miktar: 3,
    potOnce: 10,
    kademe,
    tahmini,
    gerekce: "x",
  });

  it("yalnızca ilk karardan sonrakiler yazılır, sürümlü anahtar kullanılır", () => {
    const st = new Bellek();
    expect(elKararlariniYaz("c26", [karar("flop", "en-iyi", false)], st)).toBe(false);
    expect(st.m.size).toBe(0);
    expect(elKararlariniYaz("c26", [karar("flop", "en-iyi", false), karar("turn", "kabul", true)], st)).toBe(true);
    expect([...st.m.keys()]).toEqual([KARAR_ANAHTARI]);
    const d = JSON.parse(st.getItem(KARAR_ANAHTARI)!);
    expect(d.v).toBe(1);
    expect(d.eller[0].kararlar).toEqual([{ sokak: "turn", aksiyon: "call", miktar: 3, kademe: "kabul", tahmini: true }]);
    expect(Object.keys(d.eller[0].kararlar[0])).not.toContain("gerekce");
  });

  it("eski pd- anahtarlarına dokunmaz; en yeni başta, sınırlı", () => {
    const st = new Bellek();
    st.setItem("pd-cevaplar", "[1]");
    for (let i = 0; i < KARAR_SINIRI + 5; i++) elKararlariniYaz(`h${i}`, [karar("flop", "hata", false), karar("river", "hata", true)], st);
    const eller = kararlariOku(st);
    expect(eller).toHaveLength(KARAR_SINIRI);
    expect(eller[0].handId).toBe(`h${KARAR_SINIRI + 4}`);
    expect(st.getItem("pd-cevaplar")).toBe("[1]");
  });

  it("bozuk ya da farklı sürümlü veri boş liste döner; depolama hatası yutulur", () => {
    const st = new Bellek();
    st.setItem(KARAR_ANAHTARI, "{bozuk");
    expect(kararlariOku(st)).toEqual([]);
    st.setItem(KARAR_ANAHTARI, JSON.stringify({ v: 2, eller: [] }));
    expect(kararlariOku(st)).toEqual([]);
    const patlak = {
      getItem: () => {
        throw new Error("kapalı");
      },
      setItem: () => {
        throw new Error("kapalı");
      },
    };
    expect(kararlariOku(patlak)).toEqual([]);
    expect(elKararlariniYaz("c26", [karar("flop", "en-iyi", false), karar("turn", "kabul", true)], patlak)).toBe(false);
  });
});

describe("görünüm ve son rakip aksiyonu", () => {
  it("karar anında son rakip aksiyonu spot geçmişinden gelir (fold'lar atlanır)", () => {
    const s = createHand(el("c26")); // flop: CO bet 1,8
    const r = sonRakipAksiyonu(s);
    expect(r?.koltuk).toBe("CO");
    expect(r?.son).toEqual({ aksiyon: "bet", miktar: 1.8 });
    expect(r?.olay).toBe(-1);
    expect(aksiyonCumlesi(r!.koltuk, r!.son)).toBe("CO 1,8 BB bahis yaptı");
    expect(aksiyonEtiketi(r!.son)).toBe("Bet 1,8");
  });

  it("ilk giren hero için son rakip aksiyonu yok", () => {
    expect(sonRakipAksiyonu(createHand(el("c01")))).toBeNull();
  });

  it("karar sonrası son `aksiyon` olayından türetilir; yeni sokakta ilk konuşan hero ise yok", () => {
    for (const h of HANDS.filter((x) => x.street !== "river").slice(0, 120)) {
      let s = createHand(h);
      for (let i = 0; i < 6 && !s.result; i++) {
        const l = legalActions(s);
        s = applyHero(s, l.check ? { tür: "check" } : { tür: "call" }).state;
        if (s.result) break;
        const r = sonRakipAksiyonu(s);
        // Son olaydan geriye: hero aksiyonu ya da sokak olayına kadar fold olmayan son rakip aksiyonu
        let beklenen: number | null = null;
        for (let j = s.olaylar.length - 1; j >= 0; j--) {
          const o = s.olaylar[j];
          if (o.tür === "sokak" || (o.tür === "aksiyon" && o.koltuk === h.heroPos)) break;
          if (o.tür === "aksiyon" && o.aksiyon !== "fold") {
            beklenen = j;
            break;
          }
        }
        expect(r?.olay ?? null, h.id).toBe(beklenen);
        if (r) expect(r.koltuk).not.toBe(h.heroPos);
      }
    }
  });

  it("görünüm olaylarla motorun son durumuna ulaşır; showdown öncesi açık el yok", () => {
    for (const id of ["c26", "c29", "c24", "t23", "o-Qc4c-3cTh7h8c"]) {
      const h = el(id);
      const s0 = createHand(h);
      const b = baslangicGorunumu(s0);
      const s = pasif(s0);
      const sdIdx = s.olaylar.findIndex((o) => o.tür === "showdown");
      for (let n = 0; n <= s.olaylar.length; n++) {
        const g = gorunumHesapla(b, s.olaylar, n);
        if (sdIdx < 0 || n <= sdIdx) expect(g.acik, `${id} ${n}`).toBeNull();
      }
      const son = gorunumHesapla(b, s.olaylar, s.olaylar.length);
      expect(son.board).toEqual(s.board);
      expect(son.sonuc?.neden).toBe(s.result?.neden);
      // Dağıtımdan sonra stack'ler motorla aynı
      for (const p of ["UTG", "HJ", "CO", "BTN", "SB", "BB"] as const) if (s.seats[p].present) expect(son.seats[p].stack, `${id} ${p}`).toBeCloseTo(s.seats[p].stack, 2);
    }
  });
});

describe("ilk karar eşlemesi", () => {
  it("önerilen hamle doğru seçeneğe, hata başka seçeneğe eşlenir", () => {
    for (const h of HANDS.slice(0, 200)) {
      const s = createHand(h);
      const l = legalActions(s);
      for (const a of [{ tür: "fold" as const }, l.check ? { tür: "check" as const } : { tür: "call" as const }, { tür: "allin" as const }]) {
        if (a.tür === "fold" && !l.fold) continue;
        let res;
        try {
          res = applyHero(s, a);
        } catch {
          continue;
        }
        const k = res.state.decisions[0];
        const i = secenekSirasi(h, a, k, l);
        expect(i, h.id).toBeGreaterThanOrEqual(0);
        expect(i, h.id).toBeLessThan(h.options.length);
        expect(i === h.correct, `${h.id} ${a.tür} ${k.kademe}`).toBe(k.kademe !== "hata");
      }
    }
  });

  it("seçenek boyutları kısayola çevrilir", () => {
    expect(secenekBoyutu("3-bet 9 BB", 4)).toBe(9);
    expect(secenekBoyutu("Call (3 BB)", 4)).toBeNull();
    expect(secenekBoyutu("1/3 pot bahis", 9)).toBe(3);
    const h = el("c38");
    const s = createHand(h);
    const ek = spotKisayollari(h, s.pot, legalActions(s));
    expect(ek.map((k) => k.miktar)).toContain(9);
  });

  it("geri bildirim cümlesi kısa ve gerekçeyi içermez", () => {
    const h = el("c26");
    for (const kademe of ["en-iyi", "kabul", "hata"] as const)
      for (const tahmini of [false, true]) {
        const c = geriBildirimCumlesi({ kademe, tahmini, gerekce: "GEREKCE" }, h, !tahmini);
        expect(c).not.toContain("GEREKCE");
        expect(c).not.toContain(h.reasoning);
      }
  });
});

describe("koç: kural tabanlı yanıtlar", () => {
  it("pot odds adım adım ve doğru", () => {
    const y = potOddsYaniti(7.3, 1.8);
    expect(y).toContain("7,3 + 1,8 = 9,1 BB");
    expect(y).toContain("1,8 ÷ 9,1 ≈ **%19,8**"); // 1,8 / 9,1 = 0,1978
    expect(potOddsYaniti(8, undefined)).toMatch(/önünde ödenecek bir bahis yok/);
  });

  it("o anki durumdan: c26'da pot ve call motordan gelir", () => {
    const s = createHand(el("c26"));
    const l = legalActions(s);
    expect(l.call).toBe(1.8);
    expect(potOddsYaniti(s.pot, l.call)).toContain(`${String(s.pot).replace(".", ",")} + 1,8`);
  });

  it("board dokusu ve SPR nötr dille", () => {
    expect(boardDokusu(["Kh", "7h", "2h"])).toContain("board'da aynı renkten üç kart var; floş mümkün");
    expect(boardDokusu(["Kh", "7d", "2c"])).toEqual(["board farklı renklerden (gökkuşağı)", "kartlar dağınık; kent ihtimali düşük"]);
    expect(boardDokusu(["9h", "8d", "7c"]).join()).toMatch(/kent ihtimalleri var/);
    expect(boardDokusu(["Ah", "2d", "3c"]).join()).toMatch(/kent ihtimalleri var/);
    expect(boardDokusu(["Kh", "Kd", "2c"])).toContain("board eşli");
    const s = createHand(el("c26"));
    const spr = sprHesapla(s)!;
    expect(spr).toBeCloseTo(Math.min(s.seats.BB.stack, s.seats.CO.stack) / s.pot, 5);
    const plan = planYaniti(s);
    expect(plan).toMatch(/kesin bir strateji değildir/);
    expect(plan).not.toMatch(/kesinlikle|her zaman|garanti/i);
  });

  it("Neden? ilk karardan önce gerekçeyi açmaz; sonra spot gerekçesi ve tahmini etiketler", () => {
    const h = el("c26");
    expect(nedenYaniti(h, [])).not.toContain(h.reasoning);
    const s = pasif(createHand(h));
    const y = nedenYaniti(h, s.decisions);
    expect(y).toContain(h.reasoning);
    if (s.decisions.length > 1) expect(y).toContain("tahmini değerlendirme");
  });

  it("soru türü ve serbest soru yanıtı", () => {
    expect(soruTuru("Neden?")).toBe("Neden?");
    expect(soruTuru("Pot odds nedir?")).toBe("Pot odds nedir?");
    expect(soruTuru("Bu board'da planım ne olmalı?")).toBe("Bu board'da planım ne olmalı?");
    expect(soruTuru("merhaba")).toBeNull();
    expect(SERBEST_SORU_YANITI).toMatch(/hazır sorularla/);
    expect(SERBEST_SORU_YANITI).not.toMatch(/yapay zeka/i);
  });
});

describe("el akışı yardımcıları", () => {
  it("fold sonrası kalan board: yalnızca board, spota bağlı ve pasif hatla aynı", () => {
    let n = 0;
    for (const h of HANDS.filter((x: Hand) => x.street === "flop" || x.street === "turn").slice(0, 40)) {
      const s = createHand(h);
      if (!legalActions(s).fold) continue;
      const kb = kalanBoard(s);
      const tam = pasif(s);
      if (tam.board.length === 5) {
        expect(kb, h.id).toEqual(tam.board);
        n++;
      }
      expect(kb.slice(0, s.board.length)).toEqual(s.board);
    }
    expect(n).toBeGreaterThan(5);
  });

  it("boyut aralığa sıkışır ve 0,5 BB'ye yuvarlanır", () => {
    const l = legalActions(createHand(el("c26")));
    const a = l.raise!;
    expect(boyutSikistir(0, l)).toBe(a.min);
    expect(boyutSikistir(1e9, l)).toBe(a.max);
    expect(boyutSikistir(7.3, l)).toBe(7.5);
  });

  it("hız ayarı okunur/yazılır, bozuksa Normal", () => {
    const st = new Bellek();
    expect(hizOku(st)).toBe("normal");
    hizYaz("aninda", st);
    expect(hizOku(st)).toBe("aninda");
    st.setItem("cheers:alistirma-ayar:v1", "bozuk");
    expect(hizOku(st)).toBe("normal");
  });
});

describe("gizlilik: arayüz kaynakları", () => {
  it("alıştırma ve masa bileşenleri gizli dağıtımı, aralık modülünü ya da rakip kartı alanını kullanmaz", () => {
    const kok = path.resolve(import.meta.dirname, "../../../..");
    const dosyalar: string[] = [];
    const gez = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) gez(p);
        else if (/\.tsx?$/.test(f) && !f.endsWith(".test.ts")) dosyalar.push(p);
      }
    };
    gez(path.join(kok, "src/app/alistirma"));
    gez(path.join(kok, "src/components/masa"));
    dosyalar.push(path.join(kok, "src/components/CoachChat.tsx"));
    expect(dosyalar.length).toBeGreaterThan(8);
    for (const f of dosyalar) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/gizliDagitim|engine\/araliklar|\bvillain\b/);
    }
  });
});
