"use client";

import { RHYTHM_CHOICES, type RhythmEvery } from "@/lib/client/rhythm";
import { HIZ_ETIKET, type Hiz } from "./lib/elAkisi";

export const AYAR_SAYISI = 2;

/** Hap biçimli tek seçim grubu. */
export function Haplar<T extends string | number>({
  etiket,
  secenekler,
  deger,
  onSec,
  sayi,
  kucuk,
}: {
  etiket: string;
  secenekler: { v: T; l: string; ipucu?: string }[];
  deger: T;
  onSec: (v: T) => void;
  /** Seçenek başına kalan spot sayısı; 0 ise seçenek devre dışı */
  sayi?: (v: T) => number | undefined;
  kucuk?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={etiket} className="flex flex-wrap gap-1.5">
      {secenekler.map((s) => {
        const n = sayi?.(s.v);
        const bos = n === 0 && deger !== s.v;
        const on = deger === s.v;
        return (
          <button
            key={String(s.v)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={bos || undefined}
            disabled={bos}
            title={s.ipucu}
            onClick={() => onSec(s.v)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 font-bold transition ${kucuk ? "text-[13px]" : "text-sm"} ${
              on
                ? "border-t-accent bg-t-accent text-[#1c1404]"
                : bos
                  ? "cursor-not-allowed border-t-line bg-transparent text-t-muted/70 line-through decoration-1"
                  : "border-t-line bg-t-panel-2 text-t-ink hover:border-t-accent/60"
            }`}
          >
            {s.l}
            {n !== undefined && (
              <span className={`text-xs font-semibold tabular-nums ${on ? "text-[#1c1404]/75" : "text-t-muted"}`} aria-label={`${n} spot`}>
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Ayarlar({
  every,
  onEvery,
  hiz,
  onHiz,
}: {
  every: RhythmEvery;
  onEvery: (e: RhythmEvery) => void;
  hiz: Hiz;
  onHiz: (h: Hiz) => void;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-t-muted">Oturum ritmi: ara kartı sıklığı</p>
        <Haplar
          kucuk
          etiket="Ara kartı sıklığı"
          secenekler={RHYTHM_CHOICES.map((c) => ({ v: c, l: c === 0 ? "Kapalı" : `${c} elde bir` }))}
          deger={every}
          onSec={onEvery}
        />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-t-muted">Animasyon hızı</p>
        <Haplar
          kucuk
          etiket="Animasyon hızı"
          secenekler={(Object.keys(HIZ_ETIKET) as Hiz[]).map((h) => ({ v: h, l: HIZ_ETIKET[h] }))}
          deger={hiz}
          onSec={onHiz}
        />
      </div>
    </div>
  );
}
