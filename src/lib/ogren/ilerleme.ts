// Öğrenme yolu ilerlemesi: kilit, ustalık, XP, günlük seri, seviye, tekrar seçimi,
// içe/dışa aktarma. Hepsi saf fonksiyon; saat dışarıdan verilir (test edilebilir).
// Kayıt: localStorage "cheers:ogren:v1" (bkz. depo.ts). Eski pd-… anahtarlarına dokunulmaz.
//
// Sabit kurallar (KARARLAR.md, karar 4): doğru cevap 10 XP, ders bitirme 20 XP.
// Rastgele ödül, çarpan, can, rozet yok. Seri koparsa yalnızca sayaç sıfırdan başlar.
import type { Alistirma, Ders } from "@/lib/mufredat/tipler";
import {
  type Dizin,
  type PistKimlik,
  etkinOnkosul,
  icerikVar,
  pistDersleri,
  pistUniteleri,
  tekrarHavuzu,
  testKapsami,
} from "./yol";

export const SURUM = 1;
export const ANAHTAR = "cheers:ogren:v1";
export const XP_DOGRU = 10;
export const XP_DERS = 20;
/** Aralıklı tekrar oturumundaki en fazla soru. */
export const TEKRAR_SORU = 6;
const SONUC_SINIRI = 40;
const GUN_MS = 86_400_000;

/** d: doğru, k: kabul edilebilir (hata sayılmaz, doğru da sayılmaz), y: yanlış */
export type Sonuc = "d" | "k" | "y";

export type DersKaydi = {
  /** İlk başlama anı (ISO) */
  basla?: string;
  /** İlk tamamlanma anı (ISO) */
  tamam?: string;
  /** Seviye testiyle açıldıysa true */
  testle?: boolean;
  /** Son görülme anı (ISO) */
  son?: string;
  /** İlk denemelerin sonuçları, eskiden yeniye (en fazla 40) */
  sonuclar: Sonuc[];
  /** Son seferinde yanlış cevaplanan alıştırma kimlikleri */
  yanlis: string[];
  /** Bitirilen oturum sayısı */
  tur: number;
};

export type Durum = {
  surum: typeof SURUM;
  xp: number;
  /** Günlük hedef: gün başına ders (1–5) */
  hedef: number;
  seri: { gun: string | null; sayi: number };
  bugun: { gun: string; ders: number; xp: number };
  /** Aralıklı tekrarın en son yapıldığı gün */
  sonTekrar: string | null;
  dersler: Record<string, DersKaydi>;
};

export type DersDurumu = "yakinda" | "kilitli" | "acik" | "devam" | "tamam" | "usta";

// ───────────── Gün (yerel saat) ─────────────
const iki = (n: number) => String(n).padStart(2, "0");

