"use client";

import { useEffect, useRef, useState } from "react";
import { STATIC_SITE } from "@/lib/client/env";
import { RichText } from "./RichText";
import { ButonBaglanti, Ikon } from "./ui";

export type AiContext =
  | { type: "hand"; handId: string }
  | {
      type: "form";
      game?: "cash" | "turnuva";
      heroPos?: string;
      hero?: string;
      board?: string;
      stackBB?: number;
      villain?: string;
      actions?: string;
    }
  | { type: "practice"; attempts: { handId: string; chosen: number }[] }
  | { type: "range"; mode: "cash" | "push"; position: string; stackBB?: string; hands: string[] };

type Msg = { role: "user" | "assistant"; content: string; detailed?: boolean; error?: boolean };

type Props = {
  title?: string;
  context?: AiContext;
  /** Tek dokunuşla sorulabilecek hazır sorular */
  suggestions?: string[];
  placeholder?: string;
  /** Değiştiğinde bu soru otomatik gönderilir (ör. "Analiz et" butonu) */
  autoAsk?: { id: number; question: string };
};

export function AiPanel({ title = "Yapay zekaya sor", context, suggestions = [], placeholder, autoAsk }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastAuto = useRef(0);

  async function ask(question: string, detailed = false) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "", detailed }]);

    const update = (patch: Partial<Msg>) =>
      setMessages((m) => [...m.slice(0, -1), { ...m[m.length - 1], ...patch }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, detailed, history: history.slice(-8), context }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        update({ content: data.error || "Asistan şu an yanıt veremiyor.", error: true });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        update({ content: text });
      }
    } catch {
      update({ content: "Bağlantı kurulamadı. İnternetini kontrol edip yeniden dener misin?", error: true });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoAsk && autoAsk.id !== lastAuto.current) {
      lastAuto.current = autoAsk.id;
      void ask(autoAsk.question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk?.id]);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  if (STATIC_SITE) {
    // Pages sürümü: yapay zeka yok. Panel kendini asistan gibi göstermez; masadaki koça ve öğrenme yoluna yönlendirir.
    return (
      <section className="card" aria-labelledby="ai-kapali">
        <h2 id="ai-kapali" className="h2 flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-soft text-accent-text">
            <Ikon ad="sohbet" boyut={18} />
          </span>
          Takıldığın bir yer mi var?
        </h2>
        <p className="mt-2 text-muted">
          Yapay zeka asistanı bu sürümde kapalı; bir sunucu ve API anahtarı gerektirir. Masadaki koç ise çalışır: kararından
          sonra “Neden?”e dokun, spotun gerekçesini kısaca anlatsın.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButonBaglanti href="/alistirma">Masada koça sor</ButonBaglanti>
          <ButonBaglanti href="/ogren" tur="hayalet">
            Öğrenme yolu
          </ButonBaglanti>
        </div>
      </section>
    );
  }

  const last = messages[messages.length - 1];
  const canDeepen = !busy && last?.role === "assistant" && !last.detailed && !last.error && !!last.content;

  return (
    <section className="card flex flex-col gap-3" aria-label={title}>
      <h2 className="h2 flex items-center gap-2">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-soft text-accent-text">
          <Ikon ad="sohbet" boyut={18} />
        </span>
        {title}
      </h2>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" className="btn justify-start text-left" onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-3" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3 py-2 text-accent-ink">
                {m.content}
              </p>
            ) : (
              <div
                key={i}
                className={`max-w-[95%] rounded-2xl rounded-bl-md px-3 py-2 ${
                  m.error ? "bg-danger-soft text-danger" : "bg-soft"
                }`}
              >
                {m.content ? (
                  m.error ? <p>{m.content}</p> : <RichText text={m.content} />
                ) : (
                  <p className="text-muted">Düşünüyor…</p>
                )}
              </div>
            ),
          )}
          {canDeepen && (
            <button type="button" className="btn self-start" onClick={() => ask("Bunu detaylı anlatır mısın?", true)}>
              Detaylı anlat
            </button>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <label htmlFor="ai-soru" className="sr-only">
          Sorun
        </label>
        <input
          id="ai-soru"
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1500}
          placeholder={placeholder ?? "Sorunu yaz…"}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !input.trim()}>
          Sor
        </button>
      </form>
      <p className="text-xs text-muted">
        Yanıtlar çalışma amaçlıdır ve varsayımlara dayanır; kesin doğru değildir. Altı noktalı terimler sözlüğe gider.
      </p>
    </section>
  );
}
