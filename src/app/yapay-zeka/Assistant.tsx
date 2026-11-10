"use client";

import Link from "next/link";
import { useState } from "react";
import { AiPanel, type AiContext } from "@/components/AiPanel";
import { CardRow } from "@/components/Cards";
import { POSITIONS } from "@/data/hands";
import { isCardString } from "@/lib/poker/cards";
import { useProgress } from "@/lib/client/store";

type Mode = "serbest" | "form" | "sonuc";

export function Assistant() {
  const progress = useProgress();
  const [mode, setMode] = useState<Mode>("serbest");
  const [form, setForm] = useState({ game: "cash", heroPos: "", hero: "", board: "", stackBB: "", villain: "", actions: "" });
  const [analyze, setAnalyze] = useState(0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const hero = form.hero.replace(/\s+/g, "");
  const board = form.board.replace(/\s+/g, "");
  const heroOk = !hero || (isCardString(hero) && hero.length === 4);
  const boardOk = !board || (isCardString(board) && [6, 8, 10].includes(board.length));

  const formContext: AiContext = {
    type: "form",
    game: form.game as "cash" | "turnuva",
    heroPos: form.heroPos || undefined,
    hero: heroOk && hero ? hero : undefined,
    board: boardOk && board ? board : undefined,
    stackBB: Number(form.stackBB) > 0 ? Number(form.stackBB) : undefined,
    villain: form.villain || undefined,
    actions: form.actions || undefined,
  };

  const recent = progress.attempts.slice(0, 100);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Soru türü" className="flex flex-wrap gap-2">
        {(
          [
            ["serbest", "Serbest soru"],
            ["form", "El formu"],
            ["sonuc", "Alıştırma analizim"],
          ] as [Mode, string][]
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={mode === v} className={`chip ${mode === v ? "chip-on" : ""}`} onClick={() => setMode(v)}>
            {l}
          </button>
        ))}
      </div>

      {mode === "serbest" && (
        <div className="mx-auto w-full max-w-2xl">
          <AiPanel
            key="serbest"
            suggestions={[
              "Pot odds nedir, nasıl hesaplarım?",
              "Butonda neden daha çok elle oynanır?",
              "BTN'deyim, 40 BB stack, elimde A♠J♦. CO 2.5 BB açtı. Ne yapmalıyım?",
              "Bubble'da orta stack ile nasıl oynamalıyım?",
            ]}
            placeholder="Örn: SB'de KQo ile 3-bet'e ne yapmalıyım?"
          />
        </div>
      )}

      {mode === "form" && (
        <div className="grid items-start gap-4 md:grid-cols-2">
          <section className="card flex flex-col gap-3" aria-label="El bilgileri">
            <h2 className="h2">Elini anlat</h2>
            <p className="text-sm text-muted">Bildiğin alanları doldur; eksik kalırsa asistan sorar.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="g" className="label">Oyun</label>
                <select id="g" className="field" value={form.game} onChange={set("game")}>
                  <option value="cash">Cash game</option>
                  <option value="turnuva">Turnuva</option>
                </select>
              </div>
              <div>
                <label htmlFor="p" className="label">Pozisyonun</label>
                <select id="p" className="field" value={form.heroPos} onChange={set("heroPos")}>
                  <option value="">Seç</option>
                  {POSITIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="h" className="label">Kartların</label>
                <input id="h" className="field" value={form.hero} onChange={set("hero")} placeholder="AsKd" maxLength={6} aria-describedby="kart-yardim" aria-invalid={!heroOk} />
              </div>
              <div>
                <label htmlFor="s" className="label">Efektif stack (BB)</label>
                <input id="s" className="field" inputMode="decimal" value={form.stackBB} onChange={set("stackBB")} placeholder="100" maxLength={5} />
              </div>
            </div>
            <div>
              <label htmlFor="b" className="label">Board (varsa)</label>
              <input id="b" className="field" value={form.board} onChange={set("board")} placeholder="Kh7d2c" maxLength={14} aria-describedby="kart-yardim" aria-invalid={!boardOk} />
            </div>
            <p id="kart-yardim" className="text-xs text-muted">
              Kart yazımı: değer + renk. s = ♠ maça, h = ♥ kupa, d = ♦ karo, c = ♣ sinek. Örn: AsKd, Th9h.
            </p>
            {(!heroOk || !boardOk) && (
              <p className="text-sm text-danger" role="alert">
                {!heroOk ? "Kartların iki kart olmalı (ör. AsKd). " : ""}
                {!boardOk ? "Board 3, 4 ya da 5 kart olmalı (ör. Kh7d2c)." : ""}
              </p>
            )}
            {((heroOk && hero) || (boardOk && board)) && (
              <div className="flex flex-wrap gap-4">
                {heroOk && hero && <CardRow cards={hero} small />}
                {boardOk && board && <CardRow cards={board} small />}
              </div>
            )}
            <div>
              <label htmlFor="v" className="label">Rakip (pozisyon, tarz)</label>
              <input id="v" className="field" value={form.villain} onChange={set("villain")} placeholder="CO, sıkı oynuyor" maxLength={200} />
            </div>
            <div>
              <label htmlFor="a" className="label">Ne oldu?</label>
              <textarea id="a" className="field min-h-24" value={form.actions} onChange={set("actions")} maxLength={800} placeholder="CO 2.5 BB açtı, ben butondan call ettim. Flop'ta check etti, ben…" />
            </div>
          </section>

          <div className="md:sticky md:top-20">
            <AiPanel
              key="form"
              title="Bu eli sor"
              context={formContext}
              suggestions={["Bu eli doğru oynadım mı?", "Bu spotta en iyi hamle ne olurdu?"]}
              placeholder="Bu el hakkında sorun…"
            />
          </div>
        </div>
      )}

      {mode === "sonuc" && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {!progress.ready ? (
            <p className="card text-muted">Yükleniyor…</p>
          ) : recent.length === 0 ? (
            <div className="card">
              <p>Henüz çözülmüş alıştırman yok.</p>
              <Link href="/alistirma" className="btn btn-primary mt-3">
                Alıştırmaya başla
              </Link>
            </div>
          ) : (
            <>
              <div className="card">
                <p>
                  Son <strong>{recent.length}</strong> cevabın: {recent.filter((a) => a.correct).length} doğru,{" "}
                  {recent.filter((a) => !a.correct).length} yanlış.
                </p>
                {analyze === 0 && (
                  <button type="button" className="btn btn-primary btn-lg mt-3 w-full" onClick={() => setAnalyze(Date.now())}>
                    Sonuçlarımı analiz et
                  </button>
                )}
              </div>
              <AiPanel
                key="sonuc"
                title="Alıştırma analizi"
                context={{ type: "practice", attempts: recent.map((a) => ({ handId: a.handId, chosen: a.chosen })) }}
                autoAsk={analyze ? { id: analyze, question: "Alıştırma sonuçlarımı analiz eder misin?" } : undefined}
                placeholder="Sonuçların hakkında sor…"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
