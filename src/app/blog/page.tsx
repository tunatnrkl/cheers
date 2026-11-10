import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Texas Hold'em'in temel kavramları üzerine kısa, özgün ve sade Türkçe yazılar: pozisyon, pot odds, c-bet, push/fold, ICM.",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">Blog</h1>
        <p className="lead mt-1">Önemli kavramlar, her biri birkaç dakikalık okumayla.</p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {[...POSTS].reverse().map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="card flex h-full flex-col gap-1 transition-colors hover:border-accent">
              <span className="tag self-start">{p.tag}</span>
              <span className="text-lg font-semibold">{p.title}</span>
              <span className="text-sm text-muted">{p.summary}</span>
              <span className="mt-auto pt-2 text-xs text-muted">
                {formatDate(p.date)} · {p.minutes} dk okuma
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
