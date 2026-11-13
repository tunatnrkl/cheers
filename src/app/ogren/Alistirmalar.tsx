"use client";

import { useId, useMemo, useRef, useState } from "react";
import { PokerTable } from "@/components/PokerTable";
import type { Alistirma } from "@/lib/mufredat/tipler";
import { type Cevap, TUM_ELLER, ciftler, karistir, ogeler, rangeEvreni, sayiCoz, spotEl } from "@/lib/ogren/alistirma";
import type { Sonuc } from "@/lib/ogren/ilerleme";
import { MATRIX_RANKS, matrixLabel } from "@/lib/poker/cards";
import { fmt, replay } from "@/lib/poker/replay";
import { Simge } from "./Simge";

// Her alıştırma tipi için kontrollü giriş bileşeni. `cevap` hazır değilse null'dur.
// `sonuc` doluysa alıştırma cevaplanmıştır: girişler kilitlenir ve doğru/yanlış işaretlenir.

export type GirisProps = {
  a: Alistirma;
  /** Aynı alıştırma ikinci kez sorulduğunda bileşen sıfırlansın diye */
  tohum: string;
  cevap: Cevap | null;
  setCevap: (c: Cevap | null) => void;
  sonuc: Sonuc | null;
  /** Ekran okuyucu için anlık duyuru (sıralama, eşleştirme) */
  duyur: (m: string) => void;
};

/** Soru açılırken verilen başlangıç cevabı: sıralamada karışık başlangıç sırası da geçerli bir cevaptır. */
export function ilkCevap(a: Alistirma, tohum: string): Cevap | null {
  return a.tip === "siralama" ? { tip: "siralama", sira: karistir(ogeler(a).length, tohum) } : null;
}

export function AlistirmaGirisi(p: GirisProps) {
  switch (p.a.tip) {
    case "secmeli":
      return <Secenekler {...p} secenekler={ogeler(p.a)} />;
    case "spot":
      return <Spot {...p} />;
    case "dogruYanlis":
      return <DogruYanlis {...p} />;
    case "sayi":
      return <Sayi {...p} />;
    case "eslestirme":
      return <Eslestirme {...p} />;
    case "siralama":
      return <Siralama {...p} />;
    case "range":
      return <Range {...p} />;
  }
}

function Isaret({ tur }: { tur: "dogru" | "yanlis" | "kabul" }) {
  if (tur === "dogru")
    return (
      <span className="og-isaret og-ok-yazi">
        <Simge ad="tik" boyut={16} className="mr-1 inline align-[-3px]" />
        Doğru cevap
      </span>
    );
  if (tur === "kabul") return <span className="og-isaret text-accent-text">Kabul edilebilir</span>;
  return (
    <span className="og-isaret text-danger">
      <Simge ad="carpi" boyut={16} className="mr-1 inline align-[-3px]" />
      Senin seçimin
    </span>
  );
}

// ───────────── Seçmeli (ve spot seçenekleri) ─────────────
function Secenekler({ a, cevap, setCevap, sonuc, secenekler, etiket }: GirisProps & { secenekler: string[]; etiket?: string }) {
  const ad = useId();
  const secili = cevap?.tip === "secim" ? cevap.sira : null;
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="sr-only">{etiket ?? "Seçenekler"}</legend>
      {secenekler.map((s, i) => {
        const isaret =
          sonuc === null ? undefined : i === a.dogru ? "dogru" : secili !== i ? undefined : (a.kabulEdilebilir ?? []).includes(i) ? "kabul" : "yanlis";
        return (
          <label key={i} className="og-secenek" data-isaret={isaret}>
            <input type="radio" name={ad} checked={secili === i} disabled={sonuc !== null} onChange={() => setCevap({ tip: "secim", sira: i })} />
            <span className="flex-1">{s}</span>
            {isaret && <Isaret tur={isaret} />}
          </label>
        );
      })}
    </fieldset>
  );
}

