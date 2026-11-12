import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POST_BY_SLUG } from "@/data/blog";
import { QUIZ_BY_SLUG, QUIZZES } from "@/data/quizzes";
import { Quiz } from "../Quiz";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return QUIZZES.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quiz = QUIZ_BY_SLUG.get((await params).slug);
  if (!quiz) return {};
  return { title: `Quiz: ${quiz.title}`, description: quiz.summary };
}

export default async function Page({ params }: Props) {
  const quiz = QUIZ_BY_SLUG.get((await params).slug);
  if (!quiz) notFound();
  const posts = quiz.posts.map((s) => POST_BY_SLUG.get(s)).filter((p) => p !== undefined);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/quiz" className="link inline-flex min-h-11 items-center self-start text-sm">
        ← Quiz'ler
      </Link>
      <header>
        <span className="flex flex-wrap gap-1.5">
          <span className="tag">{quiz.game === "cash" ? "Cash game" : "Turnuva"}</span>
          <span className="tag">{quiz.level}</span>
        </span>
        <h1 className="h1 mt-2">{quiz.title}</h1>
        <p className="lead mt-2">{quiz.summary}</p>
      </header>
      <details className="card group">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Varsayımlar ({quiz.questions.length} soruda da geçerli)</summary>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{quiz.assumptions}</p>
      </details>
      <Quiz quiz={quiz} />
      {posts.length > 0 && (
        <section className="card">
          <h2 className="h2">İlgili yazılar</h2>
          <ul className="mt-2 flex flex-col">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="link inline-flex min-h-11 items-center">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-sm text-muted">
        Bu sorular eğitim amaçlıdır; gerçek parayla oynanan oyunlarda sonuç garantisi vermez. Oyun keyfini kaçırıyorsa{" "}
        <Link href="/sorumlu-oyun" className="link">
          sorumlu oyun
        </Link>{" "}
        sayfasına bak.
      </p>
    </div>
  );
}
