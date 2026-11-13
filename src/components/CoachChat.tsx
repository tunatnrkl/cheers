"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Hand } from "@/data/hands";
import { STATIC_SITE } from "@/lib/client/env";
import { legalActions, type EngineState, type HeroKarar } from "@/lib/poker/engine";
import { HIZLI_SORULAR, SERBEST_SORU_YANITI, nedenYaniti, planYaniti, potOddsYaniti, soruTuru } from "@/app/alistirma/lib/koc";
import { RichText } from "./RichText";
import { CheersMark } from "./brand/CheersMark";

type Msg = { role: "user" | "assistant" | "event"; content: string; error?: boolean };
export type KocDurumu = "acik" | "kucuk" | "kapali";

type Props = {
  hand: Hand;
  /** İlk kararda seçilen seçenek (sunucu bağlamına yalnızca bu gider) */
  chosen?: number;
  /** Hero'nun bu eldeki kararları (motor değerlendirmeleriyle) */
  kararlar: readonly HeroKarar[];
  /** Kural tabanlı yanıtlar için o anki durum (pot, call, board, stack'ler) */
  durum: EngineState | null;
  /** Dışarıdan soru (ör. geri bildirim şeridindeki "Neden?"): pencereyi açar ve sorar */
  trigger?: { id: number; text: string };
  /** Karar sonrası sohbete düşülen kısa not */
  olay?: { id: number; text: string };
};

const ANAHTAR = "cheers:koc:v1";
type Kayit = { handId: string; mesajlar: Msg[]; yazi: string; durum: KocDurumu; kaydirma: number };

function oku(): Partial<Kayit> {
  try {
    return JSON.parse(sessionStorage.getItem(ANAHTAR) ?? "{}") as Partial<Kayit>;
  } catch {
    return {};
  }
}
function yaz(k: Kayit) {
  try {
    sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...k, mesajlar: k.mesajlar.slice(-40) }));
  } catch {}
}

