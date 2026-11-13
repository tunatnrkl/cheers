// Tek renkli çizgi simgeleri (currentColor). Hepsi dekoratiftir: anlam her zaman yanındaki yazıyla verilir.
// Yeni simge eklerken 24x24 ızgarada, 2px çizgiyle, köşeler yuvarlak çiz.
const YOLLAR = {
  ok: "M5 12h14M13 6l6 6-6 6",
  geri: "M19 12H5M11 6l-6 6 6 6",
  sag: "M9 6l6 6-6 6",
  sol: "M15 6l-6 6 6 6",
  disari: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  ara: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5",
  ev: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
  masa: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  matris: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  ogren: "M3 7l9-4 9 4-9 4-9-4zm3 2.5V15c0 1.5 3 3 6 3s6-1.5 6-3V9.5",
  profil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8.5a7.5 7.5 0 0 1 15 0",
  kitap: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z",
  hesap: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2",
  sozluk: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6",
  yazi: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  sohbet: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z",
  bilgi: "M12 11v6M12 7.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  kalkan: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z",
  telefon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  tik: "M4.5 12.5l5 5 10-11",
  carpi: "M6 6l12 12M18 6 6 18",
  indir: "M12 4v11M7 10l5 5 5-5M5 20h14",
  yukle: "M12 20V9M7 14l5-5 5 5M5 4h14",
  cop: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  yer: "M6 3h12v18l-6-4.5L6 21z",
  kilit: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z",
  tema: "M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A7 7 0 0 1 12 3z",
} as const;

export type IkonAdi = keyof typeof YOLLAR;

export function Ikon({ ad, boyut = 20, kalin = 2, className }: { ad: IkonAdi; boyut?: number; kalin?: number; className?: string }) {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={kalin}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={YOLLAR[ad]} />
    </svg>
  );
}
