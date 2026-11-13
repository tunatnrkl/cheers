"use client";

import Link from "next/link";
import { type DepoDurumu, bozukNotuKapat, ogrenGuncelle } from "@/lib/ogren/depo";
import { bugunSayaci, hedefAyarla, pistOzeti, seriGorunen, tekrarOner } from "@/lib/ogren/ilerleme";
import { type Kaynak, ogrenAdresi } from "@/lib/ogren/veri";
import { Simge } from "./Simge";

/** Seri metni: nötr; kopmuş seri için kayıp ya da suç dili yok. */
export function seriMetni(sayi: number, bugunTamam: boolean, dahaOnceVar: boolean): string {
  if (bugunTamam) return "Bugünkü ders tamam.";
  if (sayi > 0) return "Bugün bir ders, seriyi sürdürür.";
  return dahaOnceVar ? "Bugün bir ders, seriyi yeniden başlatır." : "Bugün bir ders, seriyi başlatır.";
}

export function OrnekNotu() {
  return (
    <p className="rounded-xl border border-dashed border-accent/60 bg-soft px-3 py-2 text-sm text-ink">
      <strong>Örnek veri.</strong> Bu görünüm geliştirme ve deneme içindir; ilerleme gerçek yolundan ayrı tutulur.{" "}
      <Link href="/ogren" className="link inline-flex min-h-11 items-center">
        Gerçek yola dön
      </Link>
    </p>
  );
}

export function BozukNot({ anahtar }: { anahtar: string }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
      <Simge ad="bilgi" boyut={20} className="mt-0.5 shrink-0 text-accent-text" />
      <p className="flex-1">
        Kayıtlı öğrenme ilerlemesi okunamadı, bu yüzden yol baştan başlıyor. Eski kayıt tarayıcında yedek olarak duruyor.
      </p>
      <button type="button" className="btn btn-ghost -my-1 min-h-11 px-3" onClick={() => bozukNotuKapat(anahtar)}>
        Tamam
      </button>
    </div>
  );
}

export function AnaEkran({ k, depo }: { k: Kaynak; depo: DepoDurumu }) {
  const simdi = new Date();
  const { durum } = depo;
  const seri = seriGorunen(durum.seri, simdi);
  const bugun = bugunSayaci(durum, simdi);
  const tekrar = tekrarOner(k.dz, durum, simdi);
  const tekrarDers = tekrar ? k.dz.dersler.get(tekrar) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">Öğren</p>
        <h1 className="h1 mt-2">Öğrenme yolu</h1>
        <p className="lead mt-2 max-w-2xl">
          Kısa dersler, hemen ardından alıştırma. Bir pist seç; kaldığın yerden devam edersin. Hesap gerekmez, ilerlemen bu tarayıcıda durur.
        </p>
      </header>

      {k.ornek && <OrnekNotu />}
      {depo.bozukNot && <BozukNot anahtar={k.anahtar} />}
      {depo.yazilamadi && (
        <p role="status" className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
          Tarayıcın ilerlemeyi kaydetmeye izin vermiyor (gizli sekme ya da dolu depo olabilir). Bu oturumda çalışmaya devam edebilirsin.
        </p>
      )}

      <section aria-label="Bugün" className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-soft text-accent-text">
            <Simge ad="ates" boyut={26} kalin={1.8} />
          </span>
          <div>
            <p className="text-lg font-bold">
              Günlük seri: <span className="tabular-nums">{seri.sayi}</span> gün
            </p>
            <p className="text-sm text-muted">{seriMetni(seri.sayi, seri.bugunTamam, durum.seri.gun !== null)}</p>
          </div>
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold">
            Günlük hedef · bugün <span className="tabular-nums">{Math.min(bugun.ders, bugun.hedef)}/{bugun.hedef}</span> ders
          </legend>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={durum.hedef === n}
                className={`chip min-w-11 justify-center ${durum.hedef === n ? "chip-on" : ""}`}
                onClick={() => ogrenGuncelle(k.anahtar, (d) => hedefAyarla(d, n))}
              >
                {n} ders
              </button>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-muted sm:text-right">
          Toplam <strong className="text-ink tabular-nums">{durum.xp}</strong> XP
          <br />
          bugün <span className="tabular-nums">{bugun.xp}</span> XP
        </p>
      </section>

      {tekrarDers && (
        <section aria-label="Bugünün tekrarı" className="card flex flex-col gap-3 border-accent/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-soft text-accent-text">
              <Simge ad="tekrar" boyut={24} />
            </span>
            <div>
              <p className="font-bold">Bugünün tekrarı: {tekrarDers.baslik}</p>
              <p className="text-sm text-muted">Birkaç kısa soru; önce geçen sefer zorlandıkların gelir. Günde bir öneri.</p>
            </div>
          </div>
          <Link href={ogrenAdresi({ ders: tekrar, mod: "tekrar", ornek: k.ornek })} className="btn btn-primary">
            Tekrarı başlat
          </Link>
        </section>
      )}

      <ul className="grid gap-4 md:grid-cols-2" aria-label="Pistler">
        {k.dz.m.pistler.map((p) => {
          const o = pistOzeti(k.dz, durum, p.kimlik);
          const siradaki = o.siradaki ? k.dz.dersler.get(o.siradaki) : undefined;
          const basladi = o.tamam > 0;
          return (
            <li key={p.kimlik}>
              <Link
                href={ogrenAdresi({ pist: p.kimlik, ornek: k.ornek })}
                className="card group flex h-full flex-col gap-4 transition hover:border-accent/60"
                aria-label={`${p.baslik} pisti: yüzde ${o.yuzde} tamamlandı, ${o.tamam}/${o.toplam} ders, seviye ${o.seviye}. Yol haritasını aç.`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[28px] leading-none font-bold tracking-wide uppercase">{p.baslik}</p>
                    <p className="mt-2 text-sm text-muted">{p.aciklama}</p>
                  </div>
                  <div className="og-halka" style={{ "--yuzde": o.yuzde } as React.CSSProperties} aria-hidden="true">
                    <span>%{o.yuzde}</span>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-xs text-muted">Ders</dt>
                    <dd className="font-bold tabular-nums">
                      {o.tamam}/{o.toplam}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-xs text-muted">Seviye</dt>
                    <dd className="font-bold tabular-nums">{o.seviye}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-xs text-muted">Bugün</dt>
                    <dd className="font-bold tabular-nums">
                      {Math.min(bugun.ders, bugun.hedef)}/{bugun.hedef} · {seri.sayi} gün
                    </dd>
                  </div>
                </dl>
                <div className="og-cubuk" aria-hidden="true">
                  <span style={{ width: `${o.yuzde}%` }} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm">
                    {siradaki ? (
                      <>
                        <span className="text-muted">Sıradaki: </span>
                        <strong className="font-semibold">{siradaki.baslik}</strong>
                      </>
                    ) : o.toplam === 0 ? (
                      <span className="text-muted">Dersler hazırlanıyor.</span>
                    ) : o.hazirlaniyor ? (
                      <span className="text-muted">Yazılan derslerin hepsi bitti; yolun devamı hazırlanıyor.</span>
                    ) : (
                      <span className="text-muted">Bu pistin bütün dersleri tamam.</span>
                    )}
                  </p>
                  <span className="btn btn-primary shrink-0" aria-hidden="true">
                    {basladi ? "Devam et" : o.toplam ? "Başla" : "Yola bak"}
                    <Simge ad="ok" boyut={18} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
