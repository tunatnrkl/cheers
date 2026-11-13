import type { Metadata } from "next";
import { KartBaglanti, Rozet, SayfaBasligi } from "@/components/ui";
import { POSTS } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Texas Hold'em'in temel kavramları üzerine kısa, özgün ve sade Türkçe yazılar: pozisyon, pot odds, c-bet, push/fold, ICM.",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <SayfaBasligi baslik="Blog" aciklama="Önemli kavramlar, her biri birkaç dakikalık okumayla." />
      <ul className="grid gap-4 md:grid-cols-2">
        {[...POSTS].reverse().map((p) => (
          <li key={p.slug}>
            <KartBaglanti
              href={`/blog/${p.slug}`}
              ust={<Rozet>{p.tag}</Rozet>}
              baslik={p.title}
              aciklama={p.summary}
              alt={
                <span className="text-muted">
                  {formatDate(p.date)} · {p.minutes} dk okuma
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
