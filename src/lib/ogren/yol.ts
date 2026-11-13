// Müfredat dizini: yol haritası ve ilerleme hesabı için saf yardımcılar.
// Müfredatın kendisine dokunmaz; hem gerçek veriyle hem örnek veriyle çalışır.
import type { Alistirma, Ders, Mufredat, Pist, Unite } from "@/lib/mufredat/tipler";

export type PistKimlik = Pist["kimlik"];

export type Dizin = {
  m: Mufredat;
  dersler: Map<string, Ders>;
  uniteler: Map<string, Unite>;
  /** ders kimliği → ünite kimliği */
  dersUnite: Map<string, string>;
};

export function dizinKur(m: Mufredat): Dizin {
  const dersler = new Map<string, Ders>();
  const uniteler = new Map<string, Unite>();
  const dersUnite = new Map<string, string>();
  for (const u of m.uniteler ?? []) {
    uniteler.set(u.kimlik, u);
    for (const d of u.dersler ?? []) {
      dersler.set(d.kimlik, d);
      dersUnite.set(d.kimlik, u.kimlik);
    }
  }
  return { m, dersler, uniteler, dersUnite };
}

/** Ortak temel üniteler iki pistte de yer alır; kimlikleri "o" ile başlar. */
export const ortakMi = (uniteKimlik: string): boolean => uniteKimlik.startsWith("o");

export function pistGetir(dz: Dizin, kimlik: string | null | undefined): Pist | undefined {
  return dz.m.pistler.find((p) => p.kimlik === kimlik);
}

export function pistUniteleri(dz: Dizin, pist: PistKimlik): Unite[] {
  return (pistGetir(dz, pist)?.uniteler ?? []).map((k) => dz.uniteler.get(k)).filter((u): u is Unite => !!u);
}

/** Pistteki dersler, yol sırasıyla. */
export function pistDersleri(dz: Dizin, pist: PistKimlik): Ders[] {
  return pistUniteleri(dz, pist).flatMap((u) => u.dersler);
}

/** Dersin bulunduğu pist. Ortak derslerde `tercih` (o an açık olan pist) öne alınır. */
export function dersinPisti(dz: Dizin, dersKimlik: string, tercih?: string | null): PistKimlik | null {
  const uk = dz.dersUnite.get(dersKimlik);
  if (!uk) return null;
  const adaylar = dz.m.pistler.filter((p) => p.uniteler.includes(uk)).map((p) => p.kimlik);
  if (tercih && adaylar.includes(tercih as PistKimlik)) return tercih as PistKimlik;
  return adaylar[0] ?? null;
}

/**
 * Tekrar düğümünün soru havuzu: kendi alıştırmaları varsa onlar, yoksa ünitedeki
 * normal derslerin alıştırmaları (sorular sabit değildir, geçmiş hatalardan seçilir).
 */
export function tekrarHavuzu(dz: Dizin, d: Ders): { ders: string; a: Alistirma }[] {
  if (d.alistirmalar.length) return d.alistirmalar.map((a) => ({ ders: d.kimlik, a }));
  const u = dz.uniteler.get(dz.dersUnite.get(d.kimlik) ?? "");
  return (u?.dersler ?? [])
    .filter((x) => x.tur === "ders" && x.durum === "dolu")
    .flatMap((x) => x.alistirmalar.map((a) => ({ ders: x.kimlik, a })));
}

/** Dersin açılabilecek içeriği var mı? "İskelet" dersler yolda görünür ama açılamaz. */
export function icerikVar(dz: Dizin, d: Ders): boolean {
  if (d.tur === "tekrar") return tekrarHavuzu(dz, d).length > 0;
  return d.durum === "dolu" && d.alistirmalar.length > 0;
}

/**
 * Etkin önkoşullar. İçeriği henüz yazılmamış (iskelet) bir önkoşul yok sayılır ve
 * yerine onun kendi önkoşulları geçer; böylece iskelet ders ne yolu kilitler ne de
 * atlanarak sıradaki dersler bedavaya açılır.
 */
export function etkinOnkosul(dz: Dizin, dersKimlik: string): string[] {
  const sonuc = new Set<string>();
  const gorulen = new Set<string>([dersKimlik]);
  const gez = (k: string) => {
    for (const o of dz.dersler.get(k)?.onkosul ?? []) {
      if (gorulen.has(o)) continue;
      gorulen.add(o);
      const od = dz.dersler.get(o);
      if (!od) continue;
      if (icerikVar(dz, od)) sonuc.add(o);
      else gez(o);
    }
  };
  gez(dersKimlik);
  return [...sonuc];
}

/**
 * Seviye atlama testinin açtığı dersler.
 * "ortak": testin ünitesine kadarki (dahil) ortak üniteler.
 * "pist": testin pistinde, testin ünitesine kadarki (dahil) bütün üniteler.
 * Testin kendisi listeye girmez.
 */
export function testKapsami(dz: Dizin, testKimlik: string): string[] {
  const test = dz.dersler.get(testKimlik);
  const uk = dz.dersUnite.get(testKimlik);
  if (!test || test.tur !== "test" || !uk) return [];
  const pist = dz.m.pistler.find((p) => p.uniteler.includes(uk));
  if (!pist) return [];
  const sira = pist.uniteler.slice(0, pist.uniteler.indexOf(uk) + 1);
  const secili = (test.kapsam ?? (ortakMi(uk) ? "ortak" : "pist")) === "ortak" ? sira.filter(ortakMi) : sira;
  return secili
    .flatMap((k) => dz.uniteler.get(k)?.dersler ?? [])
    .map((d) => d.kimlik)
    .filter((k) => k !== testKimlik);
}
