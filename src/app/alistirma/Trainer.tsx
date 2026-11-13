"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AiPanel } from "@/components/AiPanel";
import { CoachChat } from "@/components/CoachChat";
import { AksiyonCubugu } from "@/components/masa/AksiyonCubugu";
import { AksiyonGecmisi } from "@/components/masa/AksiyonGecmisi";
import { Masa } from "@/components/masa/Masa";
import { HAND_BY_ID, HANDS, TOPICS, type Hand } from "@/data/hands";
import { STATIC_SITE } from "@/lib/client/env";
import { isLongSession, readEvery, shouldBreak, staleEmptyBlock, writeEvery, type Block, type RhythmEvery } from "@/lib/client/rhythm";
import { addAttempt, saveHand, unsaveHand, useProgress } from "@/lib/client/store";
import {
  applyHero,
  createHand,
  legalActions,
  summarize,
  type EngineState,
  type HeroAksiyon,
  type HeroKarar,
} from "@/lib/poker/engine";
import { fmt, replay } from "@/lib/poker/replay";
import { Ayarlar } from "./Ayarlar";
import { ElSonu } from "./ElSonu";
import { Kurulum } from "./Kurulum";
import { BreakCard, Summary, type Answer } from "./OturumPanelleri";
import { HIZ_CARPAN, hizOku, hizYaz, kalanBoard, type Hiz } from "./lib/elAkisi";
import { eslesir, filtreOku, filtreYaz, havuz, type Filtre } from "./lib/filtreler";
import { aksiyonCumlesi, baslangicGorunumu, gorunumHesapla, olaySuresi, sonRakipAksiyonu } from "./lib/gorunum";
import { KADEME_ETIKET, geriBildirimCumlesi, secenekSirasi, spotKisayollari } from "./lib/ilkKarar";
import { elKararlariniYaz } from "./lib/kararDeposu";
import { useSayfaKilidi } from "./useSayfaKilidi";

type Panel = null | "gecmis" | "ayar" | "ozet";
type GeriBildirim = { karar: HeroKarar; ilk: boolean };

const KADEME_RENK = { "en-iyi": "text-[#8be0b4]", kabul: "text-[#ffc27a]", hata: "text-[#ffb4a6]" };
const KADEME_IKON = { "en-iyi": "✓", kabul: "≈", hata: "✕" };

function Ikon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const IKON_BTN = "grid size-11 shrink-0 place-items-center rounded-xl text-t-muted transition hover:bg-t-panel-2 hover:text-t-ink";

/**
 * Alıştırma masası: kurulum ekranı ve el motoruyla oynanan antrenman.
 * `onStreak(n)`: o anki doğru serisi değiştiğinde çağrılır (kutlama ayrı iş kolunda bağlanacak).
 */