/** Yerel saate göre gün anahtarı: "2026-11-12". Gün sınırı kullanıcının gece yarısıdır. */
export function gunAnahtari(d: Date): string {
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

function gunTarihi(anahtar: string): Date {
  const [y, a, g] = anahtar.split("-").map(Number);
  return new Date(y, a - 1, g);
}

export function oncekiGun(anahtar: string): string {
  const d = gunTarihi(anahtar);
  return gunAnahtari(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/** İki an arasındaki takvim günü farkı (yerel). */
export function gunFarki(once: Date, sonra: Date): number {
  return Math.round((gunTarihi(gunAnahtari(sonra)).getTime() - gunTarihi(gunAnahtari(once)).getTime()) / GUN_MS);
}

// ───────────── Durum: boş, şema denetimi, aktarma ─────────────
export function bosDurum(): Durum {
  return { surum: SURUM, xp: 0, hedef: 1, seri: { gun: null, sayi: 0 }, bugun: { gun: "", ders: 0, xp: 0 }, sonTekrar: null, dersler: {} };
}

const bosKayit = (): DersKaydi => ({ sonuclar: [], yanlis: [], tur: 0 });

/** Sürüm geçişleri: anahtar eski sürüm, değer bir sonraki sürüme çeviren fonksiyon. v1 ilk sürüm. */
const GECISLER: Record<number, (eski: Record<string, unknown>) => Record<string, unknown>> = {};

const nesne = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const sayma = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1e9;
const GUN_RE = /^\d{4}-\d{2}-\d{2}$/;
const gunMu = (v: unknown): v is string => typeof v === "string" && GUN_RE.test(v);
const anMi = (v: unknown): v is string => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));

/**
 * Ham veriyi (JSON'dan çözülmüş) denetler. Eksik alanlar varsayılanla dolar;
 * türü yanlış alan ya da tanınmayan sürüm hata döner. Asla istisna fırlatmaz.
 */
export function durumCoz(ham: unknown): { durum: Durum } | { hata: string } {
  try {
    if (!nesne(ham)) return { hata: "Kayıt bir nesne değil." };
    let v = ham;
    if (!sayma(v.surum) || v.surum < 1) return { hata: "Sürüm numarası yok." };
    if (v.surum > SURUM) return { hata: "Bu kayıt sitenin daha yeni bir sürümünden." };
    for (let s = v.surum as number; s < SURUM; s++) {
      const gec = GECISLER[s];
      if (!gec) return { hata: `Sürüm ${s} için geçiş tanımlı değil.` };
      v = gec(v);
    }
    const d = bosDurum();
    if (v.xp !== undefined) {
      if (!sayma(v.xp)) return { hata: "XP değeri geçersiz." };
      d.xp = v.xp;
    }
    if (v.hedef !== undefined) {
      if (!sayma(v.hedef) || v.hedef < 1 || v.hedef > 5) return { hata: "Günlük hedef geçersiz." };
      d.hedef = v.hedef;
    }
    if (v.seri !== undefined) {
      const s = v.seri;
      if (!nesne(s) || !(s.gun === null || gunMu(s.gun)) || !sayma(s.sayi)) return { hata: "Seri kaydı geçersiz." };
      d.seri = { gun: s.gun, sayi: s.gun === null ? 0 : s.sayi };
    }
    if (v.bugun !== undefined) {
      const b = v.bugun;
      if (!nesne(b) || !(b.gun === "" || gunMu(b.gun)) || !sayma(b.ders) || !sayma(b.xp)) return { hata: "Günlük sayaç geçersiz." };
      d.bugun = { gun: b.gun, ders: b.ders, xp: b.xp };
    }
    if (v.sonTekrar !== undefined) {
      if (!(v.sonTekrar === null || gunMu(v.sonTekrar))) return { hata: "Tekrar günü geçersiz." };
      d.sonTekrar = v.sonTekrar;
    }
    if (v.dersler !== undefined) {
      if (!nesne(v.dersler)) return { hata: "Ders kayıtları geçersiz." };
      const girdiler = Object.entries(v.dersler);
      if (girdiler.length > 5000) return { hata: "Ders kaydı sayısı beklenenden fazla." };
      for (const [k, r] of girdiler) {
        if (!k || k.length > 40 || !nesne(r)) return { hata: `Ders kaydı geçersiz: ${k.slice(0, 40)}` };
        const kayit = bosKayit();
        for (const alan of ["basla", "tamam", "son"] as const) {
          if (r[alan] === undefined) continue;
          if (!anMi(r[alan])) return { hata: `${k}: tarih geçersiz.` };
          kayit[alan] = r[alan] as string;
        }
        if (r.testle !== undefined) {
          if (typeof r.testle !== "boolean") return { hata: `${k}: test işareti geçersiz.` };
          if (r.testle) kayit.testle = true;
        }
        if (r.sonuclar !== undefined) {
          if (!Array.isArray(r.sonuclar) || !r.sonuclar.every((x) => x === "d" || x === "k" || x === "y")) return { hata: `${k}: sonuç listesi geçersiz.` };
          kayit.sonuclar = (r.sonuclar as Sonuc[]).slice(-SONUC_SINIRI);
        }
        if (r.yanlis !== undefined) {
          if (!Array.isArray(r.yanlis) || !r.yanlis.every((x) => typeof x === "string" && x.length <= 40)) return { hata: `${k}: yanlış listesi geçersiz.` };
          kayit.yanlis = [...new Set(r.yanlis as string[])].slice(0, 200);
        }
        if (r.tur !== undefined) {
          if (!sayma(r.tur)) return { hata: `${k}: oturum sayısı geçersiz.` };
          kayit.tur = r.tur;
        }
        d.dersler[k] = kayit;
      }
    }
    return { durum: d };
  } catch {
    return { hata: "Kayıt okunamadı." };
  }
}

/** localStorage'daki metni okur. Bozuksa boş durumla başlar ve bunu bildirir (çağıran yedekler). */
export function depodanOku(metin: string | null): { durum: Durum; bozuk: boolean } {
  if (metin === null || metin === "") return { durum: bosDurum(), bozuk: false };
  let ham: unknown;
  try {
    ham = JSON.parse(metin);
  } catch {
    return { durum: bosDurum(), bozuk: true };
  }
  const s = durumCoz(ham);
  return "durum" in s ? { durum: s.durum, bozuk: false } : { durum: bosDurum(), bozuk: true };
}

const DOSYA_TURU = "ogren-ilerleme";

export function disaAktar(durum: Durum, simdi: Date): string {
  return JSON.stringify({ uygulama: "cheers", tur: DOSYA_TURU, surum: SURUM, tarih: simdi.toISOString(), durum }, null, 2);
}

export function iceAktar(metin: string): { ok: true; durum: Durum } | { ok: false; hata: string } {
  if (metin.length > 2_000_000) return { ok: false, hata: "Dosya beklenenden büyük." };
  let ham: unknown;
  try {
    ham = JSON.parse(metin);
  } catch {
    return { ok: false, hata: "Dosya JSON biçiminde değil." };
  }
  if (!nesne(ham) || ham.uygulama !== "cheers" || ham.tur !== DOSYA_TURU) return { ok: false, hata: "Bu dosya bir Cheers öğrenme yolu kaydı değil." };
  const s = durumCoz(ham.durum);
  return "durum" in s ? { ok: true, durum: s.durum } : { ok: false, hata: s.hata };
}

// ───────────── Ustalık ve ders durumu ─────────────
/** Son N alıştırmadaki doğruluk. Kabul edilebilir cevaplar ne doğru ne yanlış sayılır. */
export function ustalikOrani(kayit: DersKaydi | undefined, ders: Pick<Ders, "ustalik">): { oran: number | null; n: number } {
  const pencere = (kayit?.sonuclar ?? []).slice(-Math.max(1, ders.ustalik.son));
  const d = pencere.filter((s) => s === "d").length;
  const y = pencere.filter((s) => s === "y").length;
  return { oran: d + y ? d / (d + y) : null, n: pencere.length };
}

/** Ustalık: ders tamamlanmış, pencere dolmuş (ya da dersteki bütün alıştırmalar görülmüş) ve oran eşiğin üstünde. */
export function ustaMi(kayit: DersKaydi | undefined, ders: Ders): boolean {
  if (!kayit?.tamam || ders.tur === "test" || ders.tur === "tekrar") return false;
  const { oran, n } = ustalikOrani(kayit, ders);
  const gereken = Math.min(ders.ustalik.son, Math.max(1, ders.alistirmalar.length));
  return n >= gereken && oran !== null && oran >= ders.ustalik.oran;
}

/** Henüz tamamlanmamış etkin önkoşullar. */
export function eksikOnkosullar(dz: Dizin, durum: Durum, kimlik: string): string[] {
  return etkinOnkosul(dz, kimlik).filter((o) => !durum.dersler[o]?.tamam);
}

export function dersDurumu(dz: Dizin, durum: Durum, kimlik: string): DersDurumu {
  const d = dz.dersler.get(kimlik);
  if (!d || !icerikVar(dz, d)) return "yakinda";
  const k = durum.dersler[kimlik];
  if (k?.tamam) return ustaMi(k, d) ? "usta" : "tamam";
  // Seviye testi kilitliyken de girilebilir: önkoşul aranmaz.
  if (d.tur !== "test" && eksikOnkosullar(dz, durum, kimlik).length) return "kilitli";
  return k?.basla ? "devam" : "acik";
}

export function acilabilir(dz: Dizin, durum: Durum, kimlik: string): boolean {
  const s = dersDurumu(dz, durum, kimlik);
  return s !== "yakinda" && s !== "kilitli";
}

// ───────────── Seri ─────────────
/** Bir oturum bitince: bugün zaten sayıldıysa değişmez, dün çalışıldıysa artar, değilse 1'den başlar. */
export function seriGuncelle(seri: Durum["seri"], simdi: Date): Durum["seri"] {
  const bugun = gunAnahtari(simdi);
  if (seri.gun === bugun) return seri;
  if (seri.gun === oncekiGun(bugun)) return { gun: bugun, sayi: seri.sayi + 1 };
  return { gun: bugun, sayi: 1 };
}

/** Ekranda gösterilecek seri: bugün ya da dün çalışıldıysa sürüyor, yoksa 0. */
export function seriGorunen(seri: Durum["seri"], simdi: Date): { sayi: number; bugunTamam: boolean } {
  const bugun = gunAnahtari(simdi);
  if (seri.gun === bugun) return { sayi: seri.sayi, bugunTamam: true };
  if (seri.gun === oncekiGun(bugun)) return { sayi: seri.sayi, bugunTamam: false };
  return { sayi: 0, bugunTamam: false };
}

export function bugunSayaci(durum: Durum, simdi: Date): { ders: number; xp: number; hedef: number } {
  const ayni = durum.bugun.gun === gunAnahtari(simdi);
  return { ders: ayni ? durum.bugun.ders : 0, xp: ayni ? durum.bugun.xp : 0, hedef: durum.hedef };
}

// ───────────── Pist özeti ve seviye ─────────────
export type PistOzeti = {
  /** Yazılmış zorunlu derslerin yüzde kaçı tamam (iskelet dersler hesaba girmez) */
  yuzde: number;
  tamam: number;
  toplam: number;
  /** Bulunulan ünitenin seviyesi (1–10) */
  seviye: number;
  /** Sıradaki ders: açık ya da devam eden ilk zorunlu ders */
  siradaki: string | null;
  /** Pistte içeriği henüz yazılmamış zorunlu ders var mı */
  hazirlaniyor: boolean;
};

const zorunluMu = (d: Ders) => (d.tur === "ders" || d.tur === "kontrol") && d.zorunlu !== false;

export function pistOzeti(dz: Dizin, durum: Durum, pist: PistKimlik): PistOzeti {
  const zorunlu = pistDersleri(dz, pist).filter(zorunluMu);
  const yazili = zorunlu.filter((d) => icerikVar(dz, d));
  const biten = yazili.filter((d) => durum.dersler[d.kimlik]?.tamam);
  const siradaki = yazili.find((d) => ["acik", "devam"].includes(dersDurumu(dz, durum, d.kimlik)))?.kimlik ?? null;
  const uniteler = pistUniteleri(dz, pist);
  const yer = siradaki ?? biten.at(-1)?.kimlik;
  const seviye = (yer ? dz.uniteler.get(dz.dersUnite.get(yer) ?? "")?.seviye : uniteler[0]?.seviye) ?? 1;
  return {
    yuzde: yazili.length ? Math.round((100 * biten.length) / yazili.length) : 0,
    tamam: biten.length,
    toplam: yazili.length,
    seviye,
    siradaki,
    hazirlaniyor: yazili.length < zorunlu.length,
  };
}

export function uniteOzeti(dz: Dizin, durum: Durum, uniteKimlik: string): { tamam: number; toplam: number } {
  const yazili = (dz.uniteler.get(uniteKimlik)?.dersler ?? []).filter((d) => zorunluMu(d) && icerikVar(dz, d));
  return { tamam: yazili.filter((d) => durum.dersler[d.kimlik]?.tamam).length, toplam: yazili.length };
}

// ───────────── Aralıklı tekrar ve zayıf konular ─────────────
function tekrarAdaylari(dz: Dizin, durum: Durum) {
  return [...dz.dersler.values()].filter(
    (d) => (d.tur === "ders" || d.tur === "kontrol") && icerikVar(dz, d) && durum.dersler[d.kimlik]?.tamam,
  );
}

/**
 * Günde bir tekrar önerisi. Aday: tamamlanmış bir ders; doğruluğu ustalık eşiğinin altında
 * ve en az bir gün önce görülmüş ya da 7 gündür hiç görülmemiş. En zayıf ve en eski olan seçilir.
 * Bugün tekrar yapıldıysa öneri yoktur.
 */
export function tekrarOner(dz: Dizin, durum: Durum, simdi: Date): string | null {
  if (durum.sonTekrar === gunAnahtari(simdi)) return null;
  let en: { kimlik: string; puan: number } | null = null;
  for (const d of tekrarAdaylari(dz, durum)) {
    const k = durum.dersler[d.kimlik];
    const gun = Math.max(0, gunFarki(new Date(k.son ?? k.tamam!), simdi));
    const { oran } = ustalikOrani(k, d);
    const zayif = oran !== null && oran < d.ustalik.oran;
    if (!((zayif && gun >= 1) || gun >= 7)) continue;
    const puan = (zayif ? (1 - oran!) * 10 : 0) + k.yanlis.length + Math.min(gun, 30) / 3;
    if (!en || puan > en.puan) en = { kimlik: d.kimlik, puan };
  }
  return en?.kimlik ?? null;
}

/** Zayıf konular: tamamlanmış, en az 4 puanlanmış cevabı olan ve doğruluğu ustalık eşiğinin altındaki dersler. */
export function zayifDersler(dz: Dizin, durum: Durum, sinir = 3): { kimlik: string; baslik: string; oran: number }[] {
  return tekrarAdaylari(dz, durum)
    .map((d) => {
      const k = durum.dersler[d.kimlik];
      const { oran } = ustalikOrani(k, d);
      const puanli = k.sonuclar.slice(-d.ustalik.son).filter((s) => s !== "k").length;
      return { kimlik: d.kimlik, baslik: d.baslik, oran: oran ?? 1, puanli, esik: d.ustalik.oran };
    })
    .filter((x) => x.puanli >= 4 && x.oran < x.esik)
    .sort((a, b) => a.oran - b.oran)
    .slice(0, sinir)
    .map(({ kimlik, baslik, oran }) => ({ kimlik, baslik, oran }));
}

// ───────────── Oturum ─────────────
export type OturumModu = "ders" | "tekrar";
export type OturumSorusu = { ders: string; a: Alistirma };
export type OturumCevabi = { ders: string; alistirma: string; sonuc: Sonuc };

/**
 * Oturumda sorulacak alıştırmalar.
 * Ders, kontrol, test: dersin kendi alıştırmaları, yazıldığı sırayla.
 * Tekrar düğümü ve aralıklı tekrar: önce geçmişte yanlış yapılanlar, sonra kalanlar.
 */
export function oturumSorulari(dz: Dizin, durum: Durum, kimlik: string, mod: OturumModu): OturumSorusu[] {
  const d = dz.dersler.get(kimlik);
  if (!d) return [];
  const havuz = d.tur === "tekrar" ? tekrarHavuzu(dz, d) : d.alistirmalar.map((a) => ({ ders: kimlik, a }));
  if (d.tur !== "tekrar" && mod !== "tekrar") return havuz;
  const yanlisMi = (s: OturumSorusu) => (durum.dersler[s.ders]?.yanlis ?? []).includes(s.a.kimlik);
  const sirali = [...havuz.filter(yanlisMi), ...havuz.filter((s) => !yanlisMi(s))];
  const adet = d.tur === "tekrar" ? Math.max(1, d.hedefAlistirma || 8) : TEKRAR_SORU;
  return sirali.slice(0, adet);
}

/** Dersi "devam ediyor" olarak işaretler (ilk soru açıldığında). */
export function dersBaslat(durum: Durum, kimlik: string, simdi: Date): Durum {
  const k = durum.dersler[kimlik] ?? bosKayit();
  if (k.basla) return durum;
  return { ...durum, dersler: { ...durum.dersler, [kimlik]: { ...k, basla: simdi.toISOString() } } };
}

export type OturumOzeti = {
  xp: number;
  dogru: number;
  kabul: number;
  yanlis: number;
  /** Yüzde; kabul edilebilir cevaplar paydaya girmez */
  dogruluk: number;
  seriOnce: number;
  seriSonra: number;
  /** Bugünün ilk oturumu mu (seri bugün işlendi) */
  seriIslendi: boolean;
  /** Yalnızca testte: geçti mi */
  testGecti: boolean | null;
  /** Testle açılan ders sayısı */
  acilan: number;
  ustaOldu: boolean;
  ilkTamamlama: boolean;
  hedefTamam: boolean;
};

export function oturumXp(cevaplar: Pick<OturumCevabi, "sonuc">[]): number {
  return cevaplar.filter((c) => c.sonuc === "d").length * XP_DOGRU + XP_DERS;
}

/**
 * Biten oturumu ilerlemeye işler. `cevaplar` her alıştırmanın İLK denemesidir
 * (ders sonunda yeniden sorulan yanlışlar XP ve ustalık hesabına girmez).
 */
export function oturumUygula(
  dz: Dizin,
  durum: Durum,
  oturum: { kimlik: string; mod: OturumModu; cevaplar: OturumCevabi[] },
  simdi: Date,
): { durum: Durum; ozet: OturumOzeti } {
  const ders = dz.dersler.get(oturum.kimlik);
  const an = simdi.toISOString();
  const bugun = gunAnahtari(simdi);
  const dersler: Record<string, DersKaydi> = { ...durum.dersler };
  const al = (k: string): DersKaydi => {
    const mevcut = dersler[k];
    const kopya = mevcut ? { ...mevcut, sonuclar: [...mevcut.sonuclar], yanlis: [...mevcut.yanlis] } : bosKayit();
    dersler[k] = kopya;
    return kopya;
  };

  const dogru = oturum.cevaplar.filter((c) => c.sonuc === "d").length;
  const kabul = oturum.cevaplar.filter((c) => c.sonuc === "k").length;
  const yanlis = oturum.cevaplar.filter((c) => c.sonuc === "y").length;
  const oran = dogru + yanlis ? dogru / (dogru + yanlis) : 1;

  const ustaOnce = ders ? ustaMi(durum.dersler[oturum.kimlik], ders) : false;
  for (const c of oturum.cevaplar) {
    const k = al(c.ders);
    k.sonuclar = [...k.sonuclar, c.sonuc].slice(-SONUC_SINIRI);
    if (c.sonuc === "y" && !k.yanlis.includes(c.alistirma)) k.yanlis.push(c.alistirma);
    if (c.sonuc === "d") k.yanlis = k.yanlis.filter((x) => x !== c.alistirma);
    k.son = an;
  }

  const hedef = al(oturum.kimlik);
  hedef.son = an;
  hedef.basla ??= an;
  hedef.tur += 1;
  const tamamOnce = !!hedef.tamam;
  let testGecti: boolean | null = null;
  let acilan = 0;
  if (ders?.tur === "test") {
    testGecti = oran >= ders.ustalik.oran;
    if (testGecti) {
      hedef.tamam ??= an;
      for (const k of testKapsami(dz, oturum.kimlik)) {
        if (dersler[k]?.tamam) continue;
        const r = al(k);
        r.tamam = an;
        r.testle = true;
        r.son ??= an;
        acilan++;
      }
    }
  } else {
    hedef.tamam ??= an;
  }

  const xp = oturumXp(oturum.cevaplar);
  const seriOnce = seriGorunen(durum.seri, simdi).sayi;
  const seri = seriGuncelle(durum.seri, simdi);
  const onceki = durum.bugun.gun === bugun ? durum.bugun : { gun: bugun, ders: 0, xp: 0 };
  const yeni: Durum = {
    ...durum,
    xp: durum.xp + xp,
    seri,
    bugun: { gun: bugun, ders: onceki.ders + 1, xp: onceki.xp + xp },
    sonTekrar: oturum.mod === "tekrar" ? bugun : durum.sonTekrar,
    dersler,
  };
  return {
    durum: yeni,
    ozet: {
      xp,
      dogru,
      kabul,
      yanlis,
      dogruluk: Math.round(oran * 100),
      seriOnce,
      seriSonra: seri.sayi,
      seriIslendi: durum.seri.gun !== bugun,
      testGecti,
      acilan,
      ustaOldu: !!ders && !ustaOnce && ustaMi(dersler[oturum.kimlik], ders),
      ilkTamamlama: !tamamOnce && !!hedef.tamam,
      hedefTamam: onceki.ders < durum.hedef && onceki.ders + 1 >= durum.hedef,
    },
  };
}

export function hedefAyarla(durum: Durum, hedef: number): Durum {
  return { ...durum, hedef: Math.min(5, Math.max(1, Math.round(hedef) || 1)) };
}
