"use client";

import { useEffect, useRef, useState } from "react";
import type { Hand } from "@/data/hands";
import { STATIC_SITE } from "@/lib/client/env";
import { RichText } from "./RichText";

type Msg = { role: "user" | "assistant" | "event"; content: string; error?: boolean };

type Props = {
  hand: Hand;
  /** Kullanıcının seçimi; undefined ise henüz cevap vermedi */
  chosen?: number;
  /** Dışarıdan soru göndermek için (ör. sonuç çubuğundaki "Neden?") */
  trigger?: { id: number; text: string };
};

/**
 * Masanın yanındaki koç sohbeti. Sohbet o ele aittir; el değişince sıfırlanır.
 * Yanıtlar kısa tutulur; konu bu el ve poker ile sınırlıdır (sunucudaki talimat).
 */
export function CoachChat({ hand, chosen, trigger }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef(0);
  const answered = chosen !== undefined;

  // El değişince sohbeti sıfırla
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [hand.id]);

  // Cevap verildiğinde sohbete küçük bir not düş
  useEffect(() => {
    if (chosen === undefined) return;
    const ok = chosen === hand.correct;
    setMessages((m) => [
      ...m,
      {
        role: "event",
        content: ok
          ? `Seçimin: ${hand.options[chosen]} · Doğru`
          : `Seçimin: ${hand.options[chosen]} · Doğru hamle: ${hand.options[hand.correct]}`,
      },
    ]);
  }, [chosen, hand]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");

    if (STATIC_SITE) {
      const isWhy = /neden/i.test(q) && answered;
      setMessages((m) => [
        ...m,
        { role: "user", content: q },
        {
          role: "assistant",
          content: isWhy
            ? hand.reasoning
            : answered
              ? "Yapay zeka sohbeti bu demo sürümünde kapalı. “Neden?” ile bu elin kısa açıklamasını görebilirsin."
              : "Yapay zeka sohbeti bu demo sürümünde kapalı. Cevabını verdikten sonra “Neden?” ile kısa açıklamayı görebilirsin.",
        },
      ]);
      return;
    }

    setBusy(true);
    const history = messages
      .filter((m) => m.role !== "event" && !m.error)
      .slice(-8)
      .map(({ role, content }) => ({ role: role as "user" | "assistant", content }));
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    const update = (patch: Partial<Msg>) =>
      setMessages((m) => [...m.slice(0, -1), { ...m[m.length - 1], ...patch }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history, context: { type: "drill", handId: hand.id, chosen } }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        // F-1 (16. çalışma): asistan yapılandırılmamışsa (503) "Neden?" sorusuna elin yazılı gerekçesi gösterilir;
        // aksi halde sunuculu kurulumda gerekçe hiç görünmüyordu.
        if (res.status === 503 && answered && /neden/i.test(q)) {
          update({ content: hand.reasoning });
          return;
        }
        update({ content: data.error || "Koç şu an yanıt veremiyor.", error: true });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let out = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value, { stream: true });
        update({ content: out });
      }
    } catch {
      update({ content: "Bağlantı kurulamadı. Yeniden dener misin?", error: true });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (trigger && trigger.id !== lastTrigger.current) {
      lastTrigger.current = trigger.id;
      void ask(trigger.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.id]);

  const askedWhy = messages.some((m) => m.role === "user" && /^neden/i.test(m.content));
  const chips = answered ? (askedWhy ? [] : ["Neden?"]) : STATIC_SITE ? [] : ["İpucu ver"];

  return (
    <section aria-label="Koç sohbeti" className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2.5 border-b border-t-line px-4 py-3">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-t-accent/15 text-t-accent">
          ✦
        </span>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-t-ink">Koç</h2>
          <p className="text-xs text-t-muted">Bu el hakkında kısa sor, kısa cevap al</p>
        </div>
      </header>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3" aria-live="polite">
        {messages.length === 0 && (
          <p className="my-auto text-center text-sm text-t-muted">
            {answered
              ? "“Neden?”e dokun ya da aklındakini yaz."
              : "Kararını ver. Takılırsan buradan sorabilirsin; cevabı söylemeden ipucu verir."}
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "event" ? (
            <p key={i} className="self-center rounded-full bg-t-panel-2 px-3 py-1 text-center text-xs font-semibold text-t-muted">
              {m.content}
            </p>
          ) : m.role === "user" ? (
            <p key={i} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-t-accent px-3.5 py-2 text-[15px] font-medium text-[#03130b]">
              {m.content}
            </p>
          ) : (
            <div
              key={i}
              className={`max-w-[92%] self-start rounded-2xl rounded-bl-md px-3.5 py-2 text-[15px] leading-relaxed ${
                m.error ? "bg-[#3a1c1c] text-[#ffb4ab]" : "bg-t-panel-2 text-t-ink"
              }`}
            >
              {m.content ? m.error ? m.content : <RichText text={m.content} /> : <span className="text-t-muted">Yazıyor…</span>}
            </div>
          ),
        )}
      </div>

      <div className="border-t border-t-line p-3">
        {chips.length > 0 && (
          <div className="mb-2 flex gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy}
                onClick={() => void ask(c)}
                className="inline-flex min-h-11 items-center rounded-full border border-t-accent/60 bg-t-accent/10 px-4 text-sm font-bold text-t-accent transition hover:bg-t-accent/20"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            autoComplete="off"
            placeholder="Bu el hakkında sor…"
            className="min-h-11 w-full rounded-xl border border-t-line bg-t-panel-2 px-3.5 text-[15px] text-t-ink placeholder:text-t-muted focus:border-t-accent"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Gönder"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-t-accent text-[#03130b] transition disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
