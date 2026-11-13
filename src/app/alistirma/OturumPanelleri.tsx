"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AiPanel } from "@/components/AiPanel";
import { TOPICS, type Hand, type Topic } from "@/data/hands";
import { TOPIC_NOTES } from "@/data/topicNotes";
import { STATIC_SITE } from "@/lib/client/env";
import { RHYTHM_CHOICES, everyLabel, type RhythmEvery } from "@/lib/client/rhythm";
import { topicStats, weakTopics } from "@/lib/client/store";

// Oturum özeti ve oturum ritmi ara kartı (önceki Trainer.tsx'ten taşındı; davranış aynı).
export type Answer = { hand: Hand; chosen: number };

export function Summary({
  answers,
  onContinue,
  onReset,
  onTopic,
  analyze,
  setAnalyze,
}: {
  answers: Answer[];
  onContinue: () => void;
  onReset: () => void;
  onTopic: (t: Topic) => void;
  analyze: number;
  setAnalyze: (n: number) => void;
}) {
  const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
  const stats = topicStats(answers.map((a) => ({ topic: a.hand.topic, correct: a.chosen === a.hand.correct })));
  const weak = weakTopics(stats);
  const wrong = answers.filter((a) => a.chosen !== a.hand.correct).slice(-8).reverse();

  return (
    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Çözülen", String(answers.length)],
            ["Doğru", String(ok)],
            ["Doğruluk", answers.length ? `%${Math.round((ok / answers.length) * 100)}` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-t-panel px-3 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">{v}</p>
              <p className="text-xs font-semibold text-t-muted">{k}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl bg-t-panel p-4">
          <h2 className="font-bold">Spot bazında</h2>
          <ul className="mt-3 space-y-3">
            {stats.map((s) => (
              <li key={s.topic}>
                <div className="flex justify-between text-sm">
                  <span>{TOPICS[s.topic]}</span>
                  <span className="font-bold tabular-nums">
                    {s.ok}/{s.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-t-panel-2" aria-hidden="true">
                  <div className={`h-full rounded-full ${s.rate >= 0.6 ? "bg-t-accent" : "bg-t-raise"}`} style={{ width: `${s.rate * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-t-panel p-4">
          <h2 className="font-bold">Sıradaki adım</h2>
          {weak.length ? (
            <>
              <p className="mt-1 text-sm text-t-ink/90">
                En çok zorlandığın spot: <strong>{weak.slice(0, 2).map((w) => TOPICS[w.topic]).join(", ")}</strong>. Bir süre yalnızca bu
                spotu çöz; hatalar tekrar karşına çıkacak.
              </p>
              <button type="button" onClick={() => onTopic(weak[0].topic)} className="mt-3 min-h-11 rounded-xl bg-t-accent px-4 text-sm font-extrabold text-[#03130b]">
                {TOPICS[weak[0].topic]} çalış
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-t-ink/90">Belirgin bir zayıf spot yok. Daha fazla el çözdükçe tablo netleşir.</p>
          )}
        </section>

        {wrong.length > 0 && (
          <section className="rounded-xl bg-t-panel p-4">
            <h2 className="font-bold">Son yanlışların</h2>
            <ul className="mt-2 divide-y divide-t-line">
              {wrong.map((a, i) => (
                <li key={i} className="py-2 text-sm">
                  <span className="font-semibold">{a.hand.title}</span>
                  <span className="block text-t-muted">
                    Sen: {a.hand.options[a.chosen]} · Doğru: {a.hand.options[a.hand.correct]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onContinue} className="min-h-12 rounded-xl bg-t-accent text-sm font-extrabold text-[#03130b]">
            Devam et
          </button>
          <button type="button" onClick={onReset} className="min-h-12 rounded-xl bg-t-panel-2 text-sm font-bold">
            Yeni oturum
          </button>
        </div>
        <p className="text-center text-sm text-t-muted">
          Tüm geçmişin <Link href="/profil" className="font-bold text-t-accent hover:underline">Profil</Link> sayfasında.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-ink">
        {!STATIC_SITE && analyze === 0 && answers.length > 0 && (
          <button type="button" onClick={() => setAnalyze(Date.now())} className="min-h-12 rounded-xl bg-t-accent text-sm font-extrabold text-[#03130b]">
            Oturumu yapay zekaya analiz ettir
          </button>
        )}
        <AiPanel
          title="Oturum analizi"
          context={{ type: "practice", attempts: answers.slice(-200).map((a) => ({ handId: a.hand.id, chosen: a.chosen })) }}
          autoAsk={analyze ? { id: analyze, question: "Bu oturumdaki sonuçlarımı analiz eder misin?" } : undefined}
          placeholder="Sonuçların hakkında sor…"
        />
      </div>
    </div>
  );
}

export function BreakCard({
  answers,
  minutes,
  longSession,
  every,
  onEvery,
  onContinue,
  onStop,
}: {
  answers: Answer[];
  minutes: number;
  longSession: boolean;
  every: RhythmEvery;
  onEvery: (e: RhythmEvery) => void;
  onContinue: () => void;
  onStop: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [settings, setSettings] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  // Odak başlığa taşınır; kaydırma, kart sabit üst menünün altında kalmayacak biçimde ayrıca yapılır.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    cardRef.current?.scrollIntoView({ block: "nearest" });
  }, []);
  const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
  const weak = weakTopics(topicStats(answers.map((a) => ({ topic: a.hand.topic, correct: a.chosen === a.hand.correct }))));

  return (
    <div className="flex justify-center p-3 sm:p-8">
      <section
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="break-title"
        className="flex w-full max-w-[480px] scroll-mt-28 flex-col gap-4 rounded-2xl border border-t-line bg-t-panel p-5 lg:shadow-[0_20px_60px_rgb(0_0_0/0.45)] motion-safe:animate-[fadein_160ms_ease-out]"
      >
        <h2 id="break-title" ref={headingRef} tabIndex={-1} className="text-xl font-extrabold outline-none">
          Kısa bir durak
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Bu bölümde el", String(answers.length)],
            ["Doğru", String(ok)],
            ["Süre", `${minutes} dk`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-t-panel-2 px-2 py-3 text-center">
              <p className="text-2xl font-extrabold tabular-nums">{v}</p>
              <p className="text-xs font-semibold text-t-muted">{k}</p>
            </div>
          ))}
        </div>
        {weak.length ? (
          <p className="text-[15px] leading-relaxed">
            Bu bölümde en çok zorlandığın konu: <strong>{TOPICS[weak[0].topic]}</strong>. {TOPIC_NOTES[weak[0].topic]}
          </p>
        ) : (
          <p className="text-[15px] leading-relaxed">Bu bölümde belirgin bir zayıf konu yok.</p>
        )}
        {longSession && (
          <p className="rounded-xl border border-t-line px-3 py-2 text-sm text-t-ink/90">
            Bir saattir çalışıyorsun; kısa bir mola, öğrendiklerini pekiştirmeye yardımcı olabilir.{" "}
            <Link href="/sorumlu-oyun" className="text-t-muted underline hover:text-t-ink">
              Sorumlu oyun
            </Link>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onContinue} className="min-h-12 rounded-xl border border-t-line bg-t-panel-2 text-sm font-extrabold text-t-ink transition hover:border-t-accent">
            Devam et
          </button>
          <button type="button" onClick={onStop} className="min-h-12 rounded-xl border border-t-line bg-t-panel-2 text-sm font-extrabold text-t-ink transition hover:border-t-accent">
            Burada bırak
          </button>
        </div>
        <div className="text-center text-sm">
          <button type="button" aria-expanded={settings} onClick={() => setSettings((v) => !v)} className="min-h-11 px-2 text-t-muted underline hover:text-t-ink">
            Sıklığı ayarla ({everyLabel(every)})
          </button>
          {settings && (
            <div role="radiogroup" aria-label="Ara kartı sıklığı" className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-t-panel-2 p-1">
              {RHYTHM_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={every === c}
                  onClick={() => onEvery(c)}
                  className={`min-h-11 rounded-lg text-xs font-bold ${every === c ? "bg-t-bg text-t-ink" : "text-t-muted hover:text-t-ink"}`}
                >
                  {c === 0 ? "Kapalı" : `${c} el`}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-center text-xs text-t-muted">Enter devam eder, Esc oturum özetine geçer.</p>
      </section>
    </div>
  );
}
