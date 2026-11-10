import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/data/blog";
import { GLOSSARY } from "@/data/glossary";

export const metadata: Metadata = {
  title: "Öğren",
  description: "Cash game ve turnuva rehberleri, hesap makineleri, poker sözlüğü ve blog yazıları.",
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
      ["/yapay-zeka", "Kendi elini sor", "Oynadığın bir eli anlat, yapay zekadan değerlendirme al"],
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
    <div className="flex flex-col gap-10">
      <header>
        <p className="eyebrow">Öğren</p>
        <h1 className="h1 mt-2">Masanın dışında çalış</h1>
        <p className="lead mt-2 max-w-2xl">Kavramları oku, hesapla, aralıklara bak. Sonra masaya dönüp dene.</p>
      </header>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">{g.title}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map(([href, t, d]) => (
              <li key={href}>
                <Link href={href} className="card flex h-full items-center justify-between gap-4 transition hover:border-accent/50">
                  <span>
                    <span className="block text-lg font-bold">{t}</span>
                    <span className="block text-sm text-muted">{d}</span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-accent">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