/** Düz metin (ekran okuyucu duyurusu için): basit işaretler atılır. */
const duz = (s: string) => s.replace(/\*\*/g, "").replace(/^[-#]\s*/gm, "");

/**
 * Koç penceresi: sağ altta, modal değil. Kapalıyken yuvarlak amber buton, küçültülünce küçük
 * baloncuk; açılınca aynı hâline döner (mesajlar, yazılan metin ve kaydırma korunur; oturum
 * boyunca sessionStorage'da). Statik sürümde yapay zeka yoktur: yanıtlar spotun gerekçesi ve
 * kural tabanlı kısa hesaplardır. Sunuculu kurulumda serbest sorular /api/ai/chat'e gider;
 * istekte yalnızca spot kimliği ve hero'nun ilk seçimi bulunur (rakip kartı, açılmamış board yok).
 */
export function CoachChat({ hand, chosen, kararlar, durum, trigger, olay }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hal, setHal] = useState<KocDurumu>("kapali");
  const [okunmamis, setOkunmamis] = useState(0);
  const [duyuru, setDuyuru] = useState("");
  /** Kısa ekranda (dar çekmece) hazır sorular ile yazı alanı aynı satırı paylaşır; bu, yazı alanını açar */
  const [yaziAcik, setYaziAcik] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const balonRef = useRef<HTMLButtonElement>(null);
  const kaydirma = useRef(0);
  const [hazir, setHazir] = useState(false);
  const lastTrigger = useRef(0);
  const lastOlay = useRef(0);
  const baslikId = useId();
  const halRef = useRef(hal);
  halRef.current = hal;

  // Oturum kaydını yükle (aynı el ise mesajlar ve yazı geri gelir; hâl her zaman)
  useEffect(() => {
    const k = oku();
    if (k.durum === "acik" || k.durum === "kucuk" || k.durum === "kapali") setHal(k.durum);
    if (k.handId === hand.id) {
      setMessages(Array.isArray(k.mesajlar) ? k.mesajlar : []);
      setInput(typeof k.yazi === "string" ? k.yazi : "");
      kaydirma.current = typeof k.kaydirma === "number" ? k.kaydirma : 0;
    } else {
      setMessages([]);
      setInput("");
      kaydirma.current = 0;
    }
    setOkunmamis(0);
    setHazir(true);
  }, [hand.id]);

  useEffect(() => {
    if (!hazir) return;
    yaz({ handId: hand.id, mesajlar: messages.filter((m) => m.content), yazi: input, durum: hal, kaydirma: kaydirma.current });
  }, [hazir, hand.id, messages, input, hal]);

  // Açılınca kaydırma konumunu geri yükle ve odağı yazı alanına taşı
  useEffect(() => {
    if (hal !== "acik") return;
    const el = listRef.current;
    if (el) el.scrollTop = kaydirma.current || el.scrollHeight;
    setOkunmamis(0);
  }, [hal]);

  function ekle(m: Msg[]) {
    setMessages((x) => [...x, ...m]);
    const cevap = m.filter((x) => x.role === "assistant").pop();
    if (cevap) {
      if (halRef.current !== "acik") setOkunmamis((n) => n + 1);
      setDuyuru(duz(cevap.content));
    }
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el && halRef.current === "acik") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    });
  }

  function yerelYanit(q: string): string | null {
    const t = soruTuru(q);
    if (t === "Pot odds nedir?") {
      const l = durum ? legalActions(durum) : {};
      return potOddsYaniti(durum?.pot ?? hand.potBB, l.call);
    }
    if (t === "Bu board'da planım ne olmalı?") return durum ? planYaniti(durum) : null;
    if (STATIC_SITE) return t === "Neden?" ? nedenYaniti(hand, kararlar) : SERBEST_SORU_YANITI;
    return null;
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const yerel = yerelYanit(q);
    if (yerel !== null) {
      ekle([
        { role: "user", content: q },
        { role: "assistant", content: yerel },
      ]);
      return;
    }

    setBusy(true);
    const history = messages
      .filter((m) => m.role !== "event" && !m.error && m.content)
      .slice(-8)
      .map(({ role, content }) => ({ role: role as "user" | "assistant", content }));
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    const update = (patch: Partial<Msg>) => setMessages((m) => [...m.slice(0, -1), { ...m[m.length - 1], ...patch }]);
    let out = "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Bağlam yalnızca spot kimliği ve hero'nun ilk seçimi: rakip kartı ya da açılmamış board gönderilmez
        body: JSON.stringify({ question: q, history, context: { type: "drill", handId: hand.id, chosen } }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        out = data.error || "Koç şu an yanıt veremiyor.";
        update({ content: out, error: true });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value, { stream: true });
        update({ content: out });
      }
    } catch {
      out = "Bağlantı kurulamadı. Yeniden dener misin?";
      update({ content: out, error: true });
    } finally {
      setBusy(false);
      if (out) {
        if (halRef.current !== "acik") setOkunmamis((n) => n + 1);
        setDuyuru(duz(out));
      }
    }
  }

  useEffect(() => {
    if (trigger && trigger.id !== lastTrigger.current) {
      lastTrigger.current = trigger.id;
      setHal("acik");
      void ask(trigger.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.id]);

  useEffect(() => {
    if (olay && olay.id !== lastOlay.current) {
      lastOlay.current = olay.id;
      setMessages((m) => [...m, { role: "event", content: olay.text }]);
    }
  }, [olay]);

  function kucult(hedef: KocDurumu = "kucuk") {
    if (listRef.current) kaydirma.current = listRef.current.scrollTop;
    setHal(hedef);
    requestAnimationFrame(() => balonRef.current?.focus());
  }
  function ac() {
    setHal("acik");
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  const acik = hal === "acik";

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {duyuru ? `Koç: ${duyuru}` : ""}
      </p>

      {!acik && (
        <button
          ref={balonRef}
          type="button"
          onClick={ac}
          aria-label={`Koç penceresini aç${okunmamis ? ` (${okunmamis} okunmamış yanıt)` : ""}`}
          className={`koc-balon anim-belir absolute right-3 z-40 flex items-center gap-2 bg-t-accent font-extrabold text-[#1c1404] shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition hover:brightness-110 ${
            hal === "kapali" ? "size-14 justify-center rounded-full" : "min-h-11 rounded-full py-1.5 pr-4 pl-2 text-sm"
          }`}
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#1c1404]/10" aria-hidden="true">
            <CheersMark className="size-7 [--mark-beer:#1c1404] [--mark-foam:#fffaf0] [--mark-spark:#1c1404]" />
          </span>
          {hal === "kucuk" && <span>Koç</span>}
          {okunmamis > 0 && (
            <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-[#8f1d24] text-xs font-extrabold text-white" aria-hidden="true">
              {okunmamis}
            </span>
          )}
        </button>
      )}

      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby={baslikId}
        hidden={!acik}
        data-yazi={yaziAcik ? "1" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            kucult();
          }
        }}
        className="koc-pencere anim-koc absolute z-40 flex flex-col overflow-hidden rounded-2xl border border-t-line bg-t-panel shadow-[0_18px_50px_rgb(0_0_0/0.55)]"
      >
        <header className="koc-baslik flex items-center gap-2 border-b border-t-line py-1 pr-1 pl-3">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-t-accent/15">
            <CheersMark className="size-6" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h2 id={baslikId} className="text-sm font-bold text-t-ink">
              Koç
            </h2>
            <p className="truncate text-xs text-t-muted">{STATIC_SITE ? "Hazır sorularla kısa açıklamalar" : "Bu el hakkında kısa sor, kısa cevap al"}</p>
          </div>
          <button type="button" onClick={() => kucult("kucuk")} aria-label="Koç penceresini küçült" className="grid size-11 place-items-center rounded-lg text-t-muted hover:text-t-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 18h12" />
            </svg>
          </button>
          <button type="button" onClick={() => kucult("kapali")} aria-label="Koç penceresini kapat" className="grid size-11 place-items-center rounded-lg text-t-muted hover:text-t-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div
          ref={listRef}
          onScroll={(e) => {
            kaydirma.current = e.currentTarget.scrollTop;
          }}
          className="koc-liste flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 py-2.5"
        >
          {messages.length === 0 && (
            <p className="my-auto text-center text-sm text-t-muted">
              {STATIC_SITE
                ? "Aşağıdaki hazır sorulardan birini seç. Kararından sonra “Neden?” bu spotun gerekçesini gösterir."
                : "Kararını ver. Takılırsan buradan sorabilirsin; cevabı söylemeden ipucu verir."}
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "event" ? (
              <p key={i} className="self-center rounded-full bg-t-panel-2 px-3 py-1 text-center text-xs font-semibold text-t-muted">
                {m.content}
              </p>
            ) : m.role === "user" ? (
              <p key={i} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-t-accent px-3 py-1.5 text-sm font-semibold text-[#1c1404]">
                {m.content}
              </p>
            ) : (
              <div
                key={i}
                className={`max-w-[94%] self-start rounded-2xl rounded-bl-md px-3 py-2 text-sm leading-relaxed ${
                  m.error ? "bg-[#3a1c1c] text-[#ffb4ab]" : "bg-t-panel-2 text-t-ink"
                }`}
              >
                {m.content ? m.error ? m.content : <RichText text={m.content} /> : <span className="text-t-muted">Yazıyor…</span>}
              </div>
            ),
          )}
        </div>

        <div className="koc-alt border-t border-t-line p-2">
          <div className="koc-hizli mb-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {/* Yalnızca kısa çekmecede görünür (globals.css): yazı alanını hazır soruların yerine açar */}
            <button
              type="button"
              onClick={() => {
                setYaziAcik(true);
                requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
              }}
              className="koc-yaz-ac min-h-11 shrink-0 items-center rounded-full border border-t-line px-3 text-[13px] font-bold whitespace-nowrap text-t-ink hover:border-t-accent"
            >
              Kendin yaz
            </button>
            {HIZLI_SORULAR.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy}
                onClick={() => void ask(c)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-t-accent/50 bg-t-accent/10 px-3 text-[13px] font-bold whitespace-nowrap text-t-accent transition hover:bg-t-accent/20"
              >
                {c}
              </button>
            ))}
          </div>
          <form
            className="koc-form flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <label htmlFor="koc-soru" className="sr-only">
              Koça sor
            </label>
            <input
              id="koc-soru"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder="Bu el hakkında sor…"
              onKeyDown={(e) => {
                if (e.key === "Escape" && yaziAcik) {
                  e.stopPropagation();
                  setYaziAcik(false);
                }
              }}
              className="min-h-11 w-full min-w-0 rounded-xl border border-t-line bg-t-panel-2 px-3 text-[15px] text-t-ink placeholder:text-t-muted focus:border-t-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Gönder"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-t-accent text-[#1c1404] transition disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
