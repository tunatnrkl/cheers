"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { RichText } from "@/components/RichText";
import type { Quiz as QuizData, QuizQuestion } from "@/data/quizzes";

// Puan, seri, süre ya da kayıt yok: seçim yapılır, doğru cevap ve gerekçe hemen gösterilir.
// Seçimden sonra butonlar aria-disabled olur (disabled değil), böylece odak kaybolmaz.
// Cevaplar yalnızca bu sayfa açıkken bellekte tutulur (docs/ekip/2026-11-12/16-quiz-bileseni-spec.md).

const LETTERS = "ABCDEFGH";

function Question({ q, n, total, picked, onPick }: { q: QuizQuestion; n: number; total: number; picked: number | undefined; onPick: (i: number) => void }) {
  const id = useId();
  const done = picked !== undefined;
  const right = picked === q.correct;
  return (
    <li className="card flex flex-col gap-3">
      <fieldset className="flex flex-col gap-3" aria-describedby={done ? `${id}-fb` : undefined}>
        <legend className="mb-1 font-semibold">
          <span className="block text-sm font-bold text-muted">
            Soru {n} / {total}
          </span>
          <span className="mt-1 block text-[17px] leading-relaxed">{q.q}</span>
        </legend>
        <div className="grid gap-2">
          {q.options.map((o, i) => {
            const isPicked = picked === i;
            const isCorrect = done && i === q.correct;
            const mark = isCorrect ? "Doğru cevap" : isPicked ? "Senin seçimin" : null;
            return (
              <button
                key={i}
                type="button"
                aria-disabled={done || undefined}
                aria-pressed={isPicked}
                onClick={() => !done && onPick(i)}
                className={`flex min-h-11 w-full items-start gap-3 rounded-[14px] border px-3.5 py-2.5 text-left text-[15px] transition aria-disabled:cursor-default ${
                  isCorrect
                    ? "border-accent bg-soft"
                    : isPicked
                      ? "border-danger bg-danger-soft"
                      : done
                        ? "border-line opacity-70"
                        : "border-line bg-surface hover:border-muted/60 hover:bg-surface-2"
                }`}
              >
                <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">
                  {LETTERS[i]}
                  <span className="sr-only">)</span>
                </span>
                <span className="flex-1">
                  {o}
                  {mark && <span className={`mt-0.5 block text-xs font-bold ${isCorrect ? "text-accent-text" : "text-danger"}`}>{mark}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div id={`${id}-fb`} aria-live="polite">
        {done && (
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="font-bold">{right ? "Doğru." : `Doğru cevap ${LETTERS[q.correct]}.`}</p>
            <RichText text={q.why} className="mt-1 text-[15px] leading-relaxed" />
            {q.spot && (
              <Link href={`/alistirma?el=${q.spot}`} className="link mt-2 inline-flex min-h-11 items-center text-sm">
                Bu fikri masada dene →
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function Quiz({ quiz }: { quiz: QuizData }) {
  const [picked, setPicked] = useState<(number | undefined)[]>(() => quiz.questions.map(() => undefined));
  const top = useRef<HTMLDivElement>(null);
  const answered = picked.filter((p) => p !== undefined).length;
  const total = quiz.questions.length;

  const restart = () => {
    setPicked(quiz.questions.map(() => undefined));
    top.current?.focus();
    top.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={top} tabIndex={-1} className="sr-only">
        Sorular
      </div>
      <ol className="flex flex-col gap-4">
        {quiz.questions.map((q, i) => (
          <Question key={i} q={q} n={i + 1} total={total} picked={picked[i]} onPick={(c) => setPicked((p) => p.map((x, j) => (j === i ? c : x)))} />
        ))}
      </ol>
      <div className="card flex flex-col gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {answered < total ? `${total} sorunun ${answered} tanesine baktın.` : "Bütün sorulara baktın."} Cevapların kaydedilmez.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/alistirma?oyun=${quiz.game}&konu=${quiz.topic}`} className="btn btn-primary">
            Bu konuda alıştırma yap
          </Link>
          {answered > 0 && (
            <button type="button" className="btn" onClick={restart}>
              Baştan başla
            </button>
          )}
          <Link href="/quiz" className="btn btn-ghost">
            Diğer quiz'ler
          </Link>
        </div>
      </div>
    </div>
  );
}
