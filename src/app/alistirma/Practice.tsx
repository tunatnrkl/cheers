"use client";

import Link from "next/link";
import { useState } from "react";
import { AiPanel } from "@/components/AiPanel";
import { HandView } from "@/components/HandView";
import { RichText } from "@/components/RichText";
import { GAMES, HANDS, TOPICS, type Hand, type Topic } from "@/data/hands";
import { addAttempt, topicStats, useProgress, weakTopics } from "@/lib/client/store";

type Answer = { hand: Hand; chosen: number };

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Practice() {
  const progress = useProgress();
  const [game, setGame] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [queue, setQueue] = useState<Hand[] | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [analyze, setAnalyze] = useState(0);

  const pool = HANDS.filter((h) => (!game || h.game === game) && (!topic || h.topic === topic));

  function start(onlyTopics?: Topic[]) {
    const source = onlyTopics ? HANDS.filter((h) => onlyTopics.includes(h.topic)) : pool;
    // Daha önce yanlış yapılan ve hiç çözülmemiş eller öne alınır
    const seen = new Map<string, boolean>();
    for (const a of progress.attempts) if (!seen.has(a.handId)) seen.set(a.handId, a.correct);
    const rank = (h: Hand) => (seen.get(h.id) === false ? 0 : seen.has(h.id) ? 2 : 1);
    const ordered = shuffle(source).sort((a, b) => rank(a) - rank(b));
    setQueue(shuffle(ordered.slice(0, count)));
    setAnswers([]);
    setPicked(null);
    setAnalyze(0);
    window.scrollTo({ top: 0 });
  }

  // ───────────── 1. Ayar ekranı ─────────────
  if (!queue) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <header>
          <h1 className="h1">Alıştırma</h1>
          <p className="lead mt-1">Senaryoyu oku, hamleni seç. Her sorudan sonra doğru cevabı ve nedenini görürsün.</p>
        </header>

        <fieldset>
          <legend className="label">Oyun tipi</legend>
          <div className="flex flex-wrap gap-2">
            {[["", "Karışık"], ...Object.entries(GAMES)].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={game === v} className={`chip ${game === v ? "chip-on" : ""}`} onClick={() => setGame(v)}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="konu" className="label">
            Konu
          </label>
          <select id="konu" className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Tüm konular</option>
            {Object.entries(TOPICS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="label">Soru sayısı</legend>
          <div className="flex gap-2">
            {[5, 10, 20].map((n) => (
              <button key={n} type="button" aria-pressed={count === n} className={`chip ${count === n ? "chip-on" : ""}`} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="button" className="btn btn-primary btn-lg" disabled={pool.length === 0} onClick={() => start()}>
          Başla ({Math.min(count, pool.length)} soru)
        </button>
        {pool.length === 0 && <p className="text-sm text-muted">Bu seçimle eşleşen soru yok.</p>}

        {progress.ready && progress.attempts.length > 0 && (
          <p className="text-sm text-muted">
            Şimdiye kadar {progress.attempts.length} soru çözdün.{" "}
            <Link href="/profil" className="link">
              İlerlemeni gör
            </Link>
          </p>
        )}
      </div>
    );
  }

  // ───────────── 3. Sonuç ekranı ─────────────
  if (answers.length === queue.length) {
    const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
    const stats = topicStats(answers.map((a) => ({ topic: a.hand.topic, correct: a.chosen === a.hand.correct })));
    const weak = stats.filter((s) => s.rate < 0.6).slice(0, 2);
    const wrong = answers.filter((a) => a.chosen !== a.hand.correct);

    return (
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <section className="card text-center">
            <h1 className="h1">Sonuç</h1>
            <p className="mt-2 text-4xl font-bold text-accent">
              {ok} / {answers.length}
            </p>
            <p className="text-muted">
              {ok} doğru, {answers.length - ok} yanlış · %{Math.round((ok / answers.length) * 100)} doğruluk
            </p>
            <p className="mt-2 text-sm text-muted">Sonuçların kaydedildi.</p>
          </section>

          <section className="card">
            <h2 className="h2">Konu bazında</h2>
            <ul className="mt-3 space-y-3">
              {stats.map((s) => (
                <li key={s.topic}>
                  <div className="flex justify-between text-sm">
                    <span>{TOPICS[s.topic]}</span>
                    <span className="font-semibold">
                      {s.ok}/{s.total}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft" aria-hidden="true">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${s.rate * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="h2">Çalışma önerisi</h2>
            {weak.length ? (
              <>
                <p className="mt-1">
                  En çok zorlandığın konu: <strong>{weak.map((w) => TOPICS[w.topic]).join(", ")}</strong>. Önce
                  kütüphanede bu konudaki elleri oku, sonra yalnızca bu konudan yeni bir tur çöz.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/kutuphane?konu=${weak[0].topic}`} className="btn">
                    Bu konudaki elleri incele
                  </Link>
                  <button type="button" className="btn" onClick={() => start(weak.map((w) => w.topic))}>
                    Zayıf konulardan tekrar çöz
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-1">Belirgin bir zayıf konu görünmüyor. Farklı bir oyun tipi ya da daha fazla soruyla devam edebilirsin.</p>
            )}
          </section>

          {wrong.length > 0 && (
            <section className="card">
              <h2 className="h2">Yanlışların</h2>
              <ul className="mt-2 divide-y divide-line">
                {wrong.map((a) => (
                  <li key={a.hand.id} className="py-2">
                    <Link href={`/kutuphane/${a.hand.id}`} className="link">
                      {a.hand.title}
                    </Link>
                    <p className="text-sm text-muted">
                      Sen: {a.hand.options[a.chosen]} · Önerilen: {a.hand.options[a.hand.correct]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-primary" onClick={() => start()}>
              Yeni tur
            </button>
            <button type="button" className="btn" onClick={() => setQueue(null)}>
              Ayarları değiştir
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:sticky md:top-20">
          {analyze === 0 && (
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setAnalyze(Date.now())}>
              Sonuçlarımı yapay zekaya analiz ettir
            </button>
          )}
          <AiPanel
            title="Sonuç analizi"
            context={{ type: "practice", attempts: answers.map((a) => ({ handId: a.hand.id, chosen: a.chosen })) }}
            autoAsk={analyze ? { id: analyze, question: "Bu alıştırma sonuçlarımı analiz eder misin?" } : undefined}
            placeholder="Sonuçların hakkında sor…"
          />
        </div>
      </div>
    );
  }

  // ───────────── 2. Soru ekranı ─────────────
  const hand = queue[answers.length];
  const answered = picked !== null;

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    void addAttempt(hand.id, i);
  }

  function next() {
    setAnswers((a) => [...a, { hand, chosen: picked! }]);
    setPicked(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Soru {answers.length + 1} / {queue.length}
          </span>
          <button type="button" className="link min-h-11" onClick={() => setQueue(null)}>
            Bırak
          </button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={answers.length}>
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(answers.length / queue.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="h2">{hand.title}</h1>
      <section className="card">
        <HandView hand={hand} />
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="label">Hamlen ne olurdu?</legend>
        {hand.options.map((o, i) => {
          const isCorrect = answered && i === hand.correct;
          const isWrong = answered && i === picked && i !== hand.correct;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(i)}
              aria-disabled={answered}
              className={`btn btn-lg justify-between text-left ${
                isCorrect ? "border-accent bg-soft" : isWrong ? "border-danger bg-danger-soft" : ""
              } ${answered && !isCorrect && !isWrong ? "opacity-60" : ""}`}
            >
              <span>{o}</span>
              {isCorrect && <span className="text-sm font-semibold text-accent">✓ Önerilen</span>}
              {isWrong && <span className="text-sm font-semibold text-danger">✕ Senin seçimin</span>}
            </button>
          );
        })}
      </fieldset>

      {answered && (
        <section className="card" aria-live="polite">
          <p className="font-semibold">
            {picked === hand.correct ? "Doğru." : `Bu spotta önerilen: ${hand.options[hand.correct]}.`}
          </p>
          <RichText text={hand.reasoning} className="mt-1" />
          <button type="button" className="btn btn-primary btn-lg mt-4 w-full" onClick={next}>
            {answers.length + 1 === queue.length ? "Sonuçları gör" : "Sonraki soru"}
          </button>
        </section>
      )}
    </div>
  );
}
