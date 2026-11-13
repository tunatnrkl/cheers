// Müfredat alıştırmalarının olgusal cevaplarını BAĞIMSIZ olarak yeniden hesaplar.
// El sıralaması, kazanan, en iyi beş kart ve nuts soruları projedeki el değerlendiriciyle
// (src/lib/poker/evaluator.ts), pot ve sayı soruları yeniden toplamayla denetlenir. Pozisyon soruları
// 6-max koltuk modeliyle, başlangıç eli soruları (yazım, kombinasyon, matris, aralık yüzdesi) 52 kartlık
// destenin bütün iki kartlık ellerini sayarak denetlenir. Açılış soruları src/data/ranges.json'daki yaklaşık
// çalışma aralıklarına göre (solver çıktısı değil), kenar payı bırakılarak denetlenir; gereken equity
// formülle, aralığa karşı equity sabit tohumlu Monte Carlo ile yeniden hesaplanır. Turnuva hesapları (ante'li pot,
// M oranı, blind artışında BB erimesi, ortalama stack, ödül payları) girdileri senaryodan elle girilerek yeniden yapılır.
// Alıştırmadaki `denetim` alanı neyin hesaplanacağını söyler; cevap `dogru` ile karşılaştırılır.
//
// Çalıştırma: node scripts/mufredat/denetle.mts   (hata varsa 1 ile çıkar)
// Test: src/lib/mufredat/denetle.test.ts aynı işlevi `npm test` içinde çağırır.
import { readFileSync } from "node:fs";
import { evaluate7, cardFromString } from "../../src/lib/poker/evaluator.ts";
import { matrixLabel } from "../../src/lib/poker/cards.ts";

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

// ── 6-max koltuk modeli: butondan saat yönünde (sola doğru) ──
export const KOLTUK = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
const koltukNo = (p: string) => {
  const i = KOLTUK.indexOf(p);
  if (i < 0) throw new Error(`bilinmeyen koltuk "${p}"`);
  return i;
};
/** Konuşma sırası: preflop BB'nin solundan (UTG) başlar, postflop butonun solundan (SB). */
function konusmaSirasi(sokak: string, oyuncular?: string[]): string[] {
  const bas = sokak === "preflop" ? 3 : sokak === "postflop" ? 1 : NaN;
  if (Number.isNaN(bas)) throw new Error(`bilinmeyen sokak "${sokak}"`);
  const tam = KOLTUK.map((_, i) => KOLTUK[(bas + i) % 6]);
  if (oyuncular) oyuncular.forEach(koltukNo);
  return oyuncular ? tam.filter((p) => oyuncular.includes(p)) : tam;
}