export function Trainer({ onStreak }: { onStreak?: (n: number) => void } = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const progress = useProgress();
  const kokRef = useRef<HTMLDivElement>(null);
  const aksiyonRef = useRef<HTMLDivElement>(null);
  const ustRef = useRef<HTMLDivElement>(null);
  useSayfaKilidi(kokRef);

  const baglanti = ["el", "oyun", "konu", "sokak", "pf"].some((k) => params.has(k));
  const [mod, setMod] = useState<"kurulum" | "masa">(baglanti ? "masa" : "kurulum");
  const [filtre, setFiltre] = useState<Filtre>(() => filtreOku(params));
  const [hand, setHand] = useState<Hand | null>(null);
  const [engine, setEngine] = useState<EngineState | null>(null);
  const [gosterilen, setGosterilen] = useState(0);
  const [elNo, setElNo] = useState(0);
  const [tekrarEl, setTekrarEl] = useState(false);
  const [ilkSecim, setIlkSecim] = useState<number | undefined>(undefined);
  const [geri, setGeri] = useState<GeriBildirim | null>(null);
  const [foldOncesi, setFoldOncesi] = useState<EngineState | null>(null);
  const [kalan, setKalan] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [seri, setSeri] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [ozetKucuk, setOzetKucuk] = useState(false);
  const [hiz, setHiz] = useState<Hiz>("normal");
  const [tekrar, setTekrar] = useState(0);
  const [kocSoru, setKocSoru] = useState<{ id: number; text: string } | undefined>();
  const [kocOlay, setKocOlay] = useState<{ id: number; text: string } | undefined>();
  const [analyze, setAnalyze] = useState(0);
  const recent = useRef<string[]>([]);
  const batchBas = useRef(0);
  const kaydedildi = useRef<string | null>(null);

  // Oturum ritmi
  const [every, setEvery] = useState<RhythmEvery>(20);
  const [showBreak, setShowBreak] = useState(false);
  const [breakAsk, setBreakAsk] = useState(0);
  const block = useRef<Block>({ start: 0, answers: 0 });
  const sessionStart = useRef(0);
  useEffect(() => {
    setEvery(readEvery());
    setHiz(hizOku());
    block.current.start = sessionStart.current = Date.now();
  }, []);

  // Aksiyon çubuğunun ve üst çubuğun yüksekliği: koç penceresi bunların arasında kalır
  useEffect(() => {
    const kok = kokRef.current;
    if (!kok) return;
    const olc = () => {
      kok.style.setProperty("--aksiyon-h", `${Math.round(aksiyonRef.current?.getBoundingClientRect().height ?? 0)}px`);
      kok.style.setProperty("--ust-bar", `${Math.round(ustRef.current?.getBoundingClientRect().height ?? 0)}px`);
    };
    olc();
    const ro = new ResizeObserver(olc);
    if (aksiyonRef.current) ro.observe(aksiyonRef.current);
    if (ustRef.current) ro.observe(ustRef.current);
    return () => ro.disconnect();
  }, [mod, hand]);

  const pool = useMemo(() => havuz(filtre), [filtre]);

  const pickNext = useCallback(
    (list: Hand[]): Hand | null => {
      if (!list.length) return null;
      const avoid = new Set(recent.current.slice(-Math.min(40, list.length - 1)));
      if (Math.random() < 0.2) {
        const wrong = progress.attempts.filter((a) => !a.correct).map((a) => HAND_BY_ID.get(a.handId));
        const candidates = wrong.filter((h): h is Hand => !!h && eslesir(h, filtre) && !avoid.has(h.id));
        if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
      }
      const fresh = list.filter((h) => !avoid.has(h.id));
      const from = fresh.length ? fresh : list;
      return from[Math.floor(Math.random() * from.length)];
    },
    [progress.attempts, filtre],
  );

  const baslat = useCallback((h: Hand | null, tekrarMi = false) => {
    let s: EngineState | null = null;
    if (h) {
      try {
        s = createHand(h);
      } catch {
        s = null;
      }
    }
    setHand(s ? h : null);
    setEngine(s);
    setGosterilen(0);
    batchBas.current = 0;
    setIlkSecim(undefined);
    setGeri(null);
    setFoldOncesi(null);
    setKalan(null);
    setTekrarEl(tekrarMi);
    setOzetKucuk(false);
    setPanel((p) => (p === "ozet" ? null : p));
    setElNo((n) => n + 1);
    kaydedildi.current = null;
    if (h && !tekrarMi) recent.current = [...recent.current.slice(-60), h.id];
  }, []);

  // Adresten gelindiyse doğrudan masa
  useEffect(() => {
    if (mod !== "masa" || hand) return;
    const start = params.get("el");
    baslat((start && HAND_BY_ID.get(start)) || pickNext(pool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod]);

  function antrenmanaBasla() {
    const q = filtreYaz(filtre);
    router.replace(`/alistirma${q ? `?${q}` : ""}`, { scroll: false });
    setMod("masa");
    baslat(pickNext(pool));
  }

  // ── Olayların oynatılması ──
  const carpan = HIZ_CARPAN[hiz];
  const olaylar = engine?.olaylar ?? [];
  const oynatiliyor = !!engine && gosterilen < olaylar.length;
  useEffect(() => {
    if (!engine) return;
    const n = engine.olaylar.length;
    if (gosterilen >= n) return;
    if (carpan === 0) {
      setGosterilen(n);
      return;
    }
    const onceki = gosterilen > batchBas.current ? engine.olaylar[gosterilen - 1] : null;
    const bekle = onceki ? olaySuresi(onceki, engine.spot.heroPos) * carpan : 60;
    const t = setTimeout(() => setGosterilen((g) => g + 1), bekle);
    return () => clearTimeout(t);
  }, [engine, gosterilen, carpan]);

  const baslangic = useMemo(() => (hand ? baslangicGorunumu(createHand(hand)) : null), [hand]);
  const gorunum = useMemo(() => (baslangic ? gorunumHesapla(baslangic, olaylar, gosterilen) : null), [baslangic, olaylar, gosterilen]);
  const r = useMemo(() => (hand ? replay(hand) : null), [hand]);
  const bitti = !!engine?.result && !oynatiliyor;
  const heroSirasi = !!engine && !engine.result && engine.toAct === engine.spot.heroPos;
  const aktif = heroSirasi && !oynatiliyor && !showBreak;
  const legal = useMemo(() => (engine ? legalActions(engine) : {}), [engine]);
  const sonRakip = useMemo(() => (engine && heroSirasi ? sonRakipAksiyonu(engine) : null), [engine, heroSirasi]);
  const ekKisayollar = useMemo(
    () => (hand && engine && engine.decisions.length === 0 ? spotKisayollari(hand, engine.pot, legal) : []),
    [hand, engine, legal],
  );
  const ozet = useMemo(() => (engine?.result ? summarize(engine) : null), [engine]);
  // Koç yalnızca ekranda oynatılmış duruma bakar: oynatma sürerken açılmamış kart koça girmez
  const sakinDurum = useRef<EngineState | null>(null);
  if (!oynatiliyor) sakinDurum.current = engine;

  // El bitince: sonraki sokak kararları yeni anahtara (bir kez)
  useEffect(() => {
    if (!engine?.result || !hand || tekrarEl || kaydedildi.current === `${hand.id}-${elNo}`) return;
    kaydedildi.current = `${hand.id}-${elNo}`;
    elKararlariniYaz(hand.id, engine.decisions);
  }, [engine, hand, tekrarEl, elNo]);

  function oyna(a: HeroAksiyon) {
    if (!engine || !hand || !aktif) return;
    let res: ReturnType<typeof applyHero>;
    try {
      res = applyHero(engine, a);
    } catch {
      return;
    }
    const karar = res.state.decisions[res.state.decisions.length - 1];
    const ilk = engine.decisions.length === 0;
    if (ilk && !tekrarEl) {
      const i = secenekSirasi(hand, a, karar, legal);
      setIlkSecim(i);
      setAnswers((x) => [...x, { hand, chosen: i }]);
      block.current.answers++;
      void addAttempt(hand.id, i);
      const yeni = i === hand.correct ? seri + 1 : 0;
      setSeri(yeni);
      onStreak?.(yeni);
    } else if (ilk) {
      setIlkSecim(secenekSirasi(hand, a, karar, legal));
    }
    if (a.tür === "fold") setFoldOncesi(engine);
    batchBas.current = engine.olaylar.length;
    setEngine(res.state);
    setGeri({ karar, ilk });
    setKocOlay({ id: Date.now(), text: `${karar.sokak[0].toLocaleUpperCase("tr")}${karar.sokak.slice(1)}: ${KADEME_ETIKET[karar.kademe]}${karar.tahmini ? " (tahmini)" : ""}` });
  }

  function atla() {
    if (engine) setGosterilen(engine.olaylar.length);
  }

  function sonraki() {
    const now = Date.now();
    if (staleEmptyBlock(block.current, now)) block.current = { start: now, answers: 0 };
    if (shouldBreak(every, block.current, now)) {
      setBreakAsk(0);
      setShowBreak(true);
      return;
    }
    baslat(pickNext(pool));
  }
  function tekrarOyna() {
    if (hand) baslat(hand, true);
  }
  function continueAfterBreak() {
    block.current = { start: Date.now(), answers: 0 };
    setShowBreak(false);
    setBreakAsk(0);
    baslat(pickNext(pool));
  }
  function stopAfterBreak() {
    block.current = { start: Date.now(), answers: 0 };
    setShowBreak(false);
    setBreakAsk(0);
    setPanel("ozet");
  }
  function changeEvery(e: RhythmEvery) {
    setEvery(e);
    writeEvery(e);
  }
  function changeHiz(h: Hiz) {
    setHiz(h);
    hizYaz(h);
  }
  function neden() {
    setKocSoru({ id: Date.now(), text: "Neden?" });
  }

  // Klavye: Enter sonraki el (el bittiyse), Esc açık paneli kapatır; ara kartı açıkken Enter devam eder
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (mod !== "masa" || t.closest("input, textarea, select")) return;
      if (showBreak) {
        if (e.key === "Escape") stopAfterBreak();
        else if (e.key === "Enter" && !t.closest("button, a")) {
          e.preventDefault();
          continueAfterBreak();
        }
        return;
      }
      if (e.key === "Escape" && panel) {
        setPanel(null);
        return;
      }
      if (e.key === "Enter" && bitti && !panel && !t.closest("button, a")) {
        e.preventDefault();
        sonraki();
      }
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const ok = answers.filter((a) => a.chosen === a.hand.correct).length;
  const dogruluk = answers.length ? Math.round((ok / answers.length) * 100) : null;
  const blockAnswers = showBreak ? answers.slice(Math.max(0, answers.length - block.current.answers)) : [];
  const saved = !!hand && progress.saved.some((s) => s.handId === hand.id);
  const oyuncu = hand ? (hand.players?.length ?? 6) : 6;

  // ── Bilgi satırı: geri bildirim şeridi, son rakip aksiyonu ya da oynatma ──
  let bilgi: ReactNode = null;
  if (oynatiliyor) {
    bilgi = (
      <>
        <p className="min-w-0 flex-1 truncate text-t-muted" aria-live="off">
          Rakipler oynuyor…
        </p>
        <button type="button" onClick={atla} className="min-h-11 shrink-0 rounded-lg border border-t-line px-3 text-[13px] font-bold text-t-ink hover:border-t-accent">
          Atla
        </button>
      </>
    );
  } else if (geri && (bitti || !sonRakip || geri.karar.kademe === "hata")) {
    const k = geri.karar;
    bilgi = (
      <>
        <p className="min-w-0 flex-1 leading-snug" aria-live="polite">
          <span className={`font-extrabold ${KADEME_RENK[k.kademe]}`}>
            <span aria-hidden="true">{KADEME_IKON[k.kademe]} </span>
            {KADEME_ETIKET[k.kademe]}
          </span>
          {k.tahmini && <span className="ml-1.5 rounded bg-t-panel-2 px-1.5 py-0.5 text-[11px] font-semibold text-t-muted">Tahmini değerlendirme</span>}
          <span className="ml-1.5 text-t-ink/90">{hand && geriBildirimCumlesi(k, hand, geri.ilk)}</span>
        </p>
        <button type="button" onClick={neden} className="min-h-11 shrink-0 rounded-lg border border-t-line px-3 text-[13px] font-bold text-t-ink hover:border-t-accent">
          Neden?
        </button>
      </>
    );
  } else if (sonRakip) {
    bilgi = (
      <>
        <p className="min-w-0 flex-1 truncate font-semibold text-t-ink" aria-live="polite">
          {geri && (
            <span className={`mr-2 font-extrabold ${KADEME_RENK[geri.karar.kademe]}`} title={geriBildirimCumlesi(geri.karar, hand!, geri.ilk)}>
              {KADEME_IKON[geri.karar.kademe]} {KADEME_ETIKET[geri.karar.kademe]}
              {geri.karar.tahmini ? "*" : ""}
            </span>
          )}
          {aksiyonCumlesi(sonRakip.koltuk, sonRakip.son)}
        </p>
        {geri && (
          <button type="button" onClick={neden} className="min-h-11 shrink-0 rounded-lg px-2 text-[13px] font-bold text-t-muted hover:text-t-ink">
            Neden?
          </button>
        )}
        <button
          type="button"
          onClick={() => setTekrar((n) => n + 1)}
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-[13px] font-bold text-t-muted hover:text-t-ink"
        >
          <Ikon d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" className="size-4" />
          <span className="hidden sm:inline">Son aksiyonu tekrar oynat</span>
          <span className="sm:hidden">Tekrar</span>
        </button>
      </>
    );
  } else if (heroSirasi && engine) {
    bilgi = <p className="text-t-muted">{engine.decisions.length ? "Yeni sokak açıldı; ilk konuşan sensin." : "Herkes sana kadar fold etti; ilk karar senin."}</p>;
  }

  const sagPanel = panel === "gecmis" || (bitti && !ozetKucuk) ? (bitti && !ozetKucuk && panel !== "gecmis" ? "ozet-el" : "gecmis") : null;

  return (
    <div ref={kokRef} className="trainer antrenman-kok bg-t-bg text-t-ink">
      {mod === "kurulum" ? (
        <>
          <div ref={ustRef} className="flex min-h-12 items-center gap-2 border-b border-t-line px-3">
            <p className="flex-1 text-sm font-bold text-t-muted">Alıştırma masası</p>
            {answers.length > 0 && (
              <button type="button" onClick={() => setMod("masa")} className="min-h-11 rounded-lg px-3 text-sm font-bold text-t-ink hover:bg-t-panel-2">
                Masaya dön
              </button>
            )}
          </div>
          <Kurulum
            filtre={filtre}
            onFiltre={setFiltre}
            onBasla={antrenmanaBasla}
            every={every}
            onEvery={changeEvery}
            hiz={hiz}
            onHiz={changeHiz}
            cozulen={answers.length}
          />
          <div />
        </>
      ) : (
        <>
          {/* ── Üst bilgi çubuğu ── */}
          <div ref={ustRef} className="relative flex min-h-12 items-center gap-1 border-b border-t-line px-1.5 sm:gap-2 sm:px-3">
            <button type="button" onClick={() => setMod("kurulum")} aria-label="Kurulum ekranına dön" title="Kurulum" className={IKON_BTN}>
              <Ikon d="M15 6l-6 6 6 6" />
            </button>
            {hand && (
              <ul aria-label="Spot bilgisi" className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-[12px] font-semibold sm:text-[13px]">
                <li className="min-w-0 truncate rounded-full bg-t-panel-2 px-2.5 py-1 whitespace-nowrap text-t-ink">
                  {hand.game === "cash" ? "Cash" : "Turnuva"} • <span className="max-[400px]:hidden">{oyuncu === 2 ? "Heads-up" : `${oyuncu}max`} • </span>
                  {fmt(hand.stackBB)} BB
                </li>
                {hand.ante ? <li className="hidden shrink-0 rounded-full bg-t-panel-2 px-2.5 py-1 text-t-muted sm:block">Ante {fmt(hand.ante)}</li> : null}
                <li className="hidden min-w-0 truncate rounded-full bg-t-panel-2 px-2.5 py-1 text-t-muted md:block">{TOPICS[hand.topic]}</li>
                <li className="hidden min-w-0 truncate px-1 text-t-muted xl:block">{hand.title}</li>
              </ul>
            )}
            {seri >= 5 && (
              <p className="anim-rozet flex shrink-0 items-center gap-1 rounded-full bg-t-accent/15 px-2 py-1 text-[13px] font-extrabold text-t-accent" aria-label={`Doğru serisi: ${seri}`}>
                <span aria-hidden="true" className="text-base leading-none">🍺</span>
                {seri}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPanel((p) => (p === "ozet" ? null : "ozet"))}
              disabled={!answers.length}
              aria-label={`Oturum özeti: ${answers.length} karar, doğruluk ${dogruluk ?? 0} yüzde`}
              className="flex min-h-11 shrink-0 flex-col items-end justify-center rounded-xl px-2 leading-none tabular-nums hover:bg-t-panel-2 disabled:hover:bg-transparent"
            >
              <span className="text-[15px] font-extrabold text-t-ink">{dogruluk === null ? "—" : `%${dogruluk}`}</span>
              <span className="text-[11px] font-semibold text-t-muted">
                {ok}/{answers.length}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={saved}
              aria-label={saved ? "Kayıtlı ellerden çıkar" : "Eli kaydet"}
              title={saved ? "Kayıtlı ellerden çıkar" : "Eli kaydet"}
              disabled={!hand}
              onClick={() => hand && void (saved ? unsaveHand(hand.id) : saveHand(hand.id, ""))}
              className={`${IKON_BTN} ${saved ? "text-t-act" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h12v18l-6-4.5L6 21z" />
              </svg>
            </button>
            <button
              type="button"
              aria-pressed={panel === "gecmis"}
              aria-label="Aksiyon geçmişi"
              title="Aksiyon geçmişi"
              onClick={() => setPanel((p) => (p === "gecmis" ? null : "gecmis"))}
              className={`${IKON_BTN} ${panel === "gecmis" ? "bg-t-panel-2 text-t-ink" : ""}`}
            >
              <Ikon d="M4 6h16M4 12h16M4 18h10" />
            </button>
            <button
              type="button"
              aria-expanded={panel === "ayar"}
              aria-controls="masa-ayarlar"
              aria-label="Ayarlar"
              title="Ayarlar"
              onClick={() => setPanel((p) => (p === "ayar" ? null : "ayar"))}
              className={`${IKON_BTN} ${panel === "ayar" ? "bg-t-panel-2 text-t-ink" : ""}`}
            >
              <Ikon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </button>
            {panel === "ayar" && (
              <div
                id="masa-ayarlar"
                role="group"
                aria-label="Ayarlar"
                className="anim-belir absolute top-full right-2 z-50 mt-1 w-[min(340px,calc(100vw-16px))] rounded-2xl border border-t-line bg-t-panel p-4 shadow-[0_18px_50px_rgb(0_0_0/0.55)]"
              >
                <Ayarlar every={every} onEvery={changeEvery} hiz={hiz} onHiz={changeHiz} />
              </div>
            )}
          </div>

          {/* ── Masa alanı ── */}
          <div className="relative grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative flex min-h-0 min-w-0 flex-col" inert={showBreak || panel === "ozet"}>
              <div className="masa-alan flex-1">
              {hand && gorunum && engine ? (
                <Masa
                  heroPos={hand.heroPos}
                  heroKartlar={hand.hero}
                  gorunum={gorunum}
                  dagitim={`${hand.id}-${elNo}`}
                  siraSende={aktif}
                  sonRakip={sonRakip}
                  tekrar={tekrar}
                  hiz={carpan}
                  olayNo={gosterilen}
                />
              ) : (
                <p className="p-10 text-center text-t-muted">{pool.length ? "Yükleniyor…" : "Bu seçimde el yok."}</p>
              )}
              </div>
              {hand?.note && (
                <p className="absolute top-1.5 left-2 max-w-[min(420px,70%)] rounded-lg bg-black/35 px-2 py-1 text-[12px] leading-snug text-t-ink/90">
                  <span aria-hidden="true" className="text-t-act">● </span>
                  {hand.note}
                </p>
              )}
              <p className="shrink-0 truncate px-2 pr-20 pb-0.5 text-[11px] leading-5 text-t-muted">
                <strong className="text-t-ink">18+</strong> · Strateji çalışma aracı; gerçek parayla oyun yok.{" "}
                <Link href="/sorumlu-oyun" className="underline hover:text-t-ink">
                  Sorumlu oyun
                </Link>
              </p>
            </div>

            {/* Sağ panel: aksiyon geçmişi ya da el özeti. Geniş ekranda sütun, dar ekranda masanın üstünde katman. */}
            {sagPanel && hand && r && (
              <div className="absolute inset-y-0 right-0 z-20 w-[min(360px,92%)] border-l border-t-line shadow-[-12px_0_30px_rgb(0_0_0/0.35)] lg:static lg:w-[340px] lg:shadow-none">
                {sagPanel === "gecmis" ? (
                  <AksiyonGecmisi r={r} heroPos={hand.heroPos} olaylar={olaylar.slice(0, gosterilen)} onKapat={() => setPanel(null)} />
                ) : (
                  ozet && (
                    <ElSonu
                      ozet={ozet}
                      heroPos={hand.heroPos}
                      kalan={kalan}
                      kalanGoster={foldOncesi && foldOncesi.board.length < 5 ? () => setKalan(kalanBoard(foldOncesi)) : null}
                      onKapat={() => setOzetKucuk(true)}
                    />
                  )
                )}
              </div>
            )}

            {/* Oturum özeti ve ara kartı: masa alanının üstünde, kendi içinde kayar */}
            {panel === "ozet" && (
              <div className="absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-t-bg/95">
                <div className="flex justify-end px-3 pt-2">
                  <button type="button" onClick={() => setPanel(null)} className="min-h-11 rounded-lg px-3 text-sm font-bold text-t-ink hover:bg-t-panel-2">
                    Masaya dön
                  </button>
                </div>
                <Summary
                  answers={answers}
                  onContinue={() => setPanel(null)}
                  onReset={() => {
                    setAnswers([]);
                    setSeri(0);
                    setPanel(null);
                    sonraki();
                  }}
                  onTopic={(t) => {
                    setFiltre({ oyun: "", sokak: "", pf: "", konu: t });
                    router.replace(`/alistirma?konu=${t}`, { scroll: false });
                    setPanel(null);
                    baslat(pickNext(havuz({ oyun: "", sokak: "", pf: "", konu: t })));
                  }}
                  analyze={analyze}
                  setAnalyze={setAnalyze}
                />
              </div>
            )}
            {showBreak && (
              <div className="absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-t-bg/80">
                <BreakCard
                  answers={blockAnswers}
                  minutes={Math.max(1, Math.round((Date.now() - block.current.start) / 60000))}
                  longSession={isLongSession(sessionStart.current, Date.now())}
                  every={every}
                  onEvery={changeEvery}
                  onContinue={continueAfterBreak}
                  onStop={stopAfterBreak}
                />
                {!STATIC_SITE && blockAnswers.length > 0 && (
                  <div className="mx-auto max-w-[480px] px-3 pb-6 text-ink">
                    {breakAsk ? (
                      <AiPanel
                        title="Bu bölümün yorumu"
                        context={{ type: "practice", attempts: blockAnswers.map((a) => ({ handId: a.hand.id, chosen: a.chosen })) }}
                        autoAsk={{ id: breakAsk, question: "Bu bölümdeki sonuçlarımı kısaca yorumlar mısın?" }}
                        placeholder="Bu bölüm hakkında sor…"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBreakAsk(Date.now())}
                        className="min-h-11 w-full rounded-xl border border-t-line bg-t-panel-2 px-4 text-sm font-bold text-t-ink transition hover:border-t-accent"
                      >
                        Bu bölümü yorumla
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Alt aksiyon çubuğu ── */}
          <div ref={aksiyonRef} inert={showBreak || panel === "ozet"}>
            <AksiyonCubugu
              key={`${hand?.id}-${elNo}-${engine?.decisions.length ?? 0}`}
              legal={legal}
              aktif={aktif}
              ekKisayollar={ekKisayollar}
              onAksiyon={oyna}
              bilgi={bilgi}
              bitis={
                bitti ? (
                  <div className="grid gap-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={tekrarOyna} className="min-h-12 rounded-xl border border-t-line bg-t-panel-2 px-3 text-sm font-bold text-t-ink hover:border-t-accent">
                        Bu eli tekrar oyna
                      </button>
                      <button
                        type="button"
                        onClick={sonraki}
                        autoFocus
                        className="min-h-12 rounded-xl bg-t-accent px-3 text-sm font-extrabold text-[#1c1404] hover:brightness-110"
                      >
                        Sonraki el <span className="hidden text-xs opacity-70 lg:inline">(Enter)</span>
                      </button>
                    </div>
                    <p className="text-center text-[11px] text-t-muted">
                      Tekrar oynadığında kartlar ve rakiplerin aynı hamlelere tepkisi aynı gelir; ilk karar ilerlemene yeniden yazılmaz.
                      {ozetKucuk && (
                        <>
                          {" "}
                          <button type="button" onClick={() => setOzetKucuk(false)} className="font-bold text-t-ink underline">
                            El özetini aç
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                ) : undefined
              }
            />
          </div>

          {hand && <CoachChat hand={hand} chosen={ilkSecim} kararlar={engine?.decisions ?? []} durum={oynatiliyor ? sakinDurum.current : engine} trigger={kocSoru} olay={kocOlay} />}
        </>
      )}
    </div>
  );
}
