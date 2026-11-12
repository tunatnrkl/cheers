"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { HAND_BY_ID, TOPICS } from "@/data/hands";
import {
  clearLocal,
  deleteAccount,
  signIn,
  signOut,
  topicStats,
  unsaveHand,
  useProgress,
  weakTopics,
  type Attempt,
  type Saved,
} from "@/lib/client/store";
import { Growth } from "./Growth";
import { Learning } from "./Learning";

function download(name: string, mime: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function exportData(format: "csv" | "json", attempts: Attempt[], saved: Saved[]) {
  const rows = attempts.map((a) => {
    const h = HAND_BY_ID.get(a.handId);
    return {
      tarih: a.at,
      el: h?.title ?? a.handId,
      konu: TOPICS[a.topic] ?? a.topic,
      secim: h?.options[a.chosen] ?? a.chosen,
      onerilen: h ? h.options[h.correct] : "",
      dogru: a.correct ? "evet" : "hayır",
    };
  });
  const notes = saved.map((s) => ({ tarih: s.at, el: HAND_BY_ID.get(s.handId)?.title ?? s.handId, not: s.note }));
  const day = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    download(`poker-defteri-${day}.json`, "application/json", JSON.stringify({ alistirmalar: rows, kaydedilenEller: notes }, null, 2));
    return;
  }
  const lines = [
    ["tur", "tarih", "el", "konu", "secim", "onerilen", "dogru", "not"].join(","),
    ...rows.map((r) => ["alistirma", r.tarih, r.el, r.konu, r.secim, r.onerilen, r.dogru, ""].map(csvCell).join(",")),
    ...notes.map((n) => ["kayitli-el", n.tarih, n.el, "", "", "", "", n.not].map(csvCell).join(",")),
  ];
  // BOM: Excel Türkçe karakterleri doğru göstersin
  download(`poker-defteri-${day}.csv`, "text/csv;charset=utf-8", "﻿" + lines.join("\n"));
}