// ── Başlangıç elleri: destenin bütün 1326 iki kartlık eli sayılarak ──
const DEGER = "AKQJT98765432";
/** İki karttan el adı: büyük değer önce; çiftse "77", aynı renkse "s", değilse "o". */
function elAdi(c1: number, c2: number): string {
  const [y, d] = (c1 >> 2) >= (c2 >> 2) ? [c1, c2] : [c2, c1];
  const r = (c: number) => "23456789TJQKA"[c >> 2];
  if (y >> 2 === d >> 2) return r(y) + r(d);
  return r(y) + r(d) + ((y & 3) === (d & 3) ? "s" : "o");
}
const IKILILER: [number, number][] = [...kombinasyon(Array.from({ length: 52 }, (_, i) => i), 2)] as [number, number][];
const KOMBO = new Map<string, number>();
for (const [a, b] of IKILILER) KOMBO.set(elAdi(a, b), (KOMBO.get(elAdi(a, b)) ?? 0) + 1);
function kombo(ad: string): number {
  const n = KOMBO.get(ad);
  if (n === undefined) throw new Error(`geçersiz el adı "${ad}" (büyük değer önce: AKs, 77, T9o)`);
  return n;
}
const elListesi = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
/** Matris hücresi: satır ve sütun A'dan 2'ye; satır sütundan büyükse suited (köşegenin üstü). */
function matrisHucre(satir: string, sutun: string): string {
  const i = DEGER.indexOf(satir), j = DEGER.indexOf(sutun);
  if (i < 0 || j < 0) throw new Error("matris satır/sütunu geçersiz");
  const kendi = i === j ? satir + sutun : i < j ? satir + sutun + "s" : sutun + satir + "o";
  // Sitenin matris bileşeniyle aynı yerleşim olmalı.
  if (kendi !== matrixLabel(i, j)) throw new Error(`matris yerleşimi sitenin matrisinden farklı (${kendi} / ${matrixLabel(i, j)})`);
  return kendi;
}
type RangeKurali = { tip: "cift" | "suited" | "offsuit"; yuksek?: string; min?: string; bosluk?: number };
function kuralaUyan(k: RangeKurali): string[] {
  const sira = (c: string) => "23456789TJQKA".indexOf(c);
  return [...KOMBO.keys()].filter((ad) => {
    const tip = ad.length === 2 ? "cift" : ad[2] === "s" ? "suited" : "offsuit";
    if (tip !== k.tip) return false;
    if (k.yuksek && ad[0] !== k.yuksek) return false;
    if (k.min && Math.min(sira(ad[0]), sira(ad[1])) < sira(k.min)) return false;
    if (k.bosluk !== undefined && sira(ad[0]) - sira(ad[1]) !== k.bosluk) return false;
    return true;
  });
}
/** "12.000 chip" → 12000, "2,5 BB" → 2.5 (Türkçe yazım: nokta binlik, virgül ondalık) */
const trSayi = (s: unknown) => {
  if (typeof s === "number") return s;
  const m = String(s).match(/\d[\d.]*(,\d+)?/);
  if (!m) throw new Error(`sayı okunamadı: "${s}"`);
  return Number(m[0].replace(/\./g, "").replace(",", "."));
};

// ── Açılış aralıkları (src/data/ranges.json) ──
type Ranges = { equity: Record<string, number>; cash: Record<string, string[]> };
const RANGES: Ranges = JSON.parse(readFileSync(new URL("../../src/data/ranges.json", import.meta.url), "utf8"));
/** Kenar payı: aralığın son ~%4'ü (53 kombinasyon) "sınırda" sayılır. */
const PAY = 53;
const listeKombo = (l: string[]) => l.reduce((t, e) => t + kombo(e), 0);
/** Sınırdaki eller karışık oynanabilir: suited connector/tek boşluklu, suited A, suited K (geç pozisyonda), SB'de her suited el. */
function karisik(el: string, poz: string): boolean {
  if (el.length === 2 || el[2] !== "s") return false;
  if (poz === "SB") return true;
  const sira = (c: string) => "23456789TJQKA".indexOf(c);
  if (sira(el[0]) - sira(el[1]) - 1 <= 1) return true;
  if (el[0] === "A") return true;
  return el[0] === "K" && poz !== "UTG" && poz !== "HJ";
}
/**
 * 169 elin açılış sıralaması: ranges.json'ın yöntem notundaki kural (rastgele ele karşı equity +
 * oynanabilirlik düzeltmesi; scripts/generate-ranges.mts openScore) burada yeniden kurulur. Aralığın
 * dışındaki ellerin aralık sınırına ne kadar uzak olduğunu ölçmek için kullanılır.
 */
function acilisPuani(el: string): number {
  const sira = (c: string) => "23456789TJQKA".indexOf(c);
  let p = RANGES.equity[el];
  if (el.length === 2) return p + 0.06;
  const y = sira(el[0]), d = sira(el[1]), bosluk = y - d - 1;
  p += el.endsWith("s") ? 0.045 : -0.015;
  if (bosluk === 0) p += 0.035;
  else if (bosluk === 1) p += 0.022;
  else if (bosluk === 2) p += 0.01;
  else if (bosluk >= 4 && y !== 12) p -= 0.03;
  if (y === 12 && el.endsWith("s") && d <= 3) p += 0.012;
  return p;
}
const SIRALI = [...KOMBO.keys()].sort((x, y) => acilisPuani(y) - acilisPuani(x));
const BASLANGIC = new Map<string, number>();
{
  let n = 0;
  for (const e of SIRALI) {
    BASLANGIC.set(e, n);
    n += kombo(e);
  }
}
/** Herkes fold ettiğinde bu koltuktan bu el: aç, fold ya da sınırda (kenar payı içinde ya da karışık oynanan el). */
export function acilisDurumu(poz: string, el: string): "ac" | "fold" | "sinir" {
  const liste = RANGES.cash[poz];
  if (!liste) throw new Error(`açılış aralığı yok: ${poz}`);
  kombo(el);
  const toplam = listeKombo(liste);
  const i = liste.indexOf(el);
  if (i >= 0) return listeKombo(liste.slice(0, i + 1)) <= toplam - PAY ? "ac" : "sinir";
  if (karisik(el, poz)) return "sinir";
  return BASLANGIC.get(el)! >= toplam + PAY ? "fold" : "sinir";
}
export const aralikYuzdesi = (poz: string) => (listeKombo(RANGES.cash[poz]) / IKILILER.length) * 100;

