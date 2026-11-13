"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HANDS, TOPICS, type Topic } from "@/data/hands";
import type { RhythmEvery } from "@/lib/client/rhythm";
import { AYAR_SAYISI, Ayarlar, Haplar } from "./Ayarlar";
import type { Hiz } from "./lib/elAkisi";
import {
  BOS_FILTRE,
  KONULAR,
  PF_ACIKLAMA,
  PF_ETIKET,
  SOKAKLAR,
  etkinFiltre,
  havuz,
  pfSecenekleri,
  type Filtre,
  type OyunFiltresi,
  type PfFiltresi,
  type SokakFiltresi,
} from "./lib/filtreler";

type Props = {
  filtre: Filtre;
  onFiltre: (f: Filtre) => void;
  onBasla: () => void;
  every: RhythmEvery;
  onEvery: (e: RhythmEvery) => void;
  hiz: Hiz;
  onHiz: (h: Hiz) => void;
  cozulen: number;
};

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="font-sans text-[13px] font-bold tracking-wide text-t-muted uppercase">{baslik}</h3>
      {children}
    </section>
  );
}

export function Kurulum({ filtre, onFiltre, onBasla, every, onEvery, hiz, onHiz, cozulen }: Props) {
  const [ayarlar, setAyarlar] = useState(false);
  const n = useMemo(() => havuz(filtre).length, [filtre]);
  const say = <K extends keyof Filtre>(alan: K) => (v: Filtre[K]) => havuz({ ...filtre, [alan]: v }).length;
  const karisik = etkinFiltre(filtre) === 0;
  const set = (p: Partial<Filtre>) => onFiltre({ ...filtre, ...p });

  return (
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-4 sm:gap-5 sm:py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-t-ink sm:text-[28px]">Antrenmanı kur</h2>
              <p className="text-sm text-t-muted">Spotu seç, eli masada sonuna kadar oyna. {HANDS.length} spot hazır.</p>
            </div>
            <button
              type="button"
              aria-pressed={karisik}
              onClick={() => onFiltre(BOS_FILTRE)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                karisik ? "border-t-accent bg-t-accent/15 text-t-ink" : "border-t-line bg-t-panel-2 text-t-ink hover:border-t-accent/60"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Karışık çalış
            </button>
          </div>

          <Bolum baslik="Oyun türü">
            <Haplar<OyunFiltresi>
              etiket="Oyun türü"
              secenekler={[
                { v: "", l: "Hepsi" },
                { v: "cash", l: "Cash" },
                { v: "turnuva", l: "Turnuva" },
              ]}
              deger={filtre.oyun}
              sayi={say("oyun")}
              onSec={(v) => set({ oyun: v, pf: filtre.pf && !pfSecenekleri(v).includes(filtre.pf) ? "" : filtre.pf })}
            />
          </Bolum>

          <Bolum baslik="Başlangıç noktası">
            <Haplar<SokakFiltresi> etiket="Başlangıç noktası" secenekler={SOKAKLAR} deger={filtre.sokak} sayi={say("sokak")} onSec={(v) => set({ sokak: v })} />
          </Bolum>

          <Bolum baslik="Preflop aksiyonu">
            <Haplar<PfFiltresi>
              etiket="Preflop aksiyonu"
              secenekler={[{ v: "" as PfFiltresi, l: "Hepsi" }, ...pfSecenekleri(filtre.oyun).map((p) => ({ v: p as PfFiltresi, l: PF_ETIKET[p], ipucu: PF_ACIKLAMA[p] }))]}
              deger={filtre.pf}
              sayi={say("pf")}
              onSec={(v) => set({ pf: v })}
            />
          </Bolum>

          <Bolum baslik="Konu">
            <Haplar<"" | Topic>
              kucuk
              etiket="Konu"
              secenekler={[{ v: "" as "" | Topic, l: "Hepsi" }, ...KONULAR.map((t) => ({ v: t as "" | Topic, l: TOPICS[t] }))]}
              deger={filtre.konu}
              sayi={say("konu")}
              onSec={(v) => set({ konu: v })}
            />
          </Bolum>

          <section className="rounded-2xl border border-t-line bg-t-panel">
            <button
              type="button"
              aria-expanded={ayarlar}
              aria-controls="tum-ayarlar"
              onClick={() => setAyarlar((v) => !v)}
              className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-extrabold tracking-wider text-t-ink"
            >
              TÜM AYARLAR
              <span className="grid size-6 place-items-center rounded-full bg-t-panel-2 text-xs text-t-muted" aria-label={`${AYAR_SAYISI} ayar`}>
                {AYAR_SAYISI}
              </span>
              <svg className={`ml-auto transition ${ayarlar ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {ayarlar && (
              <div id="tum-ayarlar" className="border-t border-t-line px-4 py-3">
                <Ayarlar every={every} onEvery={onEvery} hiz={hiz} onHiz={onHiz} />
              </div>
            )}
          </section>

          <p className="text-xs text-t-muted">
            <strong className="text-t-ink">18+</strong> · Strateji çalışma aracı; gerçek parayla oyun yok.{" "}
            <Link href="/sorumlu-oyun" className="underline hover:text-t-ink">
              Sorumlu oyun
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-t-line bg-t-panel px-4 py-2.5">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-t-muted" aria-live="polite">
            <strong className="text-lg text-t-ink tabular-nums">{n}</strong> spot{cozulen > 0 ? ` · bu oturumda ${cozulen} el` : ""}
          </p>
          <button
            type="button"
            disabled={n === 0}
            onClick={onBasla}
            className="min-h-12 rounded-xl bg-t-accent px-6 text-[15px] font-extrabold tracking-wide text-[#1c1404] shadow-[inset_0_1px_0_rgb(255_240_200/0.55),inset_0_-2px_0_rgb(120_70_0/0.35)] transition hover:brightness-110 disabled:opacity-40 sm:px-8"
          >
            ANTRENMANA BAŞLA
          </button>
        </div>
      </div>
    </div>
  );
}
