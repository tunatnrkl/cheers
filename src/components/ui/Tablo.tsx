import type { ReactNode } from "react";

// Veri tablosu: başlık (caption), sütun başlıkları scope="col", dar ekranda kendi içinde yatay kayar.
// `sayi`: sağa yaslanacak sütunların sırası. `satirBasligi`: ilk sütun satır başlığı (th scope="row").
export function Tablo({
  baslik,
  gizliBaslik,
  sutunlar,
  satirlar,
  sayi = [],
  satirBasligi,
  className = "",
}: {
  baslik?: ReactNode;
  /** Başlık yalnızca ekran okuyucuya */
  gizliBaslik?: boolean;
  sutunlar: ReactNode[];
  satirlar: ReactNode[][];
  sayi?: number[];
  satirBasligi?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="tablo">
        {baslik && <caption className={gizliBaslik ? "sr-only" : "h2"}>{baslik}</caption>}
        <thead>
          <tr>
            {sutunlar.map((s, i) => (
              <th key={i} scope="col" className={sayi.includes(i) ? "sayi" : undefined}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, i) =>
                i === 0 && satirBasligi ? (
                  <th key={i} scope="row" className="satir-basligi">
                    {c}
                  </th>
                ) : (
                  <td key={i} className={sayi.includes(i) ? "sayi" : undefined}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
