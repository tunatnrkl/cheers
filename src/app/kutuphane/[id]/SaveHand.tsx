"use client";

import { useEffect, useState } from "react";
import { saveHand, unsaveHand, useProgress } from "@/lib/client/store";

export function SaveHand({ handId }: { handId: string }) {
  const { ready, saved } = useProgress();
  const entry = saved.find((s) => s.handId === handId);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (entry) setNote(entry.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.handId]);

  async function run(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      setStatus(ok);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Kaydedilemedi.");
    }
  }

  return (
    <section className="card" aria-label="Kaydet ve not al">
      <label htmlFor="not" className="label">
        Notun
      </label>
      <textarea
        id="not"
        className="field min-h-20"
        maxLength={2000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Bu elden aklında kalması gereken ne?"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => run(() => saveHand(handId, note), "Kaydedildi.")}>
          {entry ? "Notu güncelle" : "Eli kaydet"}
        </button>
        {entry && (
          <button type="button" className="btn" onClick={() => run(() => unsaveHand(handId), "Kayıt kaldırıldı.")}>
            Kaydı kaldır
          </button>
        )}
      </div>
      <p className="mt-2 min-h-5 text-sm text-muted" role="status">
        {status}
      </p>
    </section>
  );
}
