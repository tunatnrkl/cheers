// Müfredat alıştırmalarının olgusal cevaplarını BAĞIMSIZ olarak yeniden hesaplar.
// El sıralaması, kazanan, en iyi beş kart ve nuts soruları projedeki el değerlendiriciyle
// (src/lib/poker/evaluator.ts), pot ve sayı soruları yeniden toplamayla denetlenir.
// Alıştırmadaki `denetim` alanı neyin hesaplanacağını söyler; cevap `dogru` ile karşılaştırılır.
//
// Çalıştırma: node scripts/mufredat/denetle.mts   (hata varsa 1 ile çıkar)
// Test: src/lib/mufredat/denetle.test.ts aynı işlevi `npm test` içinde çağırır.
import { readFileSync } from "node:fs";
import { evaluate7, cardFromString } from "../../src/lib/poker/evaluator.ts";

type Al = {
  kimlik: string;
  tip: string;
  soru: string;
  secenekler?: unknown[];
  dogru?: unknown;
  denetim?: Record<string, unknown> & { tur: string };
};
type Ders = { kimlik: string; alistirmalar: Al[] };
type Mufredat = { uniteler: { dersler: Ders[] }[] };

export const KATEGORI = ["Yüksek kart", "Per", "İki per", "Üçlü", "Kent", "Floş", "Full house", "Kare", "Sıralı floş", "Royal floş"];
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");
const katSira = (ad: string) => {
  const i = KATEGORI.findIndex((k) => kucuk(k) === kucuk(ad));
  if (i < 0) throw new Error(`bilinmeyen el çeşidi "${ad}"`);
  return i;
};

const SIMGE: Record<string, string> = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
/** "A♠ K♦" → ["A♠", "K♦"] (yazıldığı gibi) */
const jetonlar = (s: string) => s.trim().split(/\s+/).filter(Boolean);
/** "A♠ K♦" → kart numaraları */
function kartlar(s: string): number[] {
  return jetonlar(s).map((j) => {
    if (!/^[2-9TJQKA][♠♥♦♣]$/.test(j)) throw new Error(`geçersiz kart yazımı "${j}"`);
    return cardFromString(j[0] + SIMGE[j[1]]);
  });
}
const KAT_TABAN = 16 ** 5;
const ROYAL = 8 * KAT_TABAN + 12 * 16 ** 4;
/** Değerlendirici sayısından el çeşidi sırası (royal floş ayrı) */
const kategori = (v: number) => (v === ROYAL ? 9 : Math.floor(v / KAT_TABAN));
const deger = (k: number[]) => evaluate7(k);

function benzersiz(k: number[], ne: string) {
  if (new Set(k).size !== k.length) throw new Error(`${ne}: aynı kart iki kez kullanılmış`);
}
function* kombinasyon<T>(dizi: T[], n: number, bas = 0, sec: T[] = []): Generator<T[]> {
  if (sec.length === n) {
    yield sec.slice();
    return;
  }
  for (let i = bas; i <= dizi.length - (n - sec.length); i++) {
    sec.push(dizi[i]);
    yield* kombinasyon(dizi, n, i + 1, sec);
    sec.pop();
  }
}
const DESTE = Array.from({ length: 52 }, (_, i) => i);
/** Board'a eklenebilecek her iki kartlık el için en yüksek değer */
function nutsDegeri(board: number[]): number {
  const kalan = DESTE.filter((c) => !board.includes(c));
  let en = -1;
  for (const el of kombinasyon(kalan, 2)) en = Math.max(en, deger([...el, ...board]));
  return en;
}
const sayiOku = (s: unknown) => {
  if (typeof s === "number") return s;
  const m = String(s).match(/-?\d+(,\d+)?/);
  if (!m) throw new Error(`seçenekte sayı yok: "${s}"`);
  return Number(m[0].replace(",", "."));
};
const esit = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Denetimdeki her kart, alıştırmanın görünen metninde (soru + seçenekler) geçmeli. */
function gorunurMu(a: Al, kartMetinleri: string[]) {
  // Genel bir kuralı soran sorularda (ör. "Üçlü, iki peri yener.") denetim temsilî bir örnek taşır.
  if (a.denetim?.ornek === true) return;
  const tum = [a.soru, JSON.stringify(a.secenekler ?? [])].join(" ");
  for (const km of kartMetinleri) for (const j of jetonlar(km)) if (!tum.includes(j)) throw new Error(`denetimdeki ${j} kartı soruda ya da seçeneklerde görünmüyor`);
}

