"use client";

import { useMemo, useRef, useState } from "react";
import { AiPanel } from "@/components/AiPanel";
import { Buton, ButonBaglanti, Hap, Kart } from "@/components/ui";
import ranges from "@/data/ranges.json";
import { STATIC_SITE } from "@/lib/client/env";
import { MATRIX_RANKS, matrixLabel, rangePercent } from "@/lib/poker/cards";

const POS = ["UTG", "HJ", "CO", "BTN", "SB"] as const;
const STACKS = ["6", "10", "15"] as const;
type Mode = "cash" | "push";
type View = "ref" | "mine" | "compare";

export function RangeTool() {
  const [mode, setMode] = useState<Mode>("cash");
  const [pos, setPos] = useState<(typeof POS)[number]>("BTN");
  const [stack, setStack] = useState<(typeof STACKS)[number]>("10");
  const [view, setView] = useState<View>("ref");
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [evalId, setEvalId] = useState(0);
  const painting = useRef<boolean | null>(null);

  const ref = useMemo(() => {
    const list: string[] =
      mode === "cash"
        ? (ranges.cash as Record<string, string[]>)[pos]
        : (ranges.push as Record<string, Record<string, string[]>>)[stack][pos];
    return new Set(list);
  }, [mode, pos, stack]);

  const editable = view === "mine";

  function paint(label: string, on: boolean) {
    setMine((prev) => {
      if (prev.has(label) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(label);
      else next.delete(label);
      return next;
    });
  }

  function cellClass(label: string): string {
    const inRef = ref.has(label);
    const inMine = mine.has(label);
    if (view === "ref") return inRef ? "bg-accent text-accent-ink" : "bg-surface text-muted";
    if (view === "mine") return inMine ? "bg-accent text-accent-ink" : "bg-surface text-muted";
    if (inRef && inMine) return "bg-accent text-accent-ink";
    if (inMine) return "bg-danger-soft text-danger ring-2 ring-inset ring-danger"; // sende fazla
    if (inRef) return "bg-soft text-ink ring-2 ring-inset ring-accent"; // sende eksik
    return "bg-surface text-muted";
  }

  const shown = view === "mine" ? mine : ref;
  const extra = [...mine].filter((h) => !ref.has(h)).length;
  const missing = [...ref].filter((h) => !mine.has(h)).length;

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Aralık türü" className="flex gap-2">
          {(
            [
              ["cash", "Cash açılış (100 BB)"],
              ["push", "Turnuva push/fold"],
            ] as [Mode, string][]
          ).map(([v, l]) => (
            <Hap key={v} secili={mode === v} className="flex-1 justify-center text-center" onClick={() => setMode(v)}>
              {l}
            </Hap>
          ))}
        </div>

        <fieldset>
          <legend className="label">Pozisyon</legend>
          <div className="flex flex-wrap gap-2">
            {POS.map((p) => (
              <Hap key={p} secili={pos === p} onClick={() => setPos(p)}>
                {p}
              </Hap>
            ))}
          </div>
        </fieldset>

        {mode === "push" && (
          <fieldset>
            <legend className="label">Stack</legend>
            <div className="flex gap-2">
              {STACKS.map((s) => (
                <Hap key={s} secili={stack === s} onClick={() => setStack(s)}>
                  {s} BB
                </Hap>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="label">Görünüm</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["ref", "Referans"],
                ["mine", "Kendi range'im"],
                ["compare", "Karşılaştır"],
              ] as [View, string][]
            ).map(([v, l]) => (
              <Hap key={v} secili={view === v} onClick={() => setView(v)}>
                {l}
              </Hap>
            ))}
          </div>
        </fieldset>

        <p className="text-sm" aria-live="polite">
          {view === "compare" ? (
            <>
              Senin aralığın <strong>%{rangePercent(mine).toFixed(1)}</strong>, referans <strong>%{rangePercent(ref).toFixed(1)}</strong>. {extra} el fazla, {missing} el eksik.
            </>
          ) : (
            <>
              Seçili: <strong>%{rangePercent(shown).toFixed(1)}</strong> ({shown.size} el tipi)
              {editable && " · Hücrelere dokunarak ya da sürükleyerek işaretle."}
            </>
          )}
        </p>

        {/* 13x13 matris: köşegen çiftler, sağ üst suited, sol alt offsuit */}
        <div
          className="grid select-none gap-px overflow-hidden rounded-xl border border-line bg-line"
          style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))", touchAction: editable ? "none" : "auto" }}
          role="group"
          aria-label={`${pos} aralık matrisi: köşegende çiftler, sağ üstte suited, sol altta offsuit eller`}
          onPointerUp={() => (painting.current = null)}
          onPointerLeave={() => (painting.current = null)}
        >
          {MATRIX_RANKS.map((_, r) =>
            MATRIX_RANKS.map((__, c) => {
              const label = matrixLabel(r, c);
              const selected = (view === "mine" ? mine : ref).has(label);
              return (
                <button
                  key={label}
                  type="button"
                  data-hand={label}
                  aria-pressed={editable ? selected : undefined}
                  aria-label={`${label}${selected ? ", seçili" : ""}`}
                  tabIndex={editable ? 0 : -1}
                  disabled={!editable}
                  className={`aspect-square text-[9px] font-semibold leading-none sm:text-xs ${cellClass(label)} ${editable ? "cursor-pointer" : "cursor-default"}`}
                  onPointerDown={(e) => {
                    if (!editable) return;
                    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                    painting.current = !mine.has(label);
                    paint(label, painting.current);
                  }}
                  onPointerEnter={() => {
                    if (editable && painting.current !== null) paint(label, painting.current);
                  }}
                  onKeyDown={(e) => {
                    if (editable && (e.key === " " || e.key === "Enter")) {
                      e.preventDefault();
                      paint(label, !mine.has(label));
                    }
                  }}
                >
                  {label}
                </button>
              );
            }),
          )}
        </div>

        {view === "compare" && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li className="flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded bg-accent" /> İkisinde de var</li>
            <li className="flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded bg-soft ring-2 ring-inset ring-accent" /> Sende eksik</li>
            <li className="flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded bg-danger-soft ring-2 ring-inset ring-danger" /> Sende fazla</li>
          </ul>
        )}

        {view !== "ref" && (
          <div className="flex flex-wrap gap-2">
            <Buton onClick={() => setMine(new Set(ref))}>Referansı kopyala</Buton>
            <Buton tur="hayalet" onClick={() => setMine(new Set())}>Temizle</Buton>
          </div>
        )}

        <p className="text-xs text-muted">
          {ranges.meta.note} Yöntem: {ranges.meta.method}{" "}
          {mode === "cash"
            ? "Cash aralıkları 6-max, 100 BB, senden önce herkesin fold ettiği durum içindir."
            : "Push aralıkları, senden önce herkesin fold ettiği ve ICM baskısının olmadığı durum içindir; bubble'da daralır."}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:sticky md:top-20">
        <Buton
          tur="birincil"
          boyut="buyuk"
          disabled={mine.size === 0}
          onClick={() => {
            setView("compare");
            setEvalId(Date.now());
          }}
        >
          {STATIC_SITE ? "Range'imi referansla karşılaştır" : "Range'imi yapay zekaya değerlendir"}
        </Buton>
        {mine.size === 0 && (
          <p className="text-sm text-muted">Önce “Kendi range'im” görünümünde ellerini işaretle.</p>
        )}
        {STATIC_SITE ? (
          // Pages sürümünde yapay zeka yok: kapalı bir panel yerine aralığı masada denemeye yönlendir
          <Kart baslik="Aralığı masada dene" baslikId="range-masa" className="flex flex-col gap-2">
            <p className="text-muted">
              {mode === "cash"
                ? "Açılış spotlarında aynı kararı masada, aksiyonu görerek verirsin. Karardan sonra koç gerekçeyi anlatır."
                : "Push/fold spotlarında aynı kararı masada verirsin. Karardan sonra koç gerekçeyi anlatır."}
            </p>
            <ButonBaglanti href={mode === "cash" ? "/alistirma?oyun=cash&konu=acilis" : "/alistirma?oyun=turnuva&konu=pushfold"} className="self-start">
              {mode === "cash" ? "Açılış spotlarını çalış" : "Push/fold spotlarını çalış"}
            </ButonBaglanti>
          </Kart>
        ) : (
        <AiPanel
          title="Range değerlendirmesi"
          context={{ type: "range", mode, position: pos, stackBB: mode === "push" ? stack : undefined, hands: [...mine] }}
          autoAsk={evalId ? { id: evalId, question: `${pos} için işaretlediğim range'i değerlendirir misin?` } : undefined}
          suggestions={[`${pos} pozisyonunda aralık neden bu genişlikte?`, "Suited eller neden offsuit'lerden daha çok açılıyor?"]}
          placeholder="Aralıklar hakkında sor…"
        />
        )}
      </div>
    </div>
  );
}
