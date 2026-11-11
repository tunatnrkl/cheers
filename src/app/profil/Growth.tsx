"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GAMES, type Game } from "@/data/hands";
import { firstVsRepeat, MIN_SAMPLE, positionStats, weeklyTrend, type Rate, type StatAttempt } from "@/lib/client/stats";

// Gelişim paneli (Aşama 3). Spesifikasyon: docs/ekip/2026-11-11/10-gelisim-istatistikleri-spec.md
// Bilinçli olarak yok: seri, günlük hedef, rozet, sıralama, kırmızı/yeşil "kötüleştin" vurgusu.

const pct = (r: number) => `%${Math.round(r * 100)}`;
const weekLabel = (w: number) => (w === 0 ? "Son 7 gün" : `${w * 7}–${w * 7 + 7} gün önce`);

function Row({ label, r }: { label: string; r: Rate }) {
  return (
    <li>
      <div className="flex justify-between gap-2 text-sm">
        <span>{label}</span>
        {r.rate === null ? (
          <span className="text-muted">az veri <span className="text-xs">({r.total} cevap)</span></span>
        ) : (
          <span className="font-semibold">
            {pct(r.rate)} <span className="font-normal text-muted">({r.ok}/{r.total})</span>
          </span>
        )}
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft" aria-hidden="true">
        {r.rate !== null && <div className="h-full rounded-full bg-accent" style={{ width: `${r.rate * 100}%` }} />}
      </div>
    </li>
  );
}

export function Growth({ attempts }: { attempts: StatAttempt[] }) {
  const [game, setGame] = useState<Game | "all">("all");
  // "Şimdi" panel açıldığında bir kez alınır; yeniden çizimde pencereler kaymaz.
  const [now] = useState(() => new Date());
  const weeks = useMemo(() => weeklyTrend(attempts, now).filter((w) => w.total > 0).reverse(), [attempts, now]);
  const fr = useMemo(() => firstVsRepeat(attempts), [attempts]);
  const pos = useMemo(() => positionStats(attempts, game === "all" ? undefined : game), [attempts, game]);

  return (
    <section className="card" aria-labelledby="gelisim-baslik">
      <h2 id="gelisim-baslik" className="h2">Gelişim</h2>
      <p className="mt-1 text-sm text-muted">
        {MIN_SAMPLE} cevaptan azında oran gösterilmez. {MIN_SAMPLE} cevapta bile oran kabaca ±25 puan oynayabilir; tek haftaya değil genel eğilime bak.
      </p>

      <h3 className="mt-4 font-semibold">İlk görüşte ve tekrarda</h3>
      <p className="mt-1 text-xs text-muted">Yanlışlar masada geri döner. İlk görüş oranı, yeni bir spotu ne kadar okuduğunu gösterir.</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-center">
        {(
          [
            ["İlk görüşte", fr.first],
            ["Tekrarda", fr.repeat],
          ] as const
        ).map(([k, r]) => (
          <div key={k} className="rounded-xl bg-soft px-2 py-3">
            <dd className="text-2xl font-bold">{r.rate === null ? "—" : pct(r.rate)}</dd>
            <dt className="text-xs text-muted">
              {k} · {r.total} cevap
            </dt>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 font-semibold">Haftalara göre doğruluk</h3>
      {weeks.length < 2 ? (
        <p className="mt-1 text-sm text-muted">Eğilim için en az iki farklı haftada cevap gerekiyor. Şimdilik yalnızca son haftanın verisi var.</p>
      ) : (
        <ul className="mt-2 space-y-3" aria-label="Son 8 hafta, en yeni üstte">
          {weeks.map((w) => (
            <Row key={w.weeksAgo} label={weekLabel(w.weeksAgo)} r={w} />
          ))}
        </ul>
      )}

      <h3 className="mt-5 font-semibold">Pozisyona göre doğruluk</h3>
      <div role="radiogroup" aria-label="Oyun tipi" className="mt-2 flex flex-wrap gap-2">
        {(["all", "cash", "turnuva"] as const).map((g) => (
          <button key={g} type="button" role="radio" aria-checked={game === g} className={`chip ${game === g ? "chip-on" : ""}`} onClick={() => setGame(g)}>
            {g === "all" ? "Tümü" : GAMES[g]}
          </button>
        ))}
      </div>
      {pos.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Bu oyun tipinde henüz cevap yok.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pos.map((p) => (
            <Row key={p.pos} label={p.pos} r={p} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        Bir pozisyonda oran düşükse <Link href="/range" className="link">range matrisinde</Link> o pozisyonun aralığına bakabilirsin.
      </p>
    </section>
  );
}
