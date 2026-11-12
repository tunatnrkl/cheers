import type { Metadata } from "next";
import Link from "next/link";
import { QUIZZES } from "@/data/quizzes";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Kısa tekrar soruları: blind savunması, SPR ve value bet, bubble'da ICM. Her cevabın gerekçesi hemen gösterilir; puan ya da kayıt yok.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="eyebrow">Öğren</p>
        <h1 className="h1 mt-2">Quiz</h1>
        <p className="lead mt-2 max-w-2xl">
          Okuduğunu hatırlamaya çalışmak, yeniden okumaktan daha kalıcı öğretir. Her soruda cevabını seç, gerekçeyi hemen gör. Puan tutulmaz, cevapların kaydedilmez.
        </p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {QUIZZES.map((z) => (
          <li key={z.slug}>
            <Link href={`/quiz/${z.slug}`} className="card flex h-full flex-col gap-1 transition-colors hover:border-accent">
              <span className="flex flex-wrap gap-1.5">
                <span className="tag">{z.game === "cash" ? "Cash game" : "Turnuva"}</span>
                <span className="tag">{z.level}</span>
              </span>
              <span className="text-lg font-semibold">{z.title}</span>
              <span className="text-sm text-muted">{z.summary}</span>
              <span className="mt-auto pt-2 text-xs text-muted">{z.questions.length} soru</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