function AuthCard({ google }: { google: boolean }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register" && !consent) {
      setError("Devam etmek için 18 yaş beyanını ve aydınlatma metnini onaylaman gerekiyor.");
      return;
    }
    setBusy(true);
    try {
      await signIn(mode, mode === "register" ? { email, password, consent: true } : { email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-label="Giriş">
      <div role="tablist" aria-label="Hesap" className="flex gap-2">
        {(
          [
            ["login", "Giriş yap"],
            ["register", "Hesap oluştur"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={mode === v} className={`chip flex-1 justify-center ${mode === v ? "chip-on" : ""}`} onClick={() => setMode(v)}>
            {l}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="label">E-posta</label>
          <input id="email" type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sifre" className="label">Şifre</label>
          <input
            id="sifre"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={mode === "register" ? "sifre-yardim" : undefined}
          />
          {mode === "register" && (
            <p id="sifre-yardim" className="mt-1 text-xs text-muted">En az 8 karakter.</p>
          )}
        </div>
        {mode === "register" && (
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 size-5 shrink-0 accent-(--accent)" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              18 yaşından büyüğüm ve{" "}
              <Link href="/gizlilik" className="link">aydınlatma metnini</Link> okudum; verilerimin ilerlememi kaydetmek için işlenmesini kabul ediyorum.
            </span>
          </label>
        )}
        {error && (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p>
        )}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? "Bekle…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </form>

      {google && (
        <>
          <p className="my-3 text-center text-sm text-muted">ya da</p>
          <a href="/api/auth/google" className="btn btn-lg w-full">
            Google ile devam et
          </a>
          <p className="mt-2 text-xs text-muted">
            Google ile devam ederek 18 yaşından büyük olduğunu ve{" "}
            <Link href="/gizlilik" className="link">aydınlatma metnini</Link> kabul ettiğini beyan edersin.
          </p>
        </>
      )}
    </section>
  );
}

export function Profile() {
  const p = useProgress();
  const params = useSearchParams();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!p.ready) return <p className="card text-muted">Yükleniyor…</p>;

  // Üyede toplamlar sunucudan gelir; liste 5000 cevapta kesildiği için listeden sayılmaz (G-1).
  const total = p.totals?.total ?? p.attempts.length;
  const ok = p.totals?.ok ?? p.attempts.filter((a) => a.correct).length;
  const stats = topicStats(p.attempts);
  const weak = weakTopics(stats);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">{p.user ? `Merhaba${p.user.displayName ? `, ${p.user.displayName}` : ""}` : "Profil"}</h1>
        <p className="lead mt-1">
          {p.user
            ? p.user.email
            : "İlerlemen şu an yalnızca bu cihazda saklanıyor. Hesap açarsan tüm cihazlarında görürsün."}
        </p>
      </header>

      {params.get("hata") === "google" && (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-danger" role="alert">
          Google ile giriş tamamlanamadı. Yeniden deneyebilir ya da e-posta ile giriş yapabilirsin.
        </p>
      )}

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <section className="card" aria-label="Özet">
            <h2 className="h2">İlerleme</h2>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["Çözülen soru", total],
                ["Doğruluk", total ? `%${Math.round((ok / total) * 100)}` : "—"],
                ["Kaydedilen el", p.saved.length],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-soft px-2 py-3">
                  <dd className="text-2xl font-bold">{v}</dd>
                  <dt className="text-xs text-muted">{k}</dt>
                </div>
              ))}
            </dl>

            {total === 0 ? (
              <div className="mt-4">
                <p className="text-muted">Henüz alıştırma çözmedin.</p>
                <Link href="/alistirma" className="btn btn-primary mt-3">İlk alıştırmanı yap</Link>
              </div>
            ) : (
              <>
                <h3 className="mt-5 font-semibold">Konu bazında doğruluk</h3>
                <ul className="mt-2 space-y-3">
                  {stats.map((s) => (
                    <li key={s.topic}>
                      <div className="flex justify-between text-sm">
                        <span>{TOPICS[s.topic]}</span>
                        <span className="font-semibold">%{Math.round(s.rate * 100)} <span className="font-normal text-muted">({s.ok}/{s.total})</span></span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft" aria-hidden="true">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${s.rate * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl bg-soft p-3">
                  <p className="font-semibold">Çalışma önerisi</p>
                  {weak.length ? (
                    <p className="mt-1 text-sm">
                      Zayıf konun: <strong>{weak.slice(0, 2).map((w) => TOPICS[w.topic]).join(", ")}</strong>.{" "}
                      <Link href={`/alistirma?konu=${weak[0].topic}`} className="link">Bu spotu masada çalış</Link>; hatalar tekrar karşına çıkar.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm">Belirgin bir zayıf konu yok. Daha fazla soru çözdükçe tablo netleşir.</p>
                  )}
                  <Link href="/yapay-zeka" className="link mt-2 inline-flex min-h-11 items-center text-sm">
                    Yapay zekadan ayrıntılı analiz iste →
                  </Link>
                </div>
              </>
            )}
          </section>

          {total > 0 && <Growth attempts={p.attempts} total={total} />}
          <Learning />

          <section className="card" aria-label="Veri">
            <h2 className="h2">Verilerin</h2>
            <p className="mt-1 text-sm text-muted">Alıştırma cevaplarını, kayıtlı ellerini ve notlarını indirebilirsin.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => exportData("csv", p.attempts, p.saved)}>CSV indir</button>
              <button type="button" className="btn" onClick={() => exportData("json", p.attempts, p.saved)}>JSON indir</button>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              {p.user ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn" onClick={() => void signOut()}>Çıkış yap</button>
                  {!confirmDelete ? (
                    <button type="button" className="btn text-danger" onClick={() => setConfirmDelete(true)}>Hesabımı sil</button>
                  ) : (
                    <div className="w-full rounded-xl bg-danger-soft p-3">
                      <p className="text-sm text-danger">Hesabın, tüm cevapların ve notların kalıcı olarak silinecek. Bu geri alınamaz.</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="btn border-danger text-danger" onClick={() => void deleteAccount()}>Evet, sil</button>
                        <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>Vazgeç</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                (total > 0 || p.saved.length > 0) && (
                  <button type="button" className="btn text-danger" onClick={() => confirm("Bu cihazdaki ilerleme silinsin mi?") && clearLocal()}>
                    Bu cihazdaki verileri sil
                  </button>
                )
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {!p.user &&
            (p.accounts ? (
              <AuthCard google={p.google} />
            ) : (
              <p className="card text-sm text-muted">
                Bu kurulumda hesap sistemi kapalı (veritabanı bağlı değil). İlerlemen bu cihazda saklanmaya devam eder.
              </p>
            ))}

          <section className="card" aria-label="Kaydedilen eller">
            <h2 className="h2">Kaydedilen eller</h2>
            {p.saved.length === 0 ? (
              <p className="mt-2 text-muted">
                Henüz kayıtlı el yok. Alıştırma masasında yer imi simgesine dokunarak bir eli buraya ekleyebilirsin.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {p.saved.map((s) => (
                  <li key={s.handId} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/alistirma?el=${s.handId}`} className="link">
                        {HAND_BY_ID.get(s.handId)?.title ?? s.handId}
                      </Link>
                      {s.note && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">{s.note}</p>}
                    </div>
                    <button type="button" className="btn shrink-0" aria-label="Kaydı kaldır" onClick={() => void unsaveHand(s.handId)}>
                      Kaldır
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
