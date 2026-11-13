import type { ReactNode } from "react";

// İç sayfaların başlık bloğu: Fraunces başlık, altında sakin açıklama. Üst etiket büyük harf değil, italik.
export function SayfaBasligi({
  ust,
  baslik,
  aciklama,
  children,
}: {
  ust?: ReactNode;
  baslik: ReactNode;
  aciklama?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sayfa-baslik">
      {ust && <p className="eyebrow">{ust}</p>}
      <h1 className="h1">{baslik}</h1>
      {aciklama && <p className="lead max-w-2xl">{aciklama}</p>}
      {children}
    </header>
  );
}
