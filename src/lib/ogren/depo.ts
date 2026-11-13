"use client";

// Öğrenme yolu deposu: ilerlemeyi localStorage'da sürümlü anahtarda tutar (hesap gerekmez).
// Eski pd-… anahtarlarına dokunmaz. Bozuk kayıt yedeklenir, yol baştan başlar ve
// kullanıcıya nötr bir not gösterilir. Bütün kurallar ilerleme.ts'teki saf fonksiyonlardadır.
import { useEffect, useState } from "react";
import { ANAHTAR, type Durum, bosDurum, depodanOku } from "./ilerleme";

export type DepoDurumu = {
  hazir: boolean;
  durum: Durum;
  /** Kayıt okunamadı, yedeklenip sıfırlandı */
  bozukNot: boolean;
  /** Tarayıcı depoya yazmaya izin vermiyor (gizli sekme, dolu depo) */
  yazilamadi: boolean;
};

type Depo = { s: DepoDurumu; dinleyenler: Set<() => void>; yuklendi: boolean };
const depolar = new Map<string, Depo>();
const SUNUCU: DepoDurumu = { hazir: false, durum: bosDurum(), bozukNot: false, yazilamadi: false };

function depo(anahtar: string): Depo {
  let d = depolar.get(anahtar);
  if (!d) depolar.set(anahtar, (d = { s: SUNUCU, dinleyenler: new Set(), yuklendi: false }));
  return d;
}

function yay(d: Depo, yama: Partial<DepoDurumu>) {
  d.s = { ...d.s, ...yama };
  d.dinleyenler.forEach((l) => l());
}

function yukle(anahtar: string) {
  const d = depo(anahtar);
  let metin: string | null = null;
  try {
    metin = localStorage.getItem(anahtar);
  } catch {}
  const { durum, bozuk } = depodanOku(metin);
  if (bozuk && metin !== null) {
    try {
      localStorage.setItem(`${anahtar}:yedek`, metin);
      localStorage.removeItem(anahtar);
    } catch {}
  }
  d.yuklendi = true;
  yay(d, { hazir: true, durum, bozukNot: bozuk });
}

export function useOgren(anahtar: string = ANAHTAR): DepoDurumu {
  const d = depo(anahtar);
  // Sunucuda ve ilk istemci çiziminde "hazır değil"; abonelik kurulduktan SONRA yüklenir,
  // böylece yükleme bildirimi hiçbir koşulda kaçmaz.
  const [s, setS] = useState<DepoDurumu>(SUNUCU);
  useEffect(() => {
    const guncel = () => setS(d.s);
    d.dinleyenler.add(guncel);
    if (!d.yuklendi) yukle(anahtar);
    guncel();
    // Başka sekmede yapılan değişiklik bu sekmeye de yansır.
    const dinle = (e: StorageEvent) => {
      if (e.key === anahtar || e.key === null) yukle(anahtar);
    };
    window.addEventListener("storage", dinle);
    return () => {
      d.dinleyenler.delete(guncel);
      window.removeEventListener("storage", dinle);
    };
  }, [anahtar, d]);
  return s;
}

/** Durumu günceller ve kaydeder. Güncelleyici saf olmalıdır. Yeni durumu döndürür. */
export function ogrenGuncelle(anahtar: string, guncelle: (d: Durum) => Durum): Durum {
  const d = depo(anahtar);
  if (!d.yuklendi) yukle(anahtar);
  const yeni = guncelle(d.s.durum);
  if (yeni === d.s.durum) return yeni;
  let yazilamadi = false;
  try {
    localStorage.setItem(anahtar, JSON.stringify(yeni));
  } catch {
    yazilamadi = true;
  }
  yay(d, { durum: yeni, yazilamadi });
  return yeni;
}

export function ogrenSifirla(anahtar: string) {
  const d = depo(anahtar);
  try {
    localStorage.removeItem(anahtar);
  } catch {}
  yay(d, { hazir: true, durum: bosDurum(), bozukNot: false, yazilamadi: false });
}

export function bozukNotuKapat(anahtar: string) {
  yay(depo(anahtar), { bozukNot: false });
}
