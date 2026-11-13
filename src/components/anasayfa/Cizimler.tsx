// "Üç adım" kartlarının küçük çizimleri: tek renk (currentColor), çizgi ağırlıklı, dekoratif.

const ORTAK = {
  viewBox: "0 0 96 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

/** Masaya otur: üstten bakılan masa, koltuklar, ortada iki kart ve bir çip yığını */
export function CizimMasa({ className }: { className?: string }) {
  return (
    <svg {...ORTAK} className={className}>
      <ellipse cx="48" cy="33" rx="38" ry="20" />
      <ellipse cx="48" cy="33" rx="30" ry="13.5" strokeOpacity="0.4" />
      <circle cx="48" cy="5" r="3" />
      <circle cx="14" cy="11" r="3" />
      <circle cx="82" cy="11" r="3" />
      <circle cx="14" cy="55" r="3" />
      <circle cx="82" cy="55" r="3" />
      <circle cx="48" cy="60" r="3" fill="currentColor" />
      <rect x="37" y="25" width="10" height="14" rx="2" transform="rotate(-9 42 32)" />
      <rect x="48" y="25" width="10" height="14" rx="2" transform="rotate(9 53 32)" />
      <path d="M41.5 29.5l1.2 2.6M53.6 29.6l-1 2.7" strokeOpacity="0.6" />
      <ellipse cx="68" cy="40" rx="5" ry="2" />
      <path d="M63 40v-3.4M73 40v-3.4" />
      <ellipse cx="68" cy="36.6" rx="5" ry="2" />
    </svg>
  );
}

/** Kararını ver: üç karar butonu, ortadaki seçili, üstünde dokunuş halkası */
export function CizimKarar({ className }: { className?: string }) {
  return (
    <svg {...ORTAK} className={className}>
      <rect x="4" y="34" width="26" height="16" rx="8" />
      <rect x="35" y="34" width="26" height="16" rx="8" fill="currentColor" fillOpacity="0.16" strokeWidth="2.6" />
      <rect x="66" y="34" width="26" height="16" rx="8" />
      <path d="M12 42h10" />
      <path d="M43 42.5l3.6 3.4 7-7" />
      <path d="M74 42h10" />
      <path d="M41.5 24a9 9 0 0 1 13 0" />
      <path d="M37 18a15.5 15.5 0 0 1 22 0" strokeOpacity="0.45" />
      <path d="M48 56v4" strokeOpacity="0.45" />
    </svg>
  );
}

/** Koça sor: soru balonu ve kısa bir cevap balonu */
export function CizimKoc({ className }: { className?: string }) {
  return (
    <svg {...ORTAK} className={className}>
      <path d="M12 6h34a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H26l-9 7v-7h-5a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" />
      <path d="M25 15.5a4.5 4.5 0 1 1 6.3 4.1c-1.3.6-1.8 1.4-1.8 2.7" />
      <path d="M29.5 26.4v.2" strokeWidth="2.6" />
      <path
        d="M50 28h34a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-4v7l-8.5-7H50a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6z"
        fill="var(--surface)"
      />
      <path d="M52 37h28M52 43.5h18" strokeOpacity="0.7" />
    </svg>
  );
}
