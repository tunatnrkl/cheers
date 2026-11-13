import type { DersTuru } from "@/lib/mufredat/tipler";
import type { DersDurumu } from "@/lib/ogren/ilerleme";

// Öğrenme yolunda kullanılan küçük çizgi simgeleri. Hepsi dekoratiftir (aria-hidden);
// anlam her zaman yanındaki yazıyla da verilir.
const YOL = {
  kilit: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z",
  oynat: "M8 5.5v13l11-6.5z",
  tik: "M4.5 12.5l5 5 10-11",
  tac: "M4 18h16M4.5 16 3 7l5 4 4-6 4 6 5-4-1.5 9z",
  saat: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  bayrak: "M5 21V4M5 4h11l-2 4 2 4H5",
  merdiven: "M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10",
  tekrar: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  kapat: "M6 6l12 12M18 6 6 18",
  yukari: "M12 19V5M5 12l7-7 7 7",
  asagi: "M12 5v14M5 12l7 7 7-7",
  geri: "M15 5l-7 7 7 7",
  carpi: "M7 7l10 10M17 7 7 17",
  bilgi: "M12 11v6M12 7.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  ates: "M12 21c-4 0-7-2.8-7-6.6 0-3.5 2.6-5.6 3.9-8.4.4 1.9 1.4 3 2.6 3.7C11.6 6.6 13 4.4 15.6 3c-.6 3 1.2 4.9 2.4 6.7.9 1.4 1 2.6 1 4.4C19 18.2 16 21 12 21z",
  hedef: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  ok: "M5 12h14M13 6l6 6-6 6",
} as const;

export type SimgeAdi = keyof typeof YOL;

export function Simge({ ad, boyut = 24, kalin = 2.2, className }: { ad: SimgeAdi; boyut?: number; kalin?: number; className?: string }) {
  const dolu = ad === "oynat";
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill={dolu ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={kalin}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={YOL[ad]} />
    </svg>
  );
}

export const DURUM_YAZI: Record<DersDurumu, string> = {
  yakinda: "Yakında",
  kilitli: "Kilitli",
  acik: "Açık",
  devam: "Devam ediyor",
  tamam: "Tamamlandı",
  usta: "Ustalaştı",
};

export const TUR_YAZI: Record<DersTuru, string> = {
  ders: "Ders",
  kontrol: "Ünite kontrolü",
  test: "Seviye atlama testi",
  tekrar: "Tekrar",
};

/** Düğümün içindeki simge: önce durum, sonra tür. */
export function dugumSimgesi(durum: DersDurumu, tur: DersTuru): SimgeAdi {
  if (durum === "usta") return "tac";
  if (durum === "tamam") return "tik";
  if (durum === "kilitli") return "kilit";
  if (durum === "yakinda") return "saat";
  if (tur === "kontrol") return "bayrak";
  if (tur === "test") return "merdiven";
  if (tur === "tekrar") return "tekrar";
  return "oynat";
}