// ───────────── Doğru / yanlış ─────────────
function DogruYanlis({ a, cevap, setCevap, sonuc }: GirisProps) {
  const ad = useId();
  const secili = cevap?.tip === "dy" ? cevap.deger : null;
  return (
    <fieldset className="grid grid-cols-2 gap-2.5">
      <legend className="sr-only">Bu ifade doğru mu?</legend>
      {[true, false].map((v) => {
        const isaret = sonuc === null ? undefined : v === a.dogru ? "dogru" : secili === v ? "yanlis" : undefined;
        return (
          <label key={String(v)} className="og-secenek flex-col !items-start sm:flex-row sm:!items-center" data-isaret={isaret}>
            <span className="flex items-center gap-3">
              <input type="radio" name={ad} checked={secili === v} disabled={sonuc !== null} onChange={() => setCevap({ tip: "dy", deger: v })} />
              <span>{v ? "Doğru" : "Yanlış"}</span>
            </span>
            {isaret && <Isaret tur={isaret} />}
          </label>
        );
      })}
    </fieldset>
  );
}

// ───────────── Sayı ─────────────
function Sayi({ a, cevap, setCevap, sonuc }: GirisProps) {
  const id = useId();
  const metin = cevap?.tip === "sayi" ? cevap.metin : "";
  const [taslak, setTaslak] = useState(metin);
  const gecersiz = taslak.trim() !== "" && sayiCoz(taslak) === null;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">
        Cevabın{a.birim ? ` (${a.birim})` : ""}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="field max-w-[12rem] text-lg font-bold tabular-nums"
          value={taslak}
          disabled={sonuc !== null}
          aria-invalid={gecersiz || undefined}
          aria-describedby={`${id}-ipucu`}
          onChange={(e) => {
            setTaslak(e.target.value);
            setCevap(sayiCoz(e.target.value) === null ? null : { tip: "sayi", metin: e.target.value });
          }}
        />
        {a.birim && <span className="font-semibold text-muted">{a.birim}</span>}
      </div>
      <p id={`${id}-ipucu`} className={`text-sm ${gecersiz ? "text-danger" : "text-muted"}`}>
        {gecersiz ? "Yalnızca sayı yaz; ondalık için virgül kullanabilirsin (12,5)." : "Ondalık için virgül ya da nokta kullanabilirsin."}
        {a.tolerans ? ` ±${String(a.tolerans).replace(".", ",")} fark kabul edilir.` : ""}
      </p>
    </div>
  );
}

