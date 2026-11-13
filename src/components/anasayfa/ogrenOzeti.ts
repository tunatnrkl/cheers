// Ana sayfadaki "kaldığın yer" alanı: Öğren yolundaki mevcut ders ve günlük seri.
// Saf fonksiyonlar; kurallar src/lib/ogren'deki ilerleme fonksiyonlarından gelir, burada yeniden yazılmaz.
import { acilabilir, type Durum, pistOzeti, seriGorunen } from "@/lib/ogren/ilerleme";
import type { Mufredat } from "@/lib/mufredat/tipler";
import { type Dizin, type PistKimlik, dersinPisti } from "@/lib/ogren/yol";

export type OgrenOzeti = {
  /** Hiç ders kaydı yok: "İlk derse başla" */
  ilk: boolean;
  /** Sıradaki ya da yarıda kalan ders; pist bittiyse null */
  ders: { kimlik: string; baslik: string; unite: string | null; basladi: boolean } | null;
  pist: PistKimlik | null;
  seri: number;
  /** Nötr seri cümlesi: kopmuş seri için kayıp ya da suç dili yok */
  seriNotu: string;
  /** Gidilecek adres (basePath'siz) */
  adres: string;
};

/** /ogren sayfasındaki seri cümlesiyle aynı (AnaEkran.seriMetni). */
export function seriNotu(sayi: number, bugunTamam: boolean, dahaOnceVar: boolean): string {
  if (bugunTamam) return "Bugünkü ders tamam.";
  if (sayi > 0) return "Bugün bir ders, seriyi sürdürür.";
  return dahaOnceVar ? "Bugün bir ders, seriyi yeniden başlatır." : "Bugün bir ders, seriyi başlatır.";
}

const an = (r: Durum["dersler"][string]) => r.son ?? r.tamam ?? r.basla ?? "";

export function ogrenOzeti(dz: Dizin, durum: Durum, simdi: Date): OgrenOzeti {
  const s = seriGorunen(durum.seri, simdi);
  const notu = seriNotu(s.sayi, s.bugunTamam, durum.seri.gun !== null);
  const kayitlar = Object.entries(durum.dersler).filter(([k]) => dz.dersler.has(k));
  if (!kayitlar.length) return { ilk: true, ders: null, pist: null, seri: s.sayi, seriNotu: notu, adres: "/ogren" };

  // En son görülen ders: yarıda kaldıysa ona, bittiyse aynı pistteki sıradaki derse.
  const [sonKimlik, sonKayit] = kayitlar.reduce((a, b) => (an(b[1]) > an(a[1]) ? b : a));
  const pist = dersinPisti(dz, sonKimlik);
  let hedef: string | null = null;
  if (!sonKayit.tamam && acilabilir(dz, durum, sonKimlik)) hedef = sonKimlik;
  else if (pist) hedef = pistOzeti(dz, durum, pist).siradaki;

  const d = hedef ? dz.dersler.get(hedef) : undefined;
  const q = new URLSearchParams();
  if (pist) q.set("pist", pist);
  if (d) q.set("ders", d.kimlik);
  const qs = q.toString();
  return {
    ilk: false,
    ders: d
      ? { kimlik: d.kimlik, baslik: d.baslik, unite: dz.uniteler.get(dz.dersUnite.get(d.kimlik) ?? "")?.baslik ?? null, basladi: !!durum.dersler[d.kimlik]?.basla }
      : null,
    pist,
    seri: s.sayi,
    seriNotu: notu,
    adres: qs ? `/ogren?${qs}` : "/ogren",
  };
}

/**
 * Ana sayfaya giden hafif müfredat: yol ve kilit hesabı için gereken alanlar kalır, alıştırma içerikleri
 * yalnızca sayı olarak taşınır (tam müfredat ana sayfanın JS'ine girmez). Sunucuda çağrılır.
 */
export function inceMufredat(m: Mufredat): Mufredat {
  return {
    surum: m.surum,
    dil: m.dil,
    varsayimlar: {},
    pistler: m.pistler,
    uniteler: m.uniteler.map((u) => ({
      kimlik: u.kimlik,
      baslik: u.baslik,
      seviye: u.seviye,
      renk: u.renk,
      ozet: "",
      dersler: u.dersler.map((d) => ({
        kimlik: d.kimlik,
        baslik: d.baslik,
        tur: d.tur,
        onkosul: d.onkosul,
        kazanimlar: [],
        sureDk: d.sureDk,
        anlatim: [],
        terimler: [],
        ustalik: d.ustalik,
        hedefAlistirma: d.hedefAlistirma,
        durum: d.durum,
        ...(d.zorunlu !== undefined && { zorunlu: d.zorunlu }),
        ...(d.kapsam && { kapsam: d.kapsam }),
        alistirmalar: d.alistirmalar.map((a) => ({ kimlik: a.kimlik }) as Mufredat["uniteler"][number]["dersler"][number]["alistirmalar"][number]),
      })),
    })),
  };
}
