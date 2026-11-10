"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionStrip } from "@/components/ActionStrip";
import { AiPanel } from "@/components/AiPanel";
import { CoachChat } from "@/components/CoachChat";
import { KIND_BG, PokerTable, optionKind } from "@/components/PokerTable";
import { HAND_BY_ID, HANDS, TOPICS, type Game, type Hand, type Topic } from "@/data/hands";
import { STATIC_SITE } from "@/lib/client/env";
import { addAttempt, saveHand, topicStats, unsaveHand, useProgress, weakTopics } from "@/lib/client/store";
import { fmt, replay } from "@/lib/poker/replay";

type Answer = { hand: Hand; chosen: number };
type GameFilter = "" | Game;

function inPool(h: Hand, game: GameFilter, topic: string) {
  return (!game || h.game === game) && (!topic || h.topic === topic);
}

export function Trainer() {
  const params = useSearchParams();
  const router = useRouter();
  const progress = useProgress();

  const [game, setGame] = useState<GameFilter>((params.get("oyun") as GameFilter) || "");
  const [topic, setTopic] = useState(params.get("konu") ?? "");
  const [hand, setHand] = useState<Hand | null>(null);
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [summary, setSummary] = useState(false);
  const [why, setWhy] = useState<{ id: number; text: string } | undefined>();
  const [analyze, setAnalyze] = useState(0);
  const recent = useRef<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => HANDS.filter((h) => inPool(h, game, topic)), [game, topic]);
  const topicsForGame = useMemo(() => {
    const set = new Set(HANDS.filter((h) => !game || h.game === game).map((h) => h.topic));
    return (Object.keys(TOPICS) as Topic[]).filter((t) => set.has(t));
  }, [game]);

  const pickNext = useCallback(
    (list: Hand[]): Hand | null => {
      if (!list.length) return null;
      const avoid = new Set(recent.current.slice(-Math.min(40, list.length - 1)));
      // Arada bir, daha önce yanlış yapılan bir eli geri getir
      if (Math.random() < 0.2) {
        const wrong = progress.attempts.filter((a) => !a.correct).map((a) => HAND_BY_ID.get(a.handId));
        const candidates = wrong.filter((h): h is Hand => !!h && inPool(h, game, topic) && !avoid.has(h.id));
        if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
      }
      const fresh = list.filter((h) => !avoid.has(h.id));
      const from = fresh.length ? fresh : list;
      return from[Math.floor(Math.random() * from.length)];
    },
    [progress.attempts, game, topic],
  );

  const show = useCallback((h: Hand | null) => {
    setHand(h);
    setPicked(undefined);
    setWhy(undefined);
    if (h) recent.current = [...recent.current.slice(-60), h.id];
  }, []);

  // İlk el: adresteki ?el= varsa o, yoksa rastgele
  useEffect(() => {
    const start = params.get("el");
    show((start && HAND_BY_ID.get(start)) || pickNext(pool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeFilter(g: GameFilter, t: string) {
    const validTopic = t && HANDS.some((h) => inPool(h, g, t)) ? t : "";
    setGame(g);
    setTopic(validTopic);
    const q = new URLSearchParams();
    if (g) q.set("oyun", g);
    if (validTopic) q.set("konu", validTopic);
    router.replace(`/alistirma${q.size ? `?${q}` : ""}`, { scroll: false });
    show(pickNext(HANDS.filter((h) => inPool(h, g, validTopic))));
    setSummary(false);
  }

  const r = useMemo(() => (hand ? replay(hand) : null), [hand]);
  const answered = picked !== undefined;

  function choose(i: number) {
    if (!hand || answered) return;
    setPicked(i);
    setAnswers((a) => [...a, { hand, chosen: i }]);
    void addAttempt(hand.id, i);
  }

  function next() {
    show(pickNext(pool));
  }

  function askWhy() {
    setWhy({ id: Date.now(), text: "Neden?" });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Klavye: 1-3 seçer, Enter / boşluk sonraki ele geçer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select") || summary || !hand) return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= hand.options.length) choose(n - 1);
      else if (answered && (e.key === "Enter" || e.key === " ")) {
        if (t.closest("button, a")) return;
        e.preventDefault();
        next();
      }
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
  let streak = 0;
  for (let i = answers.length - 1; i >= 0 && answers[i].chosen === answers[i].hand.correct; i--) streak++;
  const saved = !!hand && progress.saved.some((s) => s.handId === hand.id);

  return (
    <div className="trainer overflow-hidden rounded-2xl border border-t-line bg-t-bg text-t-ink shadow-[0_10px_40px_rgb(0_0_0/0.25)]">
      {/* ── Üst çubuk: filtre ve oturum ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-t-line px-2.5 py-2 sm:px-3 sm:py-2.5">
        <div role="radiogroup" aria-label="Oyun tipi" className="flex min-w-0 flex-1 rounded-xl bg-t-panel p-1 sm:flex-none">
          {([["", "Karışık"], ["cash", "Cash"], ["turnuva", "Turnuva"]] as [GameFilter, string][]).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={game === v}
              onClick={() => changeFilter(v, topic)}
              className={`min-h-10 flex-1 rounded-lg px-2 text-[13px] font-bold transition sm:flex-none sm:px-3 sm:text-sm ${
                game === v ? "bg-t-panel-2 text-t-ink shadow" : "text-t-muted hover:text-t-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <label htmlFor="spot" className="sr-only">
          Spot türü
        </label>
        <select
          id="spot"
          value={topic}
          onChange={(e) => changeFilter(game, e.target.value)}
          className="order-last min-h-11 w-full rounded-xl border border-t-line bg-t-panel px-3 text-sm font-semibold text-t-ink sm:order-none sm:w-auto"
        >
          <option value="">Tüm spotlar ({HANDS.filter((h) => !game || h.game === game).length})</option>
          {topicsForGame.map((t) => (
            <option key={t} value={t}>
              {TOPICS[t]} ({HANDS.filter((h) => inPool(h, game, t)).length})
            </option>
          ))}
        </select>

        <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto sm:gap-2">
          <p className="hidden items-center gap-3 rounded-xl bg-t-panel px-3 py-2 text-sm font-semibold tabular-nums md:flex" aria-live="polite">
            <span>
              <span className="text-t-accent">{ok}</span>
              <span className="text-t-muted">/{answers.length}</span>
            </span>
            {answers.length > 0 && <span className="text-t-muted">%{Math.round((ok / answers.length) * 100)}</span>}
            {streak >= 2 && <span className="text-t-act">Seri {streak}</span>}
          </p>
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? "Kayıtlı ellerden çıkar" : "Eli kaydet"}
            title={saved ? "Kayıtlı ellerden çıkar" : "Eli kaydet"}
            disabled={!hand}
            onClick={() => hand && void (saved ? unsaveHand(hand.id) : saveHand(hand.id, ""))}
            className={`grid size-11 place-items-center rounded-xl bg-t-panel transition hover:bg-t-panel-2 ${saved ? "text-t-act" : "text-t-muted"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12v18l-6-4.5L6 21z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSummary((s) => !s)}
            disabled={!answers.length && !summary}
            aria-label={summary ? "Masaya dön" : "Oturum özeti"}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-t-panel px-2.5 text-sm font-bold text-t-ink transition hover:bg-t-panel-2 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {summary ? <path d="M15 6l-6 6 6 6" /> : <path d="M5 20V10M12 20V4M19 20v-7" />}
            </svg>
            <span className="tabular-nums md:hidden">
              {ok}/{answers.length}
            </span>
            <span className="hidden md:inline">{summary ? "Masaya dön" : "Oturum özeti"}</span>
          </button>
        </div>
      </div>

      {summary ? (
        <Summary
          answers={answers}
          onContinue={() => setSummary(false)}
          onReset={() => {
            setAnswers([]);
            setSummary(false);
            next();
          }}
          onTopic={(t) => changeFilter("", t)}
          analyze={analyze}
          setAnalyze={setAnalyze}
        />
      ) : !hand || !r ? (
        <p className="p-10 text-center text-t-muted">{pool.length ? "Yükleniyor…" : "Bu seçimde el yok."}</p>
      ) : (
        <>
          <div className="border-b border-t-line">
            <ActionStrip r={r} heroPos={hand.heroPos} />
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* ── Masa ve kararlar ── */}
            <section aria-label="Masa" className="flex min-w-0 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-5">
              <div className="flex items-center gap-x-3 text-[13px] text-t-muted">
                <span className="truncate font-bold text-t-ink">{hand.title}</span>
                <span className="shrink-0">
                  {hand.game === "cash" ? "Cash" : "Turnuva"} · {hand.stackBB} BB{hand.ante ? ` · Ante ${fmt(hand.ante)}` : ""}
                </span>
                <span className="ml-auto hidden shrink-0 rounded-full bg-t-panel-2 px-2 py-0.5 text-xs font-semibold sm:inline">{TOPICS[hand.topic]}</span>
              </div>
              {hand.note && (
                <p className="flex gap-2 rounded-xl border border-t-line bg-t-panel px-3 py-1.5 text-[13px] leading-snug text-t-ink/90">
                  <span aria-hidden="true" className="text-t-act">
                    ●
                  </span>
                  {hand.note}
                </p>
              )}

              <PokerTable hand={hand} r={r} />

              <div
                role="group"
                aria-label="Hamleni seç"
                className={`grid gap-2 ${hand.options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {hand.options.map((o, i) => {
                  const isCorrect = answered && i === hand.correct;
                  const isWrong = answered && i === picked && i !== hand.correct;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => choose(i)}
                      aria-disabled={answered}
                      className={`relative flex min-h-16 flex-col items-center justify-center rounded-xl px-2 py-2 text-center text-[15px] leading-tight font-extrabold text-white uppercase transition sm:min-h-[68px] sm:text-base ${KIND_BG[optionKind(o)]} ${
                        answered
                          ? isCorrect
                            ? "ring-4 ring-t-accent"
                            : isWrong
                              ? "ring-4 ring-[#ff6b6b]"
                              : "opacity-30"
                          : "hover:brightness-110 active:scale-[0.98]"
                      }`}
                    >
                      <span className="normal-case">{o}</span>
                      {isCorrect && <span className="mt-1 text-[11px] font-bold normal-case">✓ Doğru hamle</span>}
                      {isWrong && <span className="mt-1 text-[11px] font-bold normal-case">✕ Senin seçimin</span>}
                      {!answered && (
                        <span aria-hidden="true" className="absolute top-1.5 right-2 hidden text-[10px] font-bold opacity-60 sm:block">
                          {i + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center ${
                    picked === hand.correct ? "border-t-accent/40 bg-t-accent/10" : "border-[#ff6b6b]/40 bg-[#ff6b6b]/10"
                  }`}
                  aria-live="polite"
                >
                  <p className="flex-1 text-[15px] font-bold">
                    {picked === hand.correct ? (
                      <span className="text-t-accent">✓ Doğru!</span>
                    ) : (
                      <>
                        <span className="text-[#ff8a8a]">✕ Yanlış.</span> Doğru hamle:{" "}
                        <span className="text-t-ink">{hand.options[hand.correct]}</span>
                      </>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={askWhy}
                      className="min-h-11 rounded-xl border border-t-line bg-t-panel-2 px-4 text-sm font-bold text-t-ink transition hover:border-t-accent"
                    >
                      Neden?
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      autoFocus
                      className="min-h-11 rounded-xl bg-t-accent px-5 text-sm font-extrabold text-[#03130b] transition hover:brightness-110"
                    >
                      Sonraki el →
                    </button>
                  </div>
                </div>
              )}
              <p className="hidden text-center text-xs text-t-muted lg:block">
                Kısayollar: 1–{hand.options.length} hamle seçer, Enter sonraki ele geçer.
              </p>
            </section>

            {/* ── Koç sohbeti ── */}
            <aside
              ref={chatRef}
              className="h-[440px] scroll-mt-20 border-t border-t-line bg-t-panel/60 lg:h-[calc(100dvh-190px)] lg:max-h-[860px] lg:min-h-[560px] lg:border-t-0 lg:border-l"
            >
              <CoachChat hand={hand} chosen={picked} trigger={why} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Summary({
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
