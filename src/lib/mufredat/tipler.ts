// Müfredat veri yapısı (src/data/mufredat.json). Alan açıklamaları: docs/mufredat/00-veri-yapisi.md

export type DersTuru = "ders" | "kontrol" | "test" | "tekrar";
export type AlistirmaTipi = "secmeli" | "dogruYanlis" | "eslestirme" | "siralama" | "sayi" | "range" | "spot";

export type SpotTanimi = {
  oyun: "cash" | "turnuva";
  oyuncuSayisi: number;
  stackBB: number;
  heroPoz: string;
  /** Kahramanın kartları: "AhKd" */
  heroEl: string;
  board?: string;
  /** Aksiyon geçmişi (biçim: src/lib/poker/replay.ts) */
  aksiyonlar: string[];
  ante?: number;
  /** Rakibin ARALIĞI, sade Türkçe. Somut bir el asla yazılmaz. */
  rakipAraligi: string;
};

/**
 * Makinece okunur olgu denetimi (scripts/mufredat/denetle.mts). Cevap, projedeki el değerlendiriciyle
 * ya da yeniden toplamayla bağımsız olarak hesaplanır ve `dogru` ile karşılaştırılır. Arayüz kullanmaz.
 * Kartlar "A♠ K♦" biçimindedir. Türler: kategori, kazanan, enIyiBes, cepKartSayisi, nuts, nutsKategori,
 * nutsEsleme, yenen, mumkun, kategoriSirasi, kategoriEsleme, elSirasi, enGucluKategori, royalSayisi,
 * toplam, carpim, bolum, konusmaSirasi, koltuk, sonrakiEl, efektif, bolumEsleme, yazim, yazimEsleme,
 * kombo, yuzde, toplamKombo, elAdiSayisi, matris, matrisSay, rangeKume, enCokKombo, acilis, acilisAraligi,
 * kosulluSec, acilisCoklu, acilisEsleme, aralikKapsar, aralikYuzde, gerekenEquity, equityAraliga, gerekliPay,
 * antePot, mOrani, bbErime, ortalamaStack, odul, bolge (turnuva; ante türü "bb" ya da "klasik"),
 * basabasFold, oranYuzde, spr, flopTutma; cash c7–c8: blokerKombo, outs, kazandiranKart (öğretim örneği), tutma,
 * tutmaKart, equityEle (öğretim örneği), impliedBasabas, spotFiyat; cash c9: boardDoku, boardSec, boardDokuEsleme, boyutEsleme.
 */
export type Denetim = { tur: string; [alan: string]: unknown };

export type Alistirma = {
  kimlik: string;
  tip: AlistirmaTipi;
  /** 1 (kolay) – 5 (zor) */
  zorluk: number;
  soru: string;
  /** secmeli, spot: seçenek metinleri. eslestirme: [sol, sağ] çiftleri. siralama: doğru sıradaki öğeler. range: el adları evreni (boşsa 169 el). */
  secenekler?: string[] | [string, string][];
  /** secmeli/spot: seçenek sırası. dogruYanlis: boolean. sayi: sayı. range: el adları. eslestirme/siralama: verilen sıra doğrudur. */
  dogru?: number | boolean | string[];
  /** sayi: kabul edilen mutlak sapma */
  tolerans?: number;
  /** sayi: birim etiketi ("%", "BB", "out") */
  birim?: string;
  /** Karışık stratejide doğru sayılmasa da hata sayılmayan seçenek sıraları */
  kabulEdilebilir?: number[];
  neden: string;
  yanilgi: string;
  dogrulamaGerekli: boolean;
  /** spot: mevcut bir spota bağlanır (src/data/hands.ts kimliği) ... */
  spotKimlik?: string;
  /** ... ya da yeni bir spot tanımı taşır */
  spot?: SpotTanimi;
  /** İsteğe bağlı olgu denetimi; yalnızca betik ve testler okur */
  denetim?: Denetim;
};

export type Ders = {
  kimlik: string;
  baslik: string;
  tur: DersTuru;
  onkosul: string[];
  kazanimlar: string[];
  sureDk: number;
  anlatim: string[];
  /** Sözlük terimleri (src/data/glossary.ts içindeki terim adları) */
  terimler: string[];
  ustalik: { son: number; oran: number };
  hedefAlistirma: number;
  /** "iskelet": alıştırmalar henüz yazılmadı. "dolu": tam denetim uygulanır. */
  durum: "iskelet" | "dolu";
  zorunlu?: boolean;
  seviyeAtlar?: number;
  /** test: "ortak" yalnızca ortak temel üniteleri, "pist" kendi pistindeki üniteleri açar */
  kapsam?: "ortak" | "pist";
  alistirmalar: Alistirma[];
};

export type Unite = { kimlik: string; baslik: string; seviye: number; renk: string; ozet: string; dersler: Ders[] };
export type Pist = { kimlik: "cash" | "turnuva"; baslik: string; aciklama: string; uniteler: string[] };
export type Mufredat = { surum: number; dil: "tr"; varsayimlar: Record<string, string>; pistler: Pist[]; uniteler: Unite[] };
