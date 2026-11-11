"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TOPICS, type Hand, type Topic } from "@/data/hands";
import { topicStats, weakTopics } from "@/lib/client/store";
import { RHYTHM_OPTIONS, isLongSession, type RhythmEvery } from "@/lib/client/rhythm";

// Ara kartında zayıf konunun altına yazılan tek cümlelik not
const TOPIC_TIPS: Record<Topic, string> = {
  acilis: "Açılış aralığı pozisyona göre genişler: butondan açtığın bir eli UTG'den çoğu zaman bırakırsın.",
  "3bet": "3-bet için eli, açanın pozisyonuna ve aralığının genişliğine göre seç; güçlü görünen her el 3-bet istemez.",
  savunma: "Blind savunmasında fiyat kadar açanın pozisyonu da önemlidir: geç pozisyon açılışlarına karşı daha geniş savunursun.",
  cbet: "C-bet kararı, board'un kimin aralığına daha çok yaradığına bağlıdır; her flop'ta otomatik bahis yapılmaz.",
  odds: "Gereken equity, ödeyeceğin miktarın call sonrası toplam pota oranıdır.",
  value: "Value bet'te sorulacak soru: daha zayıf hangi eller bu bahsi görür?",
  blof: "Blöf, rakibin fold edebileceği daha iyi eller olduğunda anlamlıdır.",
  spr: "SPR düşükken top pair stack'i rahatça koyabilir; SPR yüksekken pot kontrolü öne çıkar.",
  pushfold: "Kısa stack'te pozisyon geçe kaldıkça push aralığı genişler.",
  callshove: "All-in'e karşı elinin rakibin push aralığına karşı equity'sini, gereken equity ile karşılaştır.",
  icm: "ICM baskısında chip kaybetmenin maliyeti kazanmanın değerinden yüksektir; call aralıkları daralır.",
};

type Answer = { hand: Hand; chosen: number };

export function BreakCard({
  answers,
  blockStart,
  sessionStart,
  openedAt,
  every,
  onEvery,
  onContinue,
  onStop,
}: {
  /** Yalnızca bu bölümdeki cevaplar */
  answers: Answer[];
  blockStart: number;
  sessionStart: number;
  openedAt: number;
  every: RhythmEvery;
  onEvery: (e: RhythmEvery) => void;
  onContinue: () => void;
  onStop: () => void;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
  const minutes = Math.max(1, Math.round((openedAt - blockStart) / 60_000));
  const weak = weakTopics(topicStats(answers.map((a) => ({ topic: a.hand.topic, correct: a.chosen === a.hand.correct }))));
  const long = isLongSession(sessionStart, openedAt);

  const button =
    "min-h-12 rounded-xl border border-t-line bg-t-panel-2 px-4 text-[15px] font-extrabold text-t-ink transition hover:border-t-accent focus-visible:border-t-accent";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      className="flex min-h-[60dvh] w-full flex-col gap-4 rounded-2xl border border-t-line bg-t-panel p-4 shadow-[0_10px_40px_rgb(0_0_0/0.35)] motion-safe:animate-[break-in_180ms_ease-out] sm:p-5 lg:absolute lg:inset-x-0 lg:top-16 lg:z-10 lg:mx-auto lg:min-h-0 lg:max-w-[480px]"
    >
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="text-xl font-extrabold outline-none focus-visible:underline">
        Kısa bir durak
      </h2>

      <dl className="grid grid-cols-3 gap-2">
        {[
          ["El", String(answers.length)],
          ["Doğru", String(ok)],
          ["Süre", `${minutes} dk`],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse rounded-xl bg-t-panel-2 px-2 py-3 text-center">
            <dt className="text-xs font-semibold text-t-muted">{k}</dt>
            <dd className="text-xl font-extrabold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="text-[15px] leading-snug">
        {weak.length ? (
          <>
            <p>
              Bu bölümde en çok zorlandığın konu: <strong>{TOPICS[weak[0].topic]}</strong>
            </p>
            <p className="mt-1 text-t-ink/85">{TOPIC_TIPS[weak[0].topic]}</p>
          </>
        ) : (
          <p>Bu bölümde belirgin bir zayıf konu yok.</p>
        )}
        {long && (
          <p className="mt-3 text-sm text-t-muted">
            Bir saattir çalışıyorsun; kısa bir mola, öğrendiklerini pekiştirmeye yardımcı olabilir.{" "}
            <Link href="/sorumlu-oyun" className="underline underline-offset-4 hover:text-t-ink">
              Sorumlu oyun
            </Link>
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onContinue} className={button}>
            Devam et
          </button>
          <button type="button" onClick={onStop} className={button}>
            Burada bırak
          </button>
        </div>

        <button
          type="button"
          aria-expanded={settings}
          onClick={() => setSettings((s) => !s)}
          className="mx-auto min-h-11 px-2 text-sm font-semibold text-t-muted underline underline-offset-4 hover:text-t-ink"
        >
          Sıklığı ayarla
        </button>
        {settings && (
          <div role="radiogroup" aria-label="Ara kartı sıklığı" className="grid grid-cols-4 gap-1 rounded-xl bg-t-panel-2 p-1">
            {RHYTHM_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={every === v}
                onClick={() => onEvery(v)}
                className={`min-h-11 rounded-lg text-sm font-bold transition ${
                  every === v ? "bg-t-panel text-t-ink shadow" : "text-t-muted hover:text-t-ink"
                }`}
              >
                {v ? `${v} el` : "Kapalı"}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="sr-only">Enter devam eder, Esc burada bırakır.</p>
    </div>
  );
}
