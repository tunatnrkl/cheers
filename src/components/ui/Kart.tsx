import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Ikon } from "./Ikon";

// Kart: düz yüzey, ince kenar, yumuşak gölge (.card). Başlık Fraunces (.h2).

type KartProps = {
  as?: "section" | "div" | "article" | "li" | "aside";
  baslik?: ReactNode;
  /** Başlık kimliği: bölümü aria-labelledby ile adlandırır */
  baslikId?: string;
  /** Başlığın yanında küçük eylem (bağlantı vb.) */
  eylem?: ReactNode;
  duz?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Kart({
  as: Etiket = "section",
  baslik,
  baslikId,
  eylem,
  duz,
  className = "",
  children,
  ...rest
}: KartProps & Omit<ComponentProps<"section">, keyof KartProps | "ref">) {
  const h = baslik ? (
    <h2 id={baslikId} className="h2">
      {baslik}
    </h2>
  ) : null;
  return (
    <Etiket className={`card ${duz ? "card-flat" : ""} ${className}`.trim()} aria-labelledby={baslik && baslikId ? baslikId : undefined} {...rest}>
      {h && eylem ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          {h}
          {eylem}
        </div>
      ) : (
        h
      )}
      {children}
    </Etiket>
  );
}

/** Tıklanabilir kart: başlık, açıklama, altta rozet ve ok (ana sayfadaki spot kartlarının dili) */
export function KartBaglanti({
  href,
  ust,
  baslik,
  aciklama,
  alt,
  className = "",
}: {
  href: string;
  ust?: ReactNode;
  baslik: ReactNode;
  aciklama?: ReactNode;
  alt?: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`card card-link group ${className}`.trim()}>
      {ust && <span className="text-sm font-semibold text-muted">{ust}</span>}
      <span className={`${ust ? "mt-1.5" : ""} text-lg leading-snug font-bold`}>{baslik}</span>
      {aciklama && <span className="mt-1 flex-1 text-sm text-muted">{aciklama}</span>}
      <span className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0">{alt}</span>
        <Ikon ad="ok" boyut={18} className="shrink-0 text-accent-text transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Düz not kutusu: sorumlu oyun notu, açıklama, uyarı */
export function NotKutusu({ children, className = "", ...rest }: { children: ReactNode; className?: string } & ComponentProps<"div">) {
  return (
    <div className={`not-kutu ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
