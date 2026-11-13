import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { POSTS } from "@/data/blog";
import { GLOSSARY } from "@/data/glossary";
import { OgrenYol } from "./OgrenYol";
import "./ogren.css";

export const metadata: Metadata = {
  title: "Öğren",
  description:
    "Cash ve turnuva için adım adım öğrenme yolu: kısa dersler, alıştırmalar ve tekrar. Ayrıca rehberler, hesap makineleri, poker sözlüğü ve blog.",
};

const GROUPS = [
  {
    title: "Rehberler",
    items: [
      ["/cash", "Cash game", "Stack derinliği, rake, pot odds, açılış aralıkları"],
      ["/turnuva", "Turnuva", "Blind yapısı, push/fold, ICM, bubble, final masası"],
    ],
  },
  {
    title: "Araçlar",
    items: [
      ["/araclar", "Hesap makineleri", "Pot odds, outs, SPR ve ICM"],
      ["/range", "Range matrisi", "Pozisyona göre açılış ve push aralıkları"],
      // Statik sürümde yapay zeka yok: koç alıştırmada hazır sorularla açıklar
      process.env.NEXT_PUBLIC_STATIC === "1"
        ? ["/alistirma", "Masada koça sor", "Alıştırmada “Neden?”e dokun; koç kararın gerekçesini kısaca anlatır"]
        : ["/yapay-zeka", "Kendi elini sor", "Oynadığın bir eli anlat, yapay zekadan değerlendirme al"],
    ],
  },
  {
    title: "Okuma",
    items: [
      ["/sozluk", "Sözlük", `${GLOSSARY.length} terim, sade Türkçe`],
      ["/blog", "Blog", `${POSTS.length} kısa yazı: pozisyon, pot odds, ICM…`],
    ],
  },
];

export default function Page() {
  return (
    <div className="og flex flex-col gap-12">
      <Suspense fallback={<div className="h-[100vh] animate-pulse rounded-[22px] bg-surface" aria-hidden="true" />}>
        <OgrenYol />
      </Suspense>

      <section aria-labelledby="kaynaklar" className="flex flex-col gap-6 border-t border-line pt-10">
        <header>
          <p className="eyebrow">Kaynaklar</p>
          <h2 id="kaynaklar" className="h1 mt-2 !text-[26px] sm:!text-[32px]">
            Masanın dışında çalış
          </h2>
          <p className="lead mt-2 max-w-2xl">Kavramları oku, hesapla, aralıklara bak. Sonra masaya dönüp dene.</p>
        </header>
        {GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h3 className="text-xl font-semibold">{g.title}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map(([href, t, d]) => (
                <li key={href}>
                  <Link href={href} className="card flex h-full items-center justify-between gap-4 transition hover:border-accent/50">
                    <span>
                      <span className="block text-lg font-bold">{t}</span>
                      <span className="block text-sm text-muted">{d}</span>
                    </span>
                    <span aria-hidden="true" className="text-xl text-accent-text">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </div>
  );
}
