// Cheers işareti: iki bira bardağı tokuşuyor, tokuşma anında küçük bir kıvılcım.
// Sol bardağın etiketinde gizli bir maça var. Renkler CSS değişkenlerinden gelir
// (--mark-beer, --mark-foam, --mark-spark); tek renkli kullanımda üçü de currentColor olur.
// Dosya sürümleri: public/brand/ (renkli, tek renk, favicon) ve src/app/icon.svg.

type Props = {
  className?: string;
  /** Erişilebilir ad. Boş bırakılırsa işaret dekoratif sayılır. */
  title?: string;
  /** Tek renk: tüm parçalar currentColor */
  mono?: boolean;
};

export function CheersMark({ className, title, mono }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`cheers-mark${mono ? " cheers-mark-mono" : ""}${className ? ` ${className}` : ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g className="mug-l">
        <g transform="translate(17 60) rotate(9)">
          <path
            fillRule="evenodd"
            fill="var(--mark-beer)"
            d="M-8 -28 H8 V-4 a4 4 0 0 1 -4 4 H-4 a4 4 0 0 1 -4 -4 Z M0.00 -18.46 C1.15 -16.59 3.89 -15.15 3.89 -12.85 C3.89 -11.12 2.16 -10.40 0.86 -11.41 L1.44 -9.39 H-1.44 L-0.86 -11.41 C-2.16 -10.40 -3.89 -11.12 -3.89 -12.85 C-3.89 -15.15 -1.15 -16.59 0.00 -18.46 Z"
          />
          <path
            fill="none"
            stroke="var(--mark-beer)"
            strokeWidth="3.2"
            strokeLinecap="round"
            d="M-8 -23 h-2.6 a4.6 4.6 0 0 0 -4.6 4.6 v4.4 a4.6 4.6 0 0 0 4.6 4.6 h2.6"
          />
          <g fill="var(--mark-foam)">
            <circle cx="-5" cy="-33.4" r="4.4" />
            <circle cx="1" cy="-35.6" r="5" />
            <circle cx="6.2" cy="-32.8" r="3.6" />
            <rect x="-9.8" y="-34" width="19.6" height="4.4" rx="2.2" />
          </g>
        </g>
      </g>
      <g className="mug-r">
        <g transform="translate(47 60) scale(-1 1) rotate(9)">
          <path
            fillRule="evenodd"
            fill="var(--mark-beer)"
            d="M-8 -28 H8 V-4 a4 4 0 0 1 -4 4 H-4 a4 4 0 0 1 -4 -4 Z M2.4 -24 h2.4 v17 h-2.4 Z"
          />
          <path
            fill="none"
            stroke="var(--mark-beer)"
            strokeWidth="3.2"
            strokeLinecap="round"
            d="M-8 -23 h-2.6 a4.6 4.6 0 0 0 -4.6 4.6 v4.4 a4.6 4.6 0 0 0 4.6 4.6 h2.6"
          />
          <g fill="var(--mark-foam)">
            <circle cx="-5" cy="-33.4" r="4.4" />
            <circle cx="1" cy="-35.6" r="5" />
            <circle cx="6.2" cy="-32.8" r="3.6" />
            <rect x="-9.8" y="-34" width="19.6" height="4.4" rx="2.2" />
          </g>
        </g>
      </g>
      <g fill="var(--mark-spark)" className="spark">
        <path d="M32 4 l1.6 4.3 4.3 1.6 -4.3 1.6 -1.6 4.3 -1.6 -4.3 -4.3 -1.6 4.3 -1.6 Z" />
        <rect x="22.6" y="8" width="2.2" height="4.6" rx="1.1" transform="rotate(-45 23.7 10.3)" />
        <rect x="39.2" y="8" width="2.2" height="4.6" rx="1.1" transform="rotate(45 40.3 10.3)" />
      </g>
    </svg>
  );
}
