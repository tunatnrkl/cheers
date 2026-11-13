"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Hap, Ilerleme, Kart } from "@/components/ui";
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
      <Ilerleme oran={r.rate ?? 0} className="mt-1" />
    </li>
  );
}

export function Growth({ attempts, total }: { attempts: StatAttempt[]; total?: number }) {
  const truncated = total !== undefined && total > attempts.length;
  const [game, setGame] = useState<Game | "all">("all");
  // "Şimdi" panel açıldığında bir kez alınır; yeniden çizimde pencereler kaymaz.
  const [now] = useState(() => new Date());
  const weeks = useMemo(() => weeklyTrend(attempts, now).filter((w) => w.total > 0).reverse(), [attempts, now]);
  const fr = useMemo(() => firstVsRepeat(attempts), [attempts]);
  const pos = useMemo(() => positionStats(attempts, game === "all" ? undefined : game), [attempts, game]);

  return (
    <Kart baslik="Gelişim" baslikId="gelisim-baslik">
      <p className="mt-1 text-sm text-muted">
        {MIN_SAMPLE} cevaptan azında oran gösterilmez. {MIN_SAMPLE} cevapta bile oran kabaca ±25 puan oynayabilir; tek haftaya değil genel eğilime bak.
      </p>
      {truncated && (
        <p className="mt-2 text-sm text-muted">
          Bu bölüm son {attempts.length.toLocaleString("tr-TR")} cevabına göre hesaplanır (toplam {total!.toLocaleString("tr-TR")}). Daha
          eski cevaplar dahil olmadığından, önceden gördüğün bazı spotlar &quot;ilk görüş&quot; sayılabilir.
        </p>
      )}

      <h3 className="mt-5 text-lg font-semibold">İlk görüşte ve tekrarda</h3>
      <p className="mt-1 text-xs text-muted">Yanlışlar masada geri döner. İlk görüş oranı, yeni bir spotu ne kadar okuduğunu gösterir.</p>
      <dl className="mt-2 grid grid-cols-2 gap-2">
        {(
          [
            ["İlk görüşte", fr.first],
            ["Tekrarda", fr.repeat],
          ] as const
        ).map(([k, r]) => (
          <div key={k} className="olcu">
            <dt>
              {k} · {r.total} cevap
            </dt>
            <dd>{r.rate === null ? "—" : pct(r.rate)}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 text-lg font-semibold">Haftalara göre doğruluk</h3>
      {weeks.length < 2 ? (
        <p className="mt-1 text-sm text-muted">Eğilim için en az iki farklı haftada cevap gerekiyor. Şimdilik yalnızca son haftanın verisi var.</p>
      ) : (
        <ul className="mt-2 space-y-3" aria-label="Son 8 hafta, en yeni üstte">
          {weeks.map((w) => (
            <Row key={w.weeksAgo} label={weekLabel(w.weeksAgo)} r={w} />
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-lg font-semibold">Pozisyona göre doğruluk</h3>
      <div role="radiogroup" aria-label="Oyun tipi" className="mt-2 flex flex-wrap gap-2">
        {(["all", "cash", "turnuva"] as const).map((g) => (
          <Hap key={g} rol="radio" secili={game === g} onClick={() => setGame(g)}>
            {g === "all" ? "Tümü" : GAMES[g]}
          </Hap>
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
    </Kart>
  );
}
