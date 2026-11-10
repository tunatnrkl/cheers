import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/RichText";
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
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="link inline-flex min-h-11 items-center self-start text-sm">
        ← Blog
      </Link>
      <header>
        <span className="tag">{post.tag}</span>
        <h1 className="h1 mt-2">{post.title}</h1>
        <p className="mt-1 text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </time>{" "}
          · {post.minutes} dk okuma
        </p>
      </header>
      <div className="flex flex-col gap-4 text-[17px] leading-relaxed">
        {post.body.map((b, i) => (
          <section key={i}>
            {b.h && <h2 className="h2 mb-1">{b.h}</h2>}
            <RichText text={b.p} />
          </section>
        ))}
      </div>
      <div className="card mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">Okuduğunu dene</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/alistirma" className="btn btn-primary">Alıştırma yap</Link>
          <Link href="/yapay-zeka" className="btn">Yapay zekaya sor</Link>
        </div>
      </div>
    </article>
  );
}