/** Bir alıştırmanın denetimi; hata yoksa boş dizi. */
export function alistirmaDenetle(a: Al): string[] {
  const d = a.denetim;
  if (!d) return [];
  const h: string[] = [];
  const hata = (m: string) => h.push(m);
  const sec = (a.secenekler ?? []) as unknown[];
  const dogru = a.dogru;
  const tekCevap = (beklenen: (i: number) => boolean, ne: string) => {
    if (a.tip !== "secmeli") return hata(`${ne}: seçmeli soru bekleniyordu`);
    const uyan = sec.map((_, i) => i).filter(beklenen);
    if (uyan.length !== 1 || uyan[0] !== dogru) hata(`${ne}: hesaplanan doğru seçenek ${JSON.stringify(uyan)}, veride ${dogru}`);
  };
  const iddiaDY = (gercek: boolean) => {
    if (a.tip !== "dogruYanlis") return hata("iddia yalnızca doğru/yanlış sorusunda kullanılır");
    if (dogru !== gercek) hata(`hesaplanan cevap ${gercek}, veride ${dogru}`);
  };
  try {
    switch (d.tur) {
      case "kategori": {
        const k = kartlar(d.kartlar as string);
        benzersiz(k, "kartlar");
        gorunurMu(a, [d.kartlar as string]);
        const c = kategori(deger(k));
        if ("iddia" in d) iddiaDY(c === katSira(d.iddia as string));
        else tekCevap((i) => katSira(String(sec[i])) === c, `el çeşidi ${KATEGORI[c]}`);
        break;
      }
      case "kazanan": {
        const eller = d.eller as Record<string, string>;
        const board = d.board ? kartlar(d.board as string) : [];
        const adlar = Object.keys(eller);
        benzersiz([...board, ...adlar.flatMap((x) => kartlar(eller[x]))], "eller ve board");
        gorunurMu(a, [...Object.values(eller), ...(d.board ? [d.board as string] : [])]);
        const v = adlar.map((x) => deger([...kartlar(eller[x]), ...board]));
        const en = Math.max(...v);
        const kazananlar = adlar.filter((_, i) => v[i] === en);
        const etiket = kazananlar.length === 1 ? kazananlar[0] : kazananlar.length === adlar.length ? "Beraberlik" : kazananlar.join("+");
        if ("iddia" in d) iddiaDY(etiket === d.iddia);
        else {
          const etiketler = (d.degerler as string[] | undefined) ?? [...adlar, "Beraberlik"];
          if (etiketler.length !== sec.length) hata("degerler seçeneklerle aynı uzunlukta olmalı");
          tekCevap((i) => etiketler[i] === etiket, `kazanan ${etiket}`);
        }
        break;
      }
      case "enIyiBes": {
        const yedi = [...kartlar(d.el as string), ...kartlar(d.board as string)];
        benzersiz(yedi, "el ve board");
        gorunurMu(a, [d.el as string, d.board as string]);
        const en = deger(yedi);
        tekCevap((i) => {
          const k = kartlar(String(sec[i]));
          if (k.length !== 5 || k.some((c) => !yedi.includes(c))) throw new Error(`seçenek ${i} yedi karttan seçilmiş beş kart değil`);
          return deger(k) === en;
        }, "en iyi beş kart");
        break;
      }
      case "cepKartSayisi": {
        const el = kartlar(d.el as string);
        const yedi = [...el, ...kartlar(d.board as string)];
        benzersiz(yedi, "el ve board");
        gorunurMu(a, [d.el as string, d.board as string]);
        const en = deger(yedi);
        const sayilar = new Set<number>();
        for (const bes of kombinasyon(yedi, 5)) if (deger(bes) === en) sayilar.add(bes.filter((c) => el.includes(c)).length);
        if (sayilar.size !== 1) hata(`en iyi beşli birden çok biçimde kurulabiliyor (kapalı kart sayıları: ${[...sayilar].join(", ")}); soru belirsiz`);
        else if (a.tip !== "sayi" || dogru !== [...sayilar][0]) hata(`hesaplanan ${[...sayilar][0]}, veride ${dogru}`);
        break;
      }
      case "nuts": {
        const board = kartlar(d.board as string);
        gorunurMu(a, [d.board as string]);
        const en = nutsDegeri(board);
        tekCevap((i) => {
          const el = kartlar(String(sec[i]));
          benzersiz([...el, ...board], `seçenek ${i}`);
          return deger([...el, ...board]) === en;
        }, "nuts eli");
        break;
      }
      case "nutsKategori": {
        gorunurMu(a, [d.board as string]);
        const c = kategori(nutsDegeri(kartlar(d.board as string)));
        tekCevap((i) => katSira(String(sec[i])) === c, `nuts çeşidi ${KATEGORI[c]}`);
        break;
      }
      case "nutsEsleme": {
        for (const [b, ad] of sec as [string, string][]) {
          const c = kategori(nutsDegeri(kartlar(b)));
          if (c !== katSira(ad)) hata(`${b}: nuts ${KATEGORI[c]}, veride ${ad}`);
        }
        break;
      }
      case "yenen": {
        const board = kartlar(d.board as string);
        const hero = deger([...kartlar(d.el as string), ...board]);
        gorunurMu(a, [d.el as string, d.board as string]);
        tekCevap((i) => {
          const el = kartlar(String(sec[i]));
          benzersiz([...el, ...kartlar(d.el as string), ...board], `seçenek ${i}`);
          return deger([...el, ...board]) > hero;
        }, "kahramanı yenen el");
        break;
      }
      case "mumkun": {
        const board = kartlar(d.board as string);
        gorunurMu(a, [d.board as string]);
        const hedef = katSira(d.kategori as string);
        const kalan = DESTE.filter((c) => !board.includes(c));
        let var_ = false;
        for (const el of kombinasyon(kalan, 2)) if (kategori(deger([...el, ...board])) === hedef) { var_ = true; break; }
        if (a.tip !== "dogruYanlis" || dogru !== var_) hata(`${d.kategori} mümkün mü: hesaplanan ${var_}, veride ${dogru}`);
        break;
      }
      case "kategoriSirasi": {
        const s = (sec as string[]).map(katSira);
        const artan = d.yon !== "azalan";
        if (s.some((v, i) => i > 0 && (artan ? v <= s[i - 1] : v >= s[i - 1]))) hata(`sıralama ${artan ? "artan" : "azalan"} değil: ${sec.join(", ")}`);
        break;
      }
      case "kategoriEsleme": {
        for (const [el, ad] of sec as [string, string][]) {
          const k = kartlar(el);
          benzersiz(k, el);
          const c = kategori(deger(k));
          if (c !== katSira(ad)) hata(`${el}: hesaplanan ${KATEGORI[c]}, veride ${ad}`);
        }
        break;
      }
      case "elSirasi": {
        const v = (sec as string[]).map((x) => {
          const k = kartlar(x);
          benzersiz(k, x);
          return deger(k);
        });
        if (v.some((x, i) => i > 0 && x <= v[i - 1])) hata("eller güçsüzden güçlüye kesin artan sırada değil");
        break;
      }
      case "enGucluKategori": {
        const s = (sec as string[]).map(katSira);
        tekCevap((i) => s[i] === Math.max(...s), "en güçlü el çeşidi");
        break;
      }
      case "royalSayisi": {
        // Royal floş yalnızca T-A kartlarından kurulur: 20 kart, C(20, 5) beşli.
        const yuksek = DESTE.filter((c) => c >> 2 >= 8);
        let n = 0;
        for (const bes of kombinasyon(yuksek, 5)) if (deger(bes) === ROYAL) n++;
        if (a.tip !== "sayi" || dogru !== n) hata(`hesaplanan ${n}, veride ${dogru}`);
        break;
      }
      case "toplam":
      case "carpim":
      case "bolum": {
        const t = d.terimler as number[];
        const r = d.tur === "toplam" ? t.reduce((x, y) => x + y, 0) : d.tur === "carpim" ? t.reduce((x, y) => x * y, 1) : t[0] / t[1];
        if ("iddia" in d) iddiaDY(esit(r, d.iddia as number));
        else if (a.tip === "sayi") {
          if (!esit(r, dogru as number)) hata(`hesaplanan ${r}, veride ${dogru}`);
        } else {
          const degerler = (d.degerler as number[] | undefined) ?? sec.map(sayiOku);
          tekCevap((i) => esit(degerler[i], r), `hesaplanan ${r}`);
        }
        break;
      }
      default:
        hata(`bilinmeyen denetim türü "${d.tur}"`);
    }
  } catch (e) {
    hata((e as Error).message);
  }
  return h;
}

