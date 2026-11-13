import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/RichText";
import { ButonBaglanti, Ikon, Kart, Rozet } from "@/components/ui";
import { POST_BY_SLUG, POSTS } from "@/data/blog";
import { SITE_NAME, siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = POST_BY_SLUG.get((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: { type: "article", title: post.title, description: post.summary, publishedTime: post.date },
  };
}

export default async function Page({ params }: Props) {
  const post = POST_BY_SLUG.get((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    inLanguage: "tr",
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="link -mb-2 inline-flex min-h-11 items-center gap-1.5 self-start text-sm">
        <Ikon ad="geri" boyut={16} />
        Blog
      </Link>
      <header className="sayfa-baslik">
        <Rozet className="self-start">{post.tag}</Rozet>
        <h1 className="h1">{post.title}</h1>
        <p className="text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </time>{" "}
          · {post.minutes} dk okuma
        </p>
      </header>
      <div className="metin flex flex-col gap-5">
        {post.body.map((b, i) => (
          <section key={i}>
            {b.h && <h2 className="h2 mb-1.5">{b.h}</h2>}
            <RichText text={b.p} />
          </section>
        ))}
      </div>
      <Kart as="aside" duz className="mt-2 flex flex-wrap items-center justify-between gap-3" aria-label="Okuduğunu dene">
        <p className="font-display text-lg font-semibold">Okuduğunu dene</p>
        <div className="flex flex-wrap gap-2">
          <ButonBaglanti href="/alistirma" tur="birincil">
            Alıştırma yap
          </ButonBaglanti>
          {process.env.NEXT_PUBLIC_STATIC === "1" ? (
            <ButonBaglanti href="/ogren">Öğrenme yolu</ButonBaglanti>
          ) : (
            <ButonBaglanti href="/yapay-zeka">Yapay zekaya sor</ButonBaglanti>
          )}
        </div>
      </Kart>
    </article>
  );
}