// ───────────── Eşleştirme: terime dokun, sonra tanımına dokun ─────────────
function Eslestirme({ a, tohum, cevap, setCevap, sonuc, duyur }: GirisProps) {
  const p = ciftler(a);
  const sag = useMemo(() => karistir(p.length, `${tohum}/sag`), [p.length, tohum]);
  // eslesme[i]: sol i için seçilen sağ öğenin özgün sırası (yoksa -1)
  const [eslesme, setEslesme] = useState<number[]>(() => (cevap?.tip === "eslestirme" ? cevap.eslesme : p.map(() => -1)));
  const [secili, setSecili] = useState<number | null>(null);
  const kilit = sonuc !== null;

  const guncelle = (yeni: number[]) => {
    setEslesme(yeni);
    setCevap(yeni.every((x) => x >= 0) ? { tip: "eslestirme", eslesme: yeni } : null);
  };
  const solaBagli = (j: number) => eslesme.indexOf(j);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted" id={`${tohum}-yon`}>
        Önce soldan bir terime, sonra ona uyan tanıma dokun. Eşlenen ikili aynı numarayı alır; değiştirmek için terime yeniden dokun.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ul className="flex flex-col gap-2" aria-label="Terimler">
          {p.map(([sol], i) => {
            const j = eslesme[i];
            const isaret = kilit ? (j >= 0 && p[j][1] === p[i][1] ? "dogru" : "yanlis") : undefined;
            return (
              <li key={i}>
                <button
                  type="button"
                  className="og-oge"
                  aria-pressed={secili === i}
                  data-esli={j >= 0 || undefined}
                  data-isaret={isaret}
                  disabled={kilit}
                  aria-describedby={`${tohum}-yon`}
                  aria-label={`Terim ${i + 1}: ${sol}. ${j >= 0 ? `Eşlendi: ${p[j][1]}` : "Eşlenmedi"}${isaret ? (isaret === "dogru" ? ", doğru" : `, yanlış; doğrusu: ${p[i][1]}`) : ""}`}
                  onClick={() => {
                    setSecili(i);
                    duyur(`${sol} seçildi. Şimdi tanımını seç.`);
                  }}
                >
                  <span className="og-no">{i + 1}</span>
                  <span className="flex-1 text-lg">{sol}</span>
                  {isaret === "dogru" && <Simge ad="tik" boyut={18} className="og-ok-yazi" />}
                  {isaret === "yanlis" && <Simge ad="carpi" boyut={18} className="text-danger" />}
                </button>
                {isaret === "yanlis" && <p className="mt-1 pl-2 text-sm">Doğrusu: {p[i][1]}</p>}
              </li>
            );
          })}
        </ul>
        <ul className="flex flex-col gap-2" aria-label="Tanımlar">
          {sag.map((j) => {
            const i = solaBagli(j);
            return (
              <li key={j}>
                <button
                  type="button"
                  className="og-oge font-medium"
                  data-esli={i >= 0 || undefined}
                  disabled={kilit || secili === null}
                  aria-label={`${p[j][1]}${i >= 0 ? `. ${i + 1} numaralı terimle eşli` : ""}`}
                  onClick={() => {
                    if (secili === null) return;
                    const yeni = eslesme.map((x) => (x === j ? -1 : x));
                    yeni[secili] = j;
                    guncelle(yeni);
                    duyur(`${p[secili][0]}, "${p[j][1]}" ile eşlendi.`);
                    // Sıradaki eşlenmemiş terime geç
                    const sonraki = yeni.findIndex((x) => x < 0);
                    setSecili(sonraki >= 0 ? sonraki : null);
                  }}
                >
                  <span className="og-no" aria-hidden="true">
                    {i >= 0 ? i + 1 : "·"}
                  </span>
                  <span className="flex-1">{p[j][1]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ───────────── Sıralama: yukarı / aşağı butonları ─────────────
function Siralama({ a, tohum, cevap, setCevap, sonuc, duyur }: GirisProps) {
  const o = ogeler(a);
  // Başlangıç sırasını üst bileşen verir (ilkCevap); burada yalnızca okunur.
  const sira = cevap?.tip === "siralama" ? cevap.sira : karistir(o.length, tohum);
  const kilit = sonuc !== null;
  const tasi = (k: number, yon: -1 | 1) => {
    const h = k + yon;
    if (h < 0 || h >= sira.length) return;
    const yeni = [...sira];
    [yeni[k], yeni[h]] = [yeni[h], yeni[k]];
    setCevap({ tip: "siralama", sira: yeni });
    duyur(`${o[sira[k]]}, ${h + 1}. sıraya taşındı.`);
    // Odak, taşınan öğenin aynı yöndeki butonunda kalsın
    requestAnimationFrame(() => document.getElementById(`${tohum}-${sira[k]}-${yon < 0 ? "y" : "a"}`)?.focus());
  };
  return (
    <ol className="flex flex-col gap-2" aria-label="Sıralanacak öğeler">
      {sira.map((oi, k) => {
        const isaret = kilit ? (o[oi] === o[k] ? "dogru" : "yanlis") : undefined;
        return (
          <li key={oi} className="og-oge" data-isaret={isaret}>
            <span className="og-no">{k + 1}</span>
            <span className="flex-1">
              {o[oi]}
              {isaret === "yanlis" && <span className="block text-sm font-normal text-muted">Bu sırada olması gereken: {o[k]}</span>}
            </span>
            {isaret === "dogru" && <Simge ad="tik" boyut={18} className="og-ok-yazi" />}
            {!kilit && (
              <span className="flex gap-1">
                <button type="button" id={`${tohum}-${oi}-y`} className="og-ok-btn" disabled={k === 0} aria-label={`${o[oi]}: yukarı taşı`} onClick={() => tasi(k, -1)}>
                  <Simge ad="yukari" boyut={18} />
                </button>
                <button
                  type="button"
                  id={`${tohum}-${oi}-a`}
                  className="og-ok-btn"
                  disabled={k === sira.length - 1}
                  aria-label={`${o[oi]}: aşağı taşı`}
                  onClick={() => tasi(k, 1)}
                >
                  <Simge ad="asagi" boyut={18} />
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ───────────── Range: 13x13 matris (ya da sınırlı el listesi) ─────────────
function Range({ a, cevap, setCevap, sonuc, duyur }: GirisProps) {
  const evren = useMemo(() => rangeEvreni(a), [a]);
  const secili = useMemo(() => new Set(cevap?.tip === "range" ? cevap.eller : []), [cevap]);
  const dogru = useMemo(() => new Set(Array.isArray(a.dogru) ? (a.dogru as string[]) : []), [a.dogru]);
  const kilit = sonuc !== null;
  const [odak, setOdak] = useState(() => TUM_ELLER.find((e) => evren.has(e)) ?? "AA");
  const izgara = useRef<HTMLDivElement>(null);

  const degistir = (el: string) => {
    const yeni = new Set(secili);
    if (yeni.has(el)) yeni.delete(el);
    else yeni.add(el);
    setCevap({ tip: "range", eller: [...yeni] });
    duyur(`${el} ${yeni.has(el) ? "seçildi" : "kaldırıldı"}. ${yeni.size} el seçili.`);
  };
  const isaret = (el: string) => (!kilit ? undefined : dogru.has(el) && secili.has(el) ? "dogru" : dogru.has(el) ? "eksik" : secili.has(el) ? "fazla" : undefined);
  const isaretYazi = { dogru: ", doğru seçim", eksik: ", eksik kaldı", fazla: ", fazladan seçildi" } as const;

  // Sınırlı evren (az sayıda el): büyük dokunma alanlı düğmeler
  if (evren.size <= 24) {
    const liste = TUM_ELLER.filter((e) => evren.has(e));
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Aralığa girenleri seç. Seçili: {secili.size}</p>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Eller">
          {liste.map((el) => {
            const i = isaret(el);
            return (
              <li key={el}>
                <button
                  type="button"
                  className="og-oge justify-center !px-2 text-lg tabular-nums"
                  aria-pressed={secili.has(el)}
                  data-isaret={i === "dogru" ? "dogru" : i === "fazla" ? "yanlis" : undefined}
                  style={i === "eksik" ? { borderStyle: "dashed", borderColor: "var(--accent)" } : undefined}
                  disabled={kilit}
                  aria-label={`${el}${secili.has(el) ? ", seçili" : ""}${i ? isaretYazi[i] : ""}`}
                  onClick={() => degistir(el)}
                >
                  {el}
                </button>
              </li>
            );
          })}
        </ul>
        {kilit && <RangeLejant />}
      </div>
    );
  }

  // Tam matris: ok tuşlarıyla gezilir (tek sekme durağı), boşluk/Enter ile seçilir.
  const git = (el: string, dr: number, dc: number) => {
    const n = TUM_ELLER.indexOf(el); // satır satır: 13 x 13
    const r = Math.floor(n / 13);
    const c = n % 13;
    const nr = Math.min(12, Math.max(0, r + dr));
    const nc = Math.min(12, Math.max(0, c + dc));
    const yeni = matrixLabel(nr, nc);
    setOdak(yeni);
    izgara.current?.querySelector<HTMLButtonElement>(`[data-el="${yeni}"]`)?.focus();
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted" id="matris-yon">
        Hücrelere dokunarak işaretle. Klavyede ok tuşlarıyla gez, boşlukla seç. Köşegen çiftler, sağ üst suited, sol alt offsuit. Seçili: {secili.size} el
      </p>
      <div ref={izgara} className="og-matris" role="grid" aria-label="Range matrisi, 13 satır 13 sütun" aria-describedby="matris-yon">
        {MATRIX_RANKS.map((_, r) => (
          <div key={r} role="row" className="contents">
            {MATRIX_RANKS.map((__, c) => {
              const el = matrixLabel(r, c);
              const ic = evren.has(el);
              const i = isaret(el);
              return (
                <button
                  key={el}
                  type="button"
                  role="gridcell"
                  data-el={el}
                  className="og-hucre"
                  data-evren={ic ? undefined : "hayir"}
                  data-isaret={i}
                  aria-pressed={secili.has(el)}
                  aria-label={`${el}${secili.has(el) ? ", seçili" : ""}${i ? isaretYazi[i] : ""}`}
                  aria-disabled={kilit || !ic || undefined}
                  tabIndex={odak === el ? 0 : -1}
                  onClick={() => !kilit && ic && degistir(el)}
                  onFocus={() => setOdak(el)}
                  onKeyDown={(e) => {
                    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
                    if (d[e.key]) {
                      e.preventDefault();
                      git(el, ...d[e.key]);
                    }
                  }}
                >
                  {el}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {kilit && <RangeLejant />}
    </div>
  );
}

function RangeLejant() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <li className="flex items-center gap-2">
        <span className="og-lejant" style={{ background: "var(--og-ok)" }} /> Doğru seçim
      </li>
      <li className="flex items-center gap-2">
        <span className="og-lejant" style={{ background: "var(--soft)", boxShadow: "inset 0 0 0 2px var(--accent)" }} /> Eksik kaldı
      </li>
      <li className="flex items-center gap-2">
        <span className="og-lejant" style={{ background: "var(--danger-soft)", boxShadow: "inset 0 0 0 2px var(--danger)" }} /> Fazladan seçildi
      </li>
    </ul>
  );
}

// ───────────── Spot: masa + seçenekler. Rakibin eli hiçbir koşulda gösterilmez. ─────────────
function Spot(p: GirisProps) {
  const el = useMemo(() => spotEl(p.a), [p.a]);
  const r = useMemo(() => (el ? replay(el) : null), [el]);
  if (!el || !r) return <Secenekler {...p} secenekler={ogeler(p.a)} />;
  return (
    <div className="flex flex-col gap-3">
      <div className="trainer rounded-2xl border border-t-line bg-t-bg p-2 text-t-ink sm:p-3">
        <p className="px-1 pb-1 text-[13px] text-t-muted">
          {el.game === "cash" ? "Cash" : "Turnuva"} · {el.stackBB} BB{el.ante ? ` · Ante ${fmt(el.ante)}` : ""} · Pot {fmt(r.pot)} BB
          {r.toCall > 0 ? ` · Call için ${fmt(r.toCall)} BB` : ""}
        </p>
        <PokerTable hand={el} r={r} />
        {el.note && (
          <p className="mt-1 flex gap-2 rounded-xl border border-t-line bg-t-panel px-3 py-1.5 text-[13px] leading-snug">
            <span aria-hidden="true" className="text-t-act">
              ●
            </span>
            <span>
              {p.a.spot ? <strong>Rakip aralığı (varsayım): </strong> : null}
              {el.note}
            </span>
          </p>
        )}
      </div>
      <Secenekler {...p} secenekler={el.options} etiket="Hamleni seç" />
    </div>
  );
}