export type Sonuc = { hatalar: string[]; denetlenen: number; dolu: number; alistirma: number; eksik: string[] };

/** Bütün dolu derslerin denetimi. `eksik`: board ya da kart karşılaştırması içeren ama denetimi olmayan sorular. */
export function denetle(m: Mufredat): Sonuc {
  const s: Sonuc = { hatalar: [], denetlenen: 0, dolu: 0, alistirma: 0, eksik: [] };
  for (const u of m.uniteler)
    for (const d of u.dersler) {
      if (!d.alistirmalar.length) continue;
      s.dolu++;
      for (const a of d.alistirmalar) {
        s.alistirma++;
        if (a.denetim) s.denetlenen++;
        else if (/Board:|Kim kazanır|Hangi el daha güçlü|hangi eldir/.test(a.soru)) s.eksik.push(`${d.kimlik} / ${a.kimlik}`);
        for (const m of alistirmaDenetle(a)) s.hatalar.push(`${d.kimlik} / ${a.kimlik}: ${m}`);
      }
    }
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const yol = new URL("../../src/data/mufredat.json", import.meta.url);
  const s = denetle(JSON.parse(readFileSync(yol, "utf8")));
  console.log(`${s.dolu} dolu ders, ${s.alistirma} alıştırma; ${s.denetlenen} tanesi betikle denetlendi.`);
  for (const e of s.eksik) console.log("denetimsiz kart sorusu:", e);
  for (const e of s.hatalar) console.log("HATA:", e);
  process.exit(s.hatalar.length || s.eksik.length ? 1 : 0);
}
