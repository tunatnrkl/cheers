// Ana sayfadaki "Bir spot seç" kartları. Her kartın spot sayısı, kartın açtığı bağlantının
// alıştırma filtresinden üretilir; böylece kartta yazan sayı ile masada açılan havuz aynıdır.
import { filtreOku, havuz } from "@/app/alistirma/lib/filtreler";

const SPOTLAR = [
  {
    href: "/alistirma?oyun=cash&konu=acilis",
    eyebrow: "Cash · Preflop",
    title: "Açılış kararları",
    desc: "Pozisyona göre hangi ellerle açılır, hangileri bırakılır?",
  },
  {
    href: "/alistirma?oyun=turnuva&konu=pushfold",
    eyebrow: "Turnuva · Kısa stack",
    title: "Push / fold",
    desc: "6–15 BB ile all-in mi, fold mu? Pozisyon her şeyi değiştirir.",
  },
  {
    href: "/alistirma?oyun=turnuva&konu=callshove",
    eyebrow: "Turnuva · BB",
    title: "All-in'e call",
    desc: "Rakip itti. Elin, onun aralığına karşı yeterli mi?",
  },
  {
    href: "/alistirma?oyun=cash&sokak=postflop",
    eyebrow: "Cash · Postflop",
    title: "Flop, turn, river",
    desc: "C-bet, value bet, blöf, pot odds ve SPR kararları.",
  },
];

/** Bağlantının sorgu kısmından alıştırma havuzunun büyüklüğü */
export function baglantiSayisi(href: string): number {
  return havuz(filtreOku(new URLSearchParams(href.split("?")[1] ?? ""))).length;
}

export const SPOT_KARTLARI = SPOTLAR.map((s) => ({ ...s, n: baglantiSayisi(s.href) }));
