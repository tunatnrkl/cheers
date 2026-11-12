"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Ders, Unite } from "@/lib/mufredat/tipler";
import type { DepoDurumu } from "@/lib/ogren/depo";
import { type DersDurumu, dersDurumu, eksikOnkosullar, pistOzeti, uniteOzeti } from "@/lib/ogren/ilerleme";
import { type Kaynak, ogrenAdresi } from "@/lib/ogren/veri";
import { type PistKimlik, icerikVar, ortakMi, pistGetir, pistUniteleri, tekrarHavuzu, testKapsami } from "@/lib/ogren/yol";
import { BozukNot, OrnekNotu } from "./AnaEkran";
import { DURUM_YAZI, Simge, TUR_YAZI, dugumSimgesi } from "./Simge";

/** Zikzak: düğümler sırayla sağa sola kayar. */
const KAY = [0, 1, 2, 1, 0, -1, -2, -1];

type Props = { k: Kaynak; depo: DepoDurumu; pist: PistKimlik };

export function YolHaritasi({ k, depo, pist }: Props) {
  const { dz } = k;
  const { durum } = depo;
  const p = pistGetir(dz, pist)!;
  const uniteler = useMemo(() => pistUniteleri(dz, pist), [dz, pist]);
  const ozet = pistOzeti(dz, durum, pist);
  const [acik, setAcik] = useState<string | null>(null);

  // Kapsamı belli bir dersi içeren ilk test: kilitli derste "Teste gir" yolu.
  const testler = useMemo(
    () =>
      uniteler
        .flatMap((u) => u.dersler)
        .filter((d) => d.tur === "test" && icerikVar(dz, d))
        .map((d) => ({ kimlik: d.kimlik, kapsam: new Set(testKapsami(dz, d.kimlik)) })),
    [dz, uniteler],
  );

  // Yazılı içeriğin bittiği yer: sonrası "içerik hazırlanıyor".
  const sonDolu = uniteler.findLastIndex((u) => u.dersler.some((d) => icerikVar(dz, d)));
  const simdiki = ozet.siradaki;

  // Yapışkan başlık: üst kenarı başlığın altına ulaşmış son ünite (yoksa ilki).
  const [gorunen, setGorunen] = useState<string | undefined>(uniteler[0]?.kimlik);
  const bantlar = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    let kare = 0;
    const hesapla = () => {
      kare = 0;
      let son: string | undefined = uniteler[0]?.kimlik;
      for (const u of uniteler) {
        const el = bantlar.current.get(u.kimlik);
        if (el && el.getBoundingClientRect().top <= 140) son = u.kimlik;
      }
      setGorunen(son);
    };
    const kaydir = () => {
      if (!kare) kare = requestAnimationFrame(hesapla);
    };
    hesapla();
    window.addEventListener("scroll", kaydir, { passive: true });
    window.addEventListener("resize", kaydir);
    return () => {
      cancelAnimationFrame(kare);
      window.removeEventListener("scroll", kaydir);
      window.removeEventListener("resize", kaydir);
    };
  }, [uniteler]);

  // İlk açılışta şu anki derse kaydır (yalnızca bir kez).
  const kaydi = useRef(false);
  useEffect(() => {
    if (kaydi.current || !simdiki) return;
    kaydi.current = true;
    const el = document.getElementById(`dugum-${simdiki}`);
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) {
      el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [simdiki]);

  const gu = uniteler.find((u) => u.kimlik === gorunen) ?? uniteler[0];
  const guSira = uniteler.indexOf(gu) + 1;
  const guOzet = gu ? uniteOzeti(dz, durum, gu.kimlik) : { tamam: 0, toplam: 0 };
  const guYuzde = guOzet.toplam ? Math.round((100 * guOzet.tamam) / guOzet.toplam) : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <nav aria-label="Öğren içinde">
        <Link href={ogrenAdresi({ ornek: k.ornek })} className="btn btn-ghost -ml-3 px-3">
          <Simge ad="geri" boyut={20} /> Pistler
        </Link>
      </nav>
      <header>
        <p className="eyebrow">Öğrenme yolu</p>
        <h1 className="h1 mt-1">{p.baslik} pisti</h1>
        <p className="mt-2 text-muted">{p.aciklama}</p>
        <p className="mt-3 text-sm">
          <strong className="tabular-nums">%{ozet.yuzde}</strong> tamamlandı · <span className="tabular-nums">{ozet.tamam}/{ozet.toplam}</span> ders ·
          seviye <span className="tabular-nums">{ozet.seviye}</span>
          {ozet.hazirlaniyor && <span className="text-muted"> · yazılmamış dersler hesaba katılmaz</span>}
        </p>
      </header>

      {k.ornek && <OrnekNotu />}
      {depo.bozukNot && <BozukNot anahtar={k.anahtar} />}

      {gu && (
        <div className="og-yapiskan" aria-hidden="true">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm font-bold">
              Ünite {guSira}: {gu.baslik}
            </p>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {guOzet.tamam}/{guOzet.toplam}
            </span>
          </div>
          <div className="og-cubuk mx-auto mt-1.5 max-w-xl">
            <span style={{ width: `${guYuzde}%` }} />
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-8" aria-label={`${p.baslik} pistinin üniteleri`}>
        {uniteler.map((u, ui) => {
          const dolu = u.dersler.some((d) => icerikVar(dz, d));
          const uo = uniteOzeti(dz, durum, u.kimlik);
          return (
            <li key={u.kimlik}>
              <section
                aria-labelledby={`unite-${u.kimlik}`}
                data-unite={u.kimlik}
                ref={(el) => {
                  if (el) bantlar.current.set(u.kimlik, el);
                  else bantlar.current.delete(u.kimlik);
                }}
              >
                <UniteBandi u={u} sira={ui + 1} tamam={uo.tamam} toplam={uo.toplam} dolu={dolu} />
                {dolu ? (
                  <ol className="og-yol" aria-label={`Ünite ${ui + 1} dersleri`}>
                    {u.dersler.map((d, di) => (
                      <Dugum
                        key={d.kimlik}
                        k={k}
                        d={d}
                        pist={pist}
                        kay={KAY[di % KAY.length]}
                        durumu={dersDurumu(dz, durum, d.kimlik)}
                        simdiki={d.kimlik === simdiki}
                        testle={!!durum.dersler[d.kimlik]?.testle}
                        acik={acik === d.kimlik}
                        ac={(v) => setAcik(v ? d.kimlik : null)}
                        eksik={eksikOnkosullar(dz, durum, d.kimlik).map((x) => dz.dersler.get(x)?.baslik ?? x)}
                        test={testler.find((t) => t.kapsam.has(d.kimlik))?.kimlik}
                        soru={d.tur === "tekrar" ? Math.min(tekrarHavuzu(dz, d).length, d.hedefAlistirma || 8) : d.alistirmalar.length}
                      />
                    ))}
                  </ol>
                ) : (
                  <details className="mt-3 rounded-2xl border border-dashed border-line px-4 py-2 text-sm">
                    <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-muted">
                      {ui > sonDolu ? "İçerik hazırlanıyor" : "Bu ünitenin dersleri hazırlanıyor"} · {u.dersler.filter((d) => d.tur === "ders").length} ders
                    </summary>
                    <ul className="mb-2 flex flex-col gap-1.5">
                      {u.dersler.map((d) => (
                        <li key={d.kimlik} className="flex items-center gap-2">
                          <Simge ad="saat" boyut={16} className="shrink-0 text-muted" />
                          <span className="flex-1">{d.baslik}</span>
                          <span className="og-durum" data-durum="yakinda">
                            Yakında
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            </li>
          );
        })}
      </ol>
      {sonDolu < uniteler.length - 1 && sonDolu >= 0 && (
        <p className="text-center text-sm text-muted">Yazılan dersler burada bitiyor; yolun devamı hazırlanıyor.</p>
      )}
    </div>
  );
}

function UniteBandi({ u, sira, tamam, toplam, dolu }: { u: Unite; sira: number; tamam: number; toplam: number; dolu: boolean }) {
  return (
    <header className="og-bant" style={{ "--unite-renk": u.renk } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`unite-${u.kimlik}`} className="h2">
            Ünite {sira}: {u.baslik}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{u.ozet}</p>
        </div>
        <span className="tag shrink-0">Seviye {u.seviye}</span>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">
        {ortakMi(u.kimlik) && <span>Ortak ünite: iki pistte de sayılır</span>}
        {dolu ? (
          <span className="tabular-nums">
            {tamam}/{toplam} ders tamam
          </span>
        ) : (
          <span>İçerik hazırlanıyor</span>
        )}
      </p>
    </header>
  );
}

type DugumProps = {
  k: Kaynak;
  d: Ders;
  pist: PistKimlik;
  kay: number;
  durumu: DersDurumu;
  simdiki: boolean;
  testle: boolean;
  acik: boolean;
  ac: (v: boolean) => void;
  eksik: string[];
  test?: string;
  soru: number;
};

function Dugum({ k, d, pist, kay, durumu, simdiki, testle, acik, ac, eksik, test, soru }: DugumProps) {
  const btn = useRef<HTMLButtonElement>(null);
  const balon = useRef<HTMLDivElement>(null);
  const yazi = DURUM_YAZI[durumu] + (testle && (durumu === "tamam" || durumu === "usta") ? " · testle açıldı" : "");
  const girilir = durumu !== "kilitli" && durumu !== "yakinda";

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ac(false);
        btn.current?.focus();
      }
    };
    const disari = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!balon.current?.contains(t) && !btn.current?.contains(t)) ac(false);
    };
    document.addEventListener("keydown", kapat);
    document.addEventListener("pointerdown", disari);
    return () => {
      document.removeEventListener("keydown", kapat);
      document.removeEventListener("pointerdown", disari);
    };
  }, [acik, ac]);

  const baslaYazi = durumu === "tamam" || durumu === "usta" ? "TEKRAR ÇALIŞ" : durumu === "devam" ? "DEVAM ET" : d.tur === "test" ? "TESTE GİR" : "BAŞLA";

  return (
    <li style={{ "--kay": kay } as React.CSSProperties}>
      <div className="og-dugum-kap">
        <button
          ref={btn}
          id={`dugum-${d.kimlik}`}
          type="button"
          className="og-dugum"
          data-durum={durumu}
          data-tur={d.tur}
          data-simdiki={simdiki || undefined}
          aria-expanded={acik}
          aria-controls={`balon-${d.kimlik}`}
          aria-label={`${TUR_YAZI[d.tur]}: ${d.baslik}. ${yazi}${simdiki ? ", şu anki ders" : ""}`}
          onClick={() => ac(!acik)}
        >
          <Simge ad={dugumSimgesi(durumu, d.tur)} boyut={d.tur === "tekrar" ? 22 : 28} />
        </button>
        <span className="text-[13px] leading-tight font-semibold" aria-hidden="true">
          {d.tur === "ders" ? d.baslik : TUR_YAZI[d.tur]}
        </span>
        <span className="og-durum" data-durum={durumu} aria-hidden="true">
          {simdiki ? "Şu an · " : ""}
          {yazi}
        </span>
      </div>
      {acik && (
        <div ref={balon} id={`balon-${d.kimlik}`} role="region" aria-label={`${d.baslik} önizlemesi`} className="og-balon og-giris">
          <p className="text-xs font-semibold text-muted">
            {TUR_YAZI[d.tur]}
            {d.tur === "tekrar" && " · isteğe bağlı"}
          </p>
          <h3 className="mt-0.5 text-lg leading-snug font-bold">{d.baslik}</h3>
          {durumu !== "yakinda" && d.kazanimlar.length > 0 && (
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
              {d.kazanimlar.slice(0, 3).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted">
            <span>
              <Simge ad="saat" boyut={15} className="mr-1 inline align-[-2px]" />
              yaklaşık {d.sureDk} dk
            </span>
            {durumu !== "yakinda" && soru > 0 && <span>{soru} soru</span>}
            {d.tur === "test" && <span>geçmek için %{Math.round(d.ustalik.oran * 100)}</span>}
          </p>
          {d.tur === "test" && durumu !== "yakinda" && (
            <p className="mt-2 text-sm">
              {d.kapsam === "ortak" ? "Geçersen ortak temel ünitelerin buraya kadarki dersleri açılır." : "Geçersen bu pistte buraya kadarki bütün dersler açılır."} Kilitliyken de girebilirsin.
            </p>
          )}
          {durumu === "yakinda" && <p className="mt-2 text-sm">Bu dersin içeriği hazırlanıyor. Yolun geri kalanını kilitlemez.</p>}
          {durumu === "kilitli" && (
            <p className="mt-2 text-sm">
              Önce {eksik.length === 1 ? "şu dersi" : "şu dersleri"} bitir: <strong>{eksik.join(", ")}</strong>.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {girilir ? (
              <Link href={ogrenAdresi({ ders: d.kimlik, pist, ornek: k.ornek })} className="btn btn-primary btn-lg w-full tracking-wide">
                {baslaYazi}
              </Link>
            ) : durumu === "kilitli" && test ? (
              <Link href={ogrenAdresi({ ders: test, pist, ornek: k.ornek })} className="btn btn-lg w-full">
                <Simge ad="merdiven" boyut={20} /> Teste gir, ileri atla
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </li>
  );
}
