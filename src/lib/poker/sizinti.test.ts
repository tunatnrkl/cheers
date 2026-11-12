// Sızıntı testi (KARARLAR.md karar 3, ONAY-AJANI.md değişmez 7): el bitmeden rakibin eli
// hiçbir yerde görünmez. Spot verisi, masada çizilen alanlar ve koça giden bağlam denetlenir.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/db", () => ({ db: {} }));
vi.mock("@/lib/server/auth", () => ({ sha256: (s: string) => s }));

import { HANDS, type Hand } from "@/data/hands";
import drills from "@/data/drills.json";
import { describeHand } from "@/lib/server/ai";

// Art arda yazılmış en az iki kart: "AhKd", "A♠ K♦", "A♠K♦", "10♥ 9♣". Tek kart ("A♠ blocker'ı")
// ve harfle yazılan aralıklar ("AK, KQ, 99", "A5s", "T9s") somut el değildir, eşleşmez.
const KART = /(?:10|[2-9TJQKA])[shdc♠♥♦♣]/g;
const KART_DIZISI = /(?<![\p{L}\p{N}])(?:(?:10|[2-9TJQKA])[shdc♠♥♦♣]\s?){2,}(?![\p{L}\p{N}])/gu;
const SIMGE: Record<string, string> = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
const yalin = (kart: string) => kart.replace("10", "T").replace(/[♠♥♦♣]/, (c) => SIMGE[c]);
const kartlar = (s: string | undefined) => (s ?? "").match(/.{2}/g) ?? [];

/** Metinde, hero eli ve board dışında kart içeren kart dizileri (rakip eli olabilecek yazımlar). */
function yabanciEller(metin: string, h: Pick<Hand, "hero" | "board">): string[] {
  const bilinen = new Set([...kartlar(h.hero), ...kartlar(h.board)]);
  return (metin.match(KART_DIZISI) ?? []).map((e) => e.trim()).filter((e) => (e.match(KART) ?? []).some((k) => !bilinen.has(yalin(k))));
}

// Cevaptan ÖNCE görünen ya da veriyle birlikte tarayıcıya giden her alan. `hero` ve `board`
// kahramanın kendi bilgisi; `seq` ayrıca denetlenir; `reasoning` cevaptan sonra gösterildiği için ayrı.
const AYRI = new Set(["hero", "board", "seq", "reasoning", "id"]);
const onAlanlar = (h: Hand) =>
  Object.entries(h)
    .filter(([k]) => !AYRI.has(k))
    .map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)] as const);

describe("denetleyicinin kendisi", () => {
  const h = { hero: "AhKd", board: "Ks7d2c" };
  it("somut el yazımlarını yakalar", () => {
    for (const t of ["rakip QhQd gösterdi", "kartlarını gösterdi (Q♥ 9♣)", "elinde Q♥Q♦ var", "10♥ 9♣ ile", "BTN 7c7s tutuyor", "rakipte Ks7d var mı? Hayır: Ks7s"])
      expect(yabanciEller(t, h), t).not.toEqual([]);
  });
  it("hero elini, board'u, tek kartı ve aralık yazımını hata saymaz", () => {
    for (const t of ["A♥ K♦ ile üst çift", "AhKd", "board K♠ 7♦ 2♣", "Ks7d2c", "A♠ blocker'ı", "AK, KQ, 99 gibi eller", "A5s, T9s, 22+", "9s ve 8s", "As gelirse", "2,5 BB aç", "3c"])
      expect(yabanciEller(t, h), t).toEqual([]);
  });
});