// ── Aralığa karşı equity: sabit tohumlu Monte Carlo ──
function tohumlu(t: number) {
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const etiketIkilileri = (ad: string) => IKILILER.filter(([a, b]) => elAdi(a, b) === ad);
/** Bir el adının (bütün kombinasyonları eşit ağırlıkla) bir el listesine karşı yaklaşık equity'si, yüzde. */
export function equityAraliga(el: string, rakip: string[], deneme = 40000, tohum = 20261113): number {
  const rnd = tohumlu(tohum);
  const benim = etiketIkilileri(el);
  const onun = rakip.flatMap(etiketIkilileri);
  let puan = 0;
  const deste: number[] = [];
  for (let t = 0; t < deneme; t++) {
    const h = benim[Math.floor(rnd() * benim.length)];
    let v: [number, number];
    do v = onun[Math.floor(rnd() * onun.length)];
    while (v[0] === h[0] || v[0] === h[1] || v[1] === h[0] || v[1] === h[1]);
    deste.length = 0;
    for (let c = 0; c < 52; c++) if (c !== h[0] && c !== h[1] && c !== v[0] && c !== v[1]) deste.push(c);
    for (let i = 0; i < 5; i++) {
      const j = i + Math.floor(rnd() * (deste.length - i));
      [deste[i], deste[j]] = [deste[j], deste[i]];
    }
    const b = deste.slice(0, 5);
    const x = evaluate7([h[0], h[1], ...b]), y = evaluate7([v[0], v[1], ...b]);
    puan += x > y ? 1 : x === y ? 0.5 : 0;
  }
  return (puan / deneme) * 100;
}

/**
 * Bir eldeki toplam ante. anteTuru "bb" (varsayılan): BB oyuncusu masanın tamamı için TEK bir ante öder.
 * "klasik": masadaki her oyuncu ante öder (ante × oyuncu).
 */
function toplamAnte(d: Record<string, unknown>): number {
  const ante = Number(d.ante ?? 0), tur = (d.anteTuru as string | undefined) ?? "bb";
  if (tur === "bb") return ante;
  if (tur !== "klasik") throw new Error(`bilinmeyen ante türü "${tur}"`);
  if (!(Number.isInteger(d.oyuncu) && (d.oyuncu as number) >= 2)) throw new Error("klasik ante için oyuncu sayısı gerekli");
  return ante * (d.oyuncu as number);
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
  /**
   * Hesaplanan sayıyı cevapla karşılaştırır. pay: yuvarlama payı (sayı sorusunda tolerans bundan büyük olamaz).
   * iddia: doğru/yanlış ("iddia" sayısı hesaplanana eşit mi). sayi: |dogru − r| ≤ pay.
   * secmeli: `degerler` (yoksa seçeneklerdeki ilk sayı, Türkçe yazımla) içinde r'ye pay kadar yakın TEK seçenek.
   */
  const sayiKarsila = (r: number, ne: string, pay: number) => {
    const yakin = (x: number) => Math.abs(x - r) <= pay + 1e-9;
    if ("iddia" in d!) return iddiaDY(yakin(d!.iddia as number));
    if (a.tip === "sayi") {
      const tol = (a as { tolerans?: number }).tolerans ?? 0;
      if (!yakin(dogru as number) || tol > Math.max(pay, 0.1)) hata(`${ne}: hesaplanan ${r}, veride ${dogru} (tolerans ${tol})`);
      return;
    }
    const degerler = (d!.degerler as number[] | undefined) ?? sec.map(trSayi);
    if (degerler.length !== sec.length) return hata("degerler seçeneklerle aynı uzunlukta olmalı");
    tekCevap((i) => yakin(degerler[i]), `${ne} ${r}`);
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
      case "konusmaSirasi": {
        const sira = konusmaSirasi(d.sokak as string, d.oyuncular as string[] | undefined);
        const soru = d.soru as string | undefined;
        if (!soru) {
          if (a.tip !== "siralama" || JSON.stringify(sec) !== JSON.stringify(sira)) hata(`hesaplanan sıra ${sira.join(", ")}, veride ${sec.join(", ")}`);
        } else if (soru === "ilk" || soru === "son") {
          const r = soru === "ilk" ? sira[0] : sira[sira.length - 1];
          if ("iddia" in d) iddiaDY(r === d.iddia);
          else tekCevap((i) => sec[i] === r, `${soru} konuşan ${r}`);
        } else if (soru === "sonraki" || soru === "onceki") {
          const i = sira.indexOf(d.poz as string);
          if (i < 0) throw new Error(`${d.poz} bu oyuncular arasında yok`);
          const n = soru === "sonraki" ? sira.length - 1 - i : i;
          if (a.tip !== "sayi" || dogru !== n) hata(`hesaplanan ${n}, veride ${dogru}`);
        } else hata(`bilinmeyen konuşma sırası sorusu "${soru}"`);
        break;
      }
      case "koltuk":
      case "sonrakiEl": {
        // koltuk: butonun n solundaki koltuk. sonrakiEl: buton bir koltuk sola kayınca aynı oyuncunun yeni koltuğu.
        const r = d.tur === "koltuk" ? KOLTUK[(d.butondanSola as number) % 6] : KOLTUK[(koltukNo(d.poz as string) + 5) % 6];
        tekCevap((i) => sec[i] === r, `koltuk ${r}`);
        break;
      }
      case "efektif": {
        const st = (d.stackler as number[]).map(trSayi);
        const r = Math.min(...st) / ((d.bb as number | undefined) ?? 1);
        if (a.tip === "sayi") {
          if (!esit(r, dogru as number)) hata(`hesaplanan ${r}, veride ${dogru}`);
        } else tekCevap((i) => esit(trSayi(sec[i]), r), `efektif stack ${r}`);
        break;
      }
      case "bolumEsleme": {
        for (const [sol, sag] of sec as [string, string][]) {
          const r = trSayi(sol) / (d.bb as number);
          if (!esit(r, trSayi(sag))) hata(`${sol} / ${d.bb} = ${r}, veride ${sag}`);
        }
        break;
      }
      case "yazim": {
        const k = kartlar(d.kartlar as string);
        gorunurMu(a, [d.kartlar as string]);
        const r = elAdi(k[0], k[1]);
        tekCevap((i) => sec[i] === r, `el adı ${r}`);
        break;
      }
      case "yazimEsleme": {
        for (const [el, ad] of sec as [string, string][]) {
          const k = kartlar(el);
          benzersiz(k, el);
          if (elAdi(k[0], k[1]) !== ad) hata(`${el}: hesaplanan ${elAdi(k[0], k[1])}, veride ${ad}`);
        }
        break;
      }
      case "kombo":
      case "yuzde": {
        const toplam = (d.eller as string[]).reduce((x, e) => x + kombo(e), 0);
        if (new Set(d.eller as string[]).size !== (d.eller as string[]).length) throw new Error("aynı el adı iki kez sayılmış");
        if (d.tur === "kombo") {
          if ("iddia" in d) iddiaDY(toplam === d.iddia);
          else if (a.tip === "sayi") {
            if (dogru !== toplam) hata(`hesaplanan ${toplam} kombinasyon, veride ${dogru}`);
          } else tekCevap((i) => trSayi(sec[i]) === toplam, `${toplam} kombinasyon`);
        } else {
          const r = (toplam / IKILILER.length) * 100;
          const tol = (a as { tolerans?: number }).tolerans ?? 0;
          if (a.tip !== "sayi" || Math.abs((dogru as number) - r) > 0.05 || tol > 0.1) hata(`hesaplanan %${r.toFixed(3)}, veride ${dogru} (tolerans ${tol})`);
        }
        break;
      }
      case "toplamKombo":
        if (a.tip !== "sayi" || dogru !== IKILILER.length) hata(`hesaplanan ${IKILILER.length}, veride ${dogru}`);
        break;
      case "elAdiSayisi":
        if (a.tip !== "sayi" || dogru !== KOMBO.size) hata(`hesaplanan ${KOMBO.size}, veride ${dogru}`);
        break;
      case "matris": {
        const r = matrisHucre(d.satir as string, d.sutun as string);
        tekCevap((i) => sec[i] === r, `hücre ${r}`);
        break;
      }
      case "matrisSay": {
        let n = 0;
        for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
          const ad = matrisHucre(DEGER[i], DEGER[j]);
          const tip = ad.length === 2 ? "kosegen" : ad.endsWith("s") ? "ust" : "alt";
          if (tip === d.bolge) n++;
        }
        if (a.tip !== "sayi" || dogru !== n) hata(`hesaplanan ${n}, veride ${dogru}`);
        break;
      }
      case "rangeKume": {
        const beklenen = new Set((d.kurallar as RangeKurali[]).flatMap(kuralaUyan));
        const veri = new Set(dogru as string[]);
        const eksik = [...beklenen].filter((x) => !veri.has(x)), fazla = [...veri].filter((x) => !beklenen.has(x));
        if (a.tip !== "range" || eksik.length || fazla.length || veri.size !== (dogru as string[]).length)
          hata(`aralık uyuşmuyor; eksik: ${eksik.join(" ") || "—"}, fazla: ${fazla.join(" ") || "—"}`);
        break;
      }
      case "enCokKombo": {
        const n = sec.map((x) => elListesi(String(x)).reduce((t, e) => t + kombo(e), 0));
        tekCevap((i) => n[i] === Math.max(...n), `en çok kombinasyon (${n.join("/")})`);
        break;
      }
      case "acilis": {
        const durum = acilisDurumu(d.poz as string, d.el as string);
        const yumusak = (a as { dogrulamaGerekli?: boolean }).dogrulamaGerekli === true || ((a as { kabulEdilebilir?: number[] }).kabulEdilebilir ?? []).length > 0;
        if (durum === "sinir") {
          if (!d.sinir) hata(`${d.poz} ${d.el} aralığın kenarında; soruda sınır: true, dogrulamaGerekli ya da kabulEdilebilir gerekli`);
          else if (!yumusak) hata(`${d.poz} ${d.el} sınırda; dogrulamaGerekli: true ya da kabulEdilebilir kullanılmalı`);
          break;
        }
        if (d.sinir) hata(`${d.poz} ${d.el} sınırda değil (${durum}); sınır işareti kaldırılmalı`);
        if ("iddia" in d) iddiaDY(durum === d.iddia);
        else if (a.tip === "secmeli" || a.tip === "spot") {
          const fold = String(sec[dogru as number] ?? "").startsWith("Fold");
          if (fold !== (durum === "fold")) hata(`${d.poz} ${d.el}: aralığa göre ${durum === "ac" ? "aç" : "fold"}, veride "${sec[dogru as number]}"`);
        } else hata("açılış denetimi seçmeli, spot ya da doğru/yanlış sorusunda kullanılır");
        break;
      }
      case "kosulluSec": {
        // Seçenekler el adı; koşulların hepsini sağlayan tek seçenek doğru cevaptır. kosul: [[koltuk, durum], ...]
        const kosul = d.kosul as [string, string][];
        tekCevap((i) => kosul.every(([poz, durum]) => acilisDurumu(poz, String(sec[i])) === durum), `koşul ${JSON.stringify(kosul)}`);
        break;
      }
      case "acilisCoklu": {
        // Doğru/yanlış: kontroller [[koltuk, el, durum], ...] hepsi tutuyorsa ifade doğrudur. Sınırdaki el kullanılamaz.
        const k = d.kontroller as [string, string, string][];
        const durumlar = k.map(([poz, el]) => acilisDurumu(poz, el));
        if (durumlar.includes("sinir")) hata(`sınırdaki el kullanılmış: ${k.filter((_, i) => durumlar[i] === "sinir").map((x) => x.slice(0, 2).join(" ")).join(", ")}`);
        else iddiaDY(k.every(([, , durum], i) => durumlar[i] === durum));
        break;
      }
      case "acilisEsleme": {
        // Eşleştirme: sol "KOLTUK EL", sağ etiket; etiketler {metin: durum}
        const et = d.etiketler as Record<string, string>;
        for (const [sol, sag] of sec as [string, string][]) {
          const [poz, el] = sol.replace(/'(de|da|te|ta)\b/, "").split(/[\s:]+/);
          const r = acilisDurumu(poz, el);
          if (et[sag] !== r) hata(`${sol}: hesaplanan ${r}, veride "${sag}"`);
        }
        break;
      }
      case "aralikKapsar": {
        const dar = RANGES.cash[d.dar as string], genis = new Set(RANGES.cash[d.genis as string]);
        iddiaDY(dar.every((e) => genis.has(e)));
        break;
      }
      case "acilisAraligi": {
        if (a.tip !== "range") throw new Error("acilisAraligi yalnızca range sorusunda");
        const veri = new Set(dogru as string[]);
        for (const el of sec as string[]) {
          const durum = acilisDurumu(d.poz as string, el);
          if (durum === "sinir") hata(`${d.poz} ${el} sınırda; range sorusunun seçeneklerinde olmamalı`);
          else if ((durum === "ac") !== veri.has(el)) hata(`${d.poz} ${el}: aralığa göre ${durum === "ac" ? "işaretli" : "işaretsiz"} olmalı`);
        }
        for (const el of veri) if (!(sec as string[]).includes(el)) hata(`${el} seçeneklerde yok`);
        break;
      }
      case "aralikYuzde": {
        const r = aralikYuzdesi(d.poz as string);
        if (a.tip === "sayi") {
          const tol = (a as { tolerans?: number }).tolerans ?? 0;
          if (Math.abs((dogru as number) - r) > Math.max(tol, 0.05) || tol > 1) hata(`${d.poz} aralığı %${r.toFixed(2)}, veride ${dogru} (tolerans ${tol})`);
        } else tekCevap((i) => Math.abs(trSayi(sec[i]) - r) < 0.6, `${d.poz} aralığı %${r.toFixed(1)}`);
        break;
      }
      case "gerekenEquity": {
        // gereken equity = ödenecek / (call öncesi pot + ödenecek)
        const call = d.call as number, pot = d.pot as number;
        const r = (call / (pot + call)) * 100;
        if ("iddia" in d) iddiaDY(Math.abs(r - (d.iddia as number)) < 0.6);
        else if (a.tip === "sayi") {
          const tol = (a as { tolerans?: number }).tolerans ?? 0;
          if (Math.abs((dogru as number) - r) > Math.max(tol, 0.05) || tol > 1) hata(`gereken equity %${r.toFixed(2)}, veride ${dogru}`);
        } else tekCevap((i) => Math.abs(trSayi(sec[i]) - r) < 0.6, `gereken equity %${r.toFixed(1)}`);
        break;
      }
      case "equityAraliga": {
        // Monte Carlo (40.000 deneme, sabit tohum); metindeki "yaklaşık" değer en fazla 1,5 puan sapabilir.
        const rakip = d.poz ? RANGES.cash[d.poz as string] : (d.rakip as string[]);
        const r = equityAraliga(d.el as string, rakip);
        if (Math.abs(r - (d.yaklasik as number)) > 1.5) hata(`${d.el} equity'si yaklaşık %${r.toFixed(1)}, metinde %${d.yaklasik}`);
        if (a.tip === "secmeli") tekCevap((i) => Math.abs(trSayi(sec[i]) - r) <= 1.5, `${d.el} equity'si %${r.toFixed(1)}`);
        break;
      }
      case "gerekliPay": {
        // Call'un kârlı olması için ham equity'nin ne kadarı kullanılmalı: gereken equity / ham equity.
        // Bu bir aritmetik oranıdır; elin gerçekte ne kadar gerçekleştirdiği (realization) iddiası değildir.
        const gereken = ((d.call as number) / ((d.pot as number) + (d.call as number))) * 100;
        const ham = equityAraliga(d.el as string, RANGES.cash[d.poz as string]);
        const r = (gereken / ham) * 100;
        if (a.tip === "sayi") {
          const tol = (a as { tolerans?: number }).tolerans ?? 0;
          if (Math.abs((dogru as number) - r) > tol || tol > 3) hata(`gerekli pay %${r.toFixed(1)}, veride ${dogru} (tolerans ${tol})`);
        } else tekCevap((i) => Math.abs(trSayi(sec[i]) - r) < 4, `gerekli pay %${r.toFixed(1)}`);
        break;
      }
      // ── Turnuva hesapları (t1–t2). Girdiler senaryodan elle girilir; betik işlemi ve ante kuralını uygular. ──
      case "antePot": {
        // El başındaki pot: SB + BB + toplam ante (+ sonradan konanlar). BB ante: tek ante; klasik: oyuncu başına ante.
        sayiKarsila(Number(d.sb) + Number(d.bb) + toplamAnte(d) + ((d.ekler as number[] | undefined) ?? []).reduce((x, y) => x + y, 0), "pot", 0);
        break;
      }
      case "mOrani": {
        // M = stack / (SB + BB + bir eldeki toplam ante)
        sayiKarsila(trSayi(d.stack) / (Number(d.sb) + Number(d.bb) + toplamAnte(d)), "M", 0.05);
        break;
      }
      case "bbErime": {
        // Aynı stack, büyüyen BB: yeni = stack / yeniBb; kayip = stack / eskiBb − stack / yeniBb
        const st = trSayi(d.stack), eski = st / Number(d.eskiBb), yeni = st / Number(d.yeniBb);
        if (d.sonuc !== "yeni" && d.sonuc !== "kayip") throw new Error(`bbErime sonucu "yeni" ya da "kayip" olmalı`);
        sayiKarsila(d.sonuc === "yeni" ? yeni : eski - yeni, "BB", 0.05);
        break;
      }
      case "ortalamaStack": {
        // Ortalama stack = başlangıç stack'i × giriş sayısı / kalan oyuncu (BB verilirse BB cinsinden).
        // `stack` verilirse cevap, o stack'in ortalamanın yüzde kaçı olduğudur.
        const ort = (trSayi(d.baslangic) * Number(d.giris)) / Number(d.kalan);
        const r = d.stack !== undefined ? (trSayi(d.stack) / ort) * 100 : ort / ((d.bb as number | undefined) ?? 1);
        sayiKarsila(r, "ortalama stack", 0.05);
        break;
      }
      case "bolge": {
        // Müfredatın turnuva stack bölgeleri (yaklaşık, kaynağa göre değişir): derin ≥ 40 BB, orta 20–40 BB, kısa < 20 BB.
        const r = trSayi(d.stack) / Number(d.bb);
        const b = r >= 40 ? "Derin" : r >= 20 ? "Orta" : "Kısa";
        if ("iddia" in d) iddiaDY(b === d.iddia);
        else tekCevap((i) => String(sec[i]).startsWith(b), `${r} BB: ${b}`);
        break;
      }
      case "odul": {
        // Ödül payları (%): toplamı 100 olmalı ve sıra büyüdükçe pay artmamalı (kademeli yapı).
        const p = d.paylar as number[];
        if (Math.abs(p.reduce((x, y) => x + y, 0) - 100) > 1e-6) throw new Error(`ödül payları toplamı 100 değil (${p.reduce((x, y) => x + y, 0)})`);
        if (p.some((v, i) => i > 0 && v > p[i - 1])) throw new Error("ödül payları sıra büyüdükçe artıyor");
        const sira = (n: unknown) => {
          const v = p[Number(n) - 1];
          if (v === undefined) throw new Error(`${n}. sıra ödül almıyor`);
          return v;
        };
        const r = d.soru === "itm" ? p.length
          : d.soru === "pay" ? sira(d.sira)
          : d.soru === "fark" ? sira((d.siralar as number[])[0]) - sira((d.siralar as number[])[1])
          : d.soru === "toplam" ? (d.siralar as number[]).reduce((x, n) => x + sira(n), 0)
          : d.soru === "itmOrani" ? (p.length / Number(d.katilimci)) * 100
          : NaN;
        if (Number.isNaN(r)) throw new Error(`bilinmeyen ödül sorusu "${d.soru}"`);
        sayiKarsila(r, "ödül", d.soru === "itmOrani" ? 0.05 : 0);
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
