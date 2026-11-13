"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ogrenGuncelle, ogrenSifirla, useOgren } from "@/lib/ogren/depo";
import { ANAHTAR, type Durum, disaAktar, iceAktar, pistOzeti, seriGorunen, zayifDersler } from "@/lib/ogren/ilerleme";
import { GERCEK, ogrenAdresi } from "@/lib/ogren/veri";

/** Profilde "Öğrenme yolu" kartı: ilerleme, seri, seviye, zayıf konular; dışa/içe aktar, sıfırla. */
export function Learning() {
  const depo = useOgren(ANAHTAR);
  const [onay, setOnay] = useState<null | "sifirla" | { durum: Durum; ad: string }>(null);
  const [mesaj, setMesaj] = useState("");
  const dosya = useRef<HTMLInputElement>(null);

  if (!depo.hazir) return null;
  const simdi = new Date();
  const { durum } = depo;
  const seri = seriGorunen(durum.seri, simdi);
  const zayif = zayifDersler(GERCEK, durum);
  const pistler = GERCEK.m.pistler.map((p) => ({ p, o: pistOzeti(GERCEK, durum, p.kimlik) }));

  function indir() {
    const blob = new Blob([disaAktar(durum, new Date())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cheers-ogrenme-yolu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMesaj("İlerleme dosyası indirildi.");
  }

  async function sec(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const metin = await f.text().catch(() => "");
    const s = iceAktar(metin);
    if (!s.ok) {
      setOnay(null);
      setMesaj(`Dosya içe aktarılamadı: ${s.hata}`);
      return;
    }
    setMesaj("");
    setOnay({ durum: s.durum, ad: f.name });
  }

  return (
    <section className="card" aria-labelledby="ogrenme-yolu">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ogrenme-yolu" className="h2">
          Öğrenme yolu
        </h2>
        <Link href="/ogren" className="link inline-flex min-h-11 items-center text-sm">
          Yola git →
        </Link>
      </div>
      {depo.bozukNot && <p className="mt-1 text-sm">Kayıtlı öğrenme ilerlemesi okunamadı; yol baştan başladı. Eski kayıt tarayıcında yedekte duruyor.</p>}

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {pistler.map(({ p, o }) => (
          <div key={p.kimlik} className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted">{p.baslik}</dt>
            <dd className="font-bold tabular-nums">{o.toplam ? `%${o.yuzde} · ${o.tamam}/${o.toplam} ders` : "Dersler hazırlanıyor"}</dd>
            <dd className="text-xs text-muted">Seviye {o.seviye}</dd>
          </div>
        ))}
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">Günlük seri</dt>
          <dd className="font-bold tabular-nums">{seri.sayi} gün</dd>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">Toplam</dt>
          <dd className="font-bold tabular-nums">{durum.xp} XP</dd>
        </div>
      </dl>

      <div className="mt-3 text-sm">
        {zayif.length ? (
          <>
            <p className="font-semibold">Zayıf kalan dersler</p>
            <ul className="mt-1 flex flex-col">
              {zayif.map((z) => (
                <li key={z.kimlik}>
                  <Link href={ogrenAdresi({ ders: z.kimlik, mod: "tekrar" })} className="link inline-flex min-h-11 items-center">
                    {z.baslik} (%{Math.round(z.oran * 100)}) · tekrar et
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted">Belirgin bir zayıf ders yok. Ders bitirdikçe burası dolar.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={indir}>
          Dışa aktar (JSON)
        </button>
        <button type="button" className="btn" onClick={() => dosya.current?.click()}>
          İçe aktar
        </button>
        <input ref={dosya} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={sec} />
        <button type="button" className="btn btn-ghost" onClick={() => setOnay("sifirla")}>
          Sıfırla
        </button>
      </div>

      {onay && (
        <div role="alertdialog" aria-labelledby="ogren-onay" className="mt-3 flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3 sm:flex-row sm:items-center">
          <p id="ogren-onay" className="flex-1 text-sm">
            {onay === "sifirla"
              ? "Öğrenme yolundaki bütün ilerleme silinsin mi? Alıştırma masası kayıtların etkilenmez. Önce dışa aktarmak isteyebilirsin."
              : `"${onay.ad}" mevcut öğrenme ilerlemesinin yerine geçsin mi?`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (onay === "sifirla") {
                  ogrenSifirla(ANAHTAR);
                  setMesaj("Öğrenme yolu sıfırlandı.");
                } else {
                  const yeni = onay.durum;
                  ogrenGuncelle(ANAHTAR, () => yeni);
                  setMesaj("İlerleme içe aktarıldı.");
                }
                setOnay(null);
              }}
            >
              {onay === "sifirla" ? "Evet, sıfırla" : "Evet, içe aktar"}
            </button>
            <button type="button" className="btn" onClick={() => setOnay(null)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 text-sm" role="status" aria-live="polite">
        {mesaj}
      </p>
    </section>
  );
}