describe("rakip eli sızıntısı: spot verisi", () => {
  it("hiçbir spotta `villain` alanı yok (ham veride de)", () => {
    expect(HANDS.filter((h) => "villain" in h).map((h) => h.id)).toEqual([]);
    expect(JSON.stringify(drills)).not.toMatch(/villain/i);
  });

  it("başlık, not, seçenekler ve diğer veri alanlarında hero eli ve board dışında somut el yok", () => {
    const bad = HANDS.flatMap((h) => onAlanlar(h).flatMap(([k, v]) => yabanciEller(v, h).map((e) => `${h.id}.${k}: ${e}`)));
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("aksiyon dizisindeki kartlar yalnızca board kartları", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const board = new Set(kartlar(h.board));
      for (const adim of h.seq) {
        const m = adim.match(/^[FTR] (.+)$/);
        if (m) {
          for (const k of kartlar(m[1])) if (!board.has(k)) bad.push(`${h.id}: ${adim}`);
        } else if ((adim.match(KART) ?? []).length > 0 && !/^(UTG|HJ|CO|BTN|SB|BB) [a-z][\d.]*$/.test(adim)) bad.push(`${h.id}: ${adim}`);
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  // İstisna: pot odds spotlarının kimliği (o-<el>-<board>) eski üretimden gelir ve ilerleme kayıtları
  // ona bağlı olduğu için değişmez. İçindeki ilk parça hero'nun (bazı spotlarda eski) elidir, rakibin değil;
  // kimlik masada gösterilmez. Diğer kimliklerde kart yazımı olmamalı.
  it("kimlikler: yalnızca o-… kimlikleri kart içerir ve board parçası board'la aynıdır", () => {
    for (const h of HANDS) {
      if (h.id.startsWith("o-")) expect(h.id.split("-")[2], h.id).toBe(h.board);
      else expect(yabanciEller(h.id.replace(/-/g, " "), h), h.id).toEqual([]);
    }
  });

  it("pot odds spotları: not rakibin elini değil aralığını söyler, başlık out sayısı vermez", () => {
    const list = HANDS.filter((h) => h.id.startsWith("o-"));
    expect(list).toHaveLength(70);
    for (const h of list) {
      expect(h.note, h.id).toMatch(/kartlarını görmüyorsun\. Varsayım: /);
      expect(h.note, h.id).not.toMatch(/gösterdi|[♠♥♦♣]/);
      expect(h.title, h.id).not.toMatch(/\d|out/i);
      expect(h.reasoning, h.id).toMatch(/bu aralığa karşı equity'n yaklaşık %\d+/);
      expect(h.reasoning, h.id).not.toMatch(/[♠♥♦♣]|Rakibin elini/);
    }
  });
});

// Gerekçe cevaptan sonra gösterilir; yine de rakibin somut elini söylememeli (aralık dili).
// İstisnalar tek tek gerekçelendirilir; liste dışında yeni bir somut el testi kırar.
const GEREKCE_ISTISNALARI: Record<string, string> = {};

describe("rakip eli sızıntısı: gerekçeler", () => {
  it("gerekçelerde hero eli ve board dışında somut el yok (istisnalar gerekçeli)", () => {
    const bad = HANDS.flatMap((h) => (h.id in GEREKCE_ISTISNALARI ? [] : yabanciEller(h.reasoning, h).map((e) => `${h.id}: ${e}`)));
    expect(bad, bad.join("; ")).toEqual([]);
  });
  it("istisna listesi güncel: her kayıt hâlâ gerekli", () => {
    for (const id of Object.keys(GEREKCE_ISTISNALARI)) {
      const h = HANDS.find((x) => x.id === id);
      expect(h && yabanciEller(h.reasoning, h).length > 0, id).toBe(true);
    }
  });
});

describe("rakip eli sızıntısı: koç bağlamı ve masa", () => {
  it("describeHand, cevap verilmeden önce rakip kartı, önerilen hamle ya da gerekçe içermez", () => {
    for (const h of HANDS) {
      const metin = describeHand(h, false);
      expect(yabanciEller(metin, h), h.id).toEqual([]);
      expect(metin, h.id).not.toMatch(/rakip kartları|Sitenin önerdiği|Sitenin gerekçesi/i);
      expect(metin.includes(h.reasoning), h.id).toBe(false);
    }
  });

  it("describeHand, cevaptan sonra da gerekçe dışında yeni kart eklemez", () => {
    for (const h of HANDS) {
      const metin = describeHand(h, true).replace(h.reasoning, "");
      expect(yabanciEller(metin, h), h.id).toEqual([]);
      expect(metin, h.id).not.toMatch(/rakip kartları/i);
    }
  });

  it("masa bileşeni ve koç bağlamı rakip kartı alanını okumaz", () => {
    const oku = (p: string) => readFileSync(path.resolve(import.meta.dirname, "../../..", p), "utf8");
    const masa = oku("src/components/PokerTable.tsx");
    expect(masa).not.toMatch(/villain/);
    // Kart yüzü yalnızca board ve hero için çizilir; rakip koltuklarında kart sırtı
    expect(masa.match(/<PlayingCard/g)).toHaveLength(2);
    expect(oku("src/lib/server/ai.ts")).not.toMatch(/h\.villain|Açık rakip kartları/);
    expect(oku("src/data/hands.ts")).not.toMatch(/villain\?:/);
  });
});
