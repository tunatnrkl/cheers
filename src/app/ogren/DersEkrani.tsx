"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DersSonuIsareti } from "@/components/brand/Kutlama";
import { GLOSSARY } from "@/data/glossary";
import { type Cevap, degerlendir, dogruMetni } from "@/lib/ogren/alistirma";
import { type DepoDurumu, ogrenGuncelle } from "@/lib/ogren/depo";
import {
  type OturumCevabi,
  type OturumModu,
  type OturumOzeti,
  type OturumSorusu,
  type Sonuc,
  XP_DERS,
  XP_DOGRU,
  acilabilir,
  dersBaslat,
  dersDurumu,
  eksikOnkosullar,
  oturumSorulari,
  oturumUygula,
  uniteOzeti,
} from "@/lib/ogren/ilerleme";
import { type Kaynak, ogrenAdresi } from "@/lib/ogren/veri";
import { type PistKimlik, dersinPisti } from "@/lib/ogren/yol";
import { AlistirmaGirisi, ilkCevap } from "./Alistirmalar";
import { Simge, TUR_YAZI } from "./Simge";

/** Yanlış cevaplanan alıştırma ders sonunda en fazla bu kadar kez yeniden sorulur. */
const YENIDEN_EN_FAZLA = 2;

type Sira = { s: OturumSorusu; kez: number };
type Props = { k: Kaynak; depo: DepoDurumu; kimlik: string; pist: PistKimlik | null; mod: OturumModu };

export function DersEkrani({ k, depo, kimlik, pist, mod }: Props) {
  const { dz } = k;
  const d = dz.dersler.get(kimlik);
  const donusPisti = dersinPisti(dz, kimlik, pist);
  const donus = mod === "tekrar" ? ogrenAdresi({ ornek: k.ornek }) : ogrenAdresi({ pist: donusPisti, ornek: k.ornek });
  // Giriş kararı açılış anında verilir; ders bitince durum değişse de ekran kapanmaz.
  const [girilir] = useState(() => !!d && acilabilir(dz, depo.durum, kimlik));

  if (!d) return <Engel baslik="Ders bulunamadı" metin="Bu adreste bir ders yok. Yol haritasından seçebilirsin." donus={donus} />;
  if (!girilir) {
    const s = dersDurumu(dz, depo.durum, kimlik);
    if (s === "yakinda") return <Engel baslik={d.baslik} metin="Bu dersin içeriği hazırlanıyor. Yol haritasında yerini görebilirsin." donus={donus} />;
    const eksik = eksikOnkosullar(dz, depo.durum, kimlik).map((x) => dz.dersler.get(x)?.baslik ?? x);
    return (
      <Engel
        baslik={`${d.baslik}: kilitli`}
        metin={`Bu derse geçmeden önce ${eksik.length === 1 ? "şu dersi" : "şu dersleri"} bitir: ${eksik.join(", ")}.`}
        donus={donus}
      />
    );
  }
  return <Oturum k={k} depo={depo} kimlik={kimlik} mod={mod} donus={donus} />;
}

function Engel({ baslik, metin, donus }: { baslik: string; metin: string; donus: string }) {
  return (
    <section className="card mx-auto flex max-w-xl flex-col items-start gap-3" aria-labelledby="engel-baslik">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Simge ad="kilit" boyut={26} />
      </span>
      <h1 id="engel-baslik" className="h2">
        {baslik}
      </h1>
      <p>{metin}</p>
      <Link href={donus} className="btn btn-primary">
        Yol haritasına dön
      </Link>
    </section>
  );
}

// ───────────── Oturum ─────────────
type Asama = "giris" | "soru" | "sonu";

function Oturum({ k, depo, kimlik, mod, donus }: { k: Kaynak; depo: DepoDurumu; kimlik: string; mod: OturumModu; donus: string }) {
  const router = useRouter();
  const { dz } = k;
  const d = dz.dersler.get(kimlik)!;
  const [kuyruk, setKuyruk] = useState<Sira[]>(() => oturumSorulari(dz, depo.durum, kimlik, mod).map((s) => ({ s, kez: 0 })));
  const [asama, setAsama] = useState<Asama>("giris");
  const [i, setI] = useState(0);
  const [cevap, setCevap] = useState<Cevap | null>(null);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [ilk, setIlk] = useState<OturumCevabi[]>([]);
  const [ozet, setOzet] = useState<OturumOzeti | null>(null);
  const [uniteBitti, setUniteBitti] = useState<string | null>(null);
  const [cikis, setCikis] = useState(false);
  const [duyuru, setDuyuru] = useState("");
  const baslik = useRef<HTMLHeadingElement>(null);
  const devam = useRef<HTMLButtonElement>(null);
  const kap = useRef<HTMLDivElement>(null);

  const su = kuyruk[i];
  const tohum = su ? `${su.s.ders}/${su.s.a.kimlik}/${su.kez}` : "";
  const ilerleme = asama === "sonu" ? 1 : asama === "giris" ? 0 : (i + (sonuc ? 1 : 0)) / Math.max(1, kuyruk.length);

  // Tam ekran: arka plan kaydırılmaz ve klavye/ekran okuyucu için erişilmez olur.
  useEffect(() => {
    const kapsayici = kap.current;
    const digerleri = [...document.body.children].filter((el) => el !== kapsayici && !el.contains(kapsayici)) as HTMLElement[];
    const onceki = digerleri.map((el) => el.inert);
    digerleri.forEach((el) => (el.inert = true));
    const tasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      digerleri.forEach((el, n) => (el.inert = onceki[n]));
      document.body.style.overflow = tasma;
    };
  }, []);

  // Her yeni ekranda odak başlığa: ekran okuyucu soruyu baştan okur.
  useEffect(() => {
    baslik.current?.focus();
  }, [asama, i]);

  const cik = useCallback(() => router.push(donus, { scroll: false }), [router, donus]);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (asama === "soru" && ilk.length > 0) setCikis((v) => !v);
      else cik();
    };
    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [asama, ilk.length, cik]);

  function basla() {
    ogrenGuncelle(k.anahtar, (x) => dersBaslat(x, kimlik, new Date()));
    setCevap(kuyruk[0] ? ilkCevap(kuyruk[0].s.a, `${kuyruk[0].s.ders}/${kuyruk[0].s.a.kimlik}/0`) : null);
    setAsama("soru");
  }

  function kontrol(e?: FormEvent) {
    e?.preventDefault();
    if (!su || sonuc || !cevap) return;
    const a = su.s.a;
    const r = degerlendir(a, cevap);
    setSonuc(r);
    if (su.kez === 0) setIlk((x) => [...x, { ders: su.s.ders, alistirma: a.kimlik, sonuc: r }]);
    if (r === "y" && su.kez < YENIDEN_EN_FAZLA) setKuyruk((q) => [...q, { s: su.s, kez: su.kez + 1 }]);
    const bas = r === "d" ? "Doğru." : r === "k" ? "Kabul edilebilir." : "Doğru değil.";
    setDuyuru(`${bas} ${r !== "d" ? `Doğru cevap: ${dogruMetni(a)}. ` : ""}${a.neden}${r === "y" ? ` Tipik yanılgı: ${a.yanilgi}` : ""}`);
    requestAnimationFrame(() => devam.current?.focus());
  }

  function sonraki() {
    setDuyuru("");
    if (i + 1 < kuyruk.length) {
      const n = kuyruk[i + 1];
      setI(i + 1);
      setSonuc(null);
      setCevap(ilkCevap(n.s.a, `${n.s.ders}/${n.s.a.kimlik}/${n.kez}`));
      return;
    }
    const simdi = new Date();
    let o: OturumOzeti | null = null;
    let unite: string | null = null;
    ogrenGuncelle(k.anahtar, (x) => {
      const r = oturumUygula(dz, x, { kimlik, mod, cevaplar: ilk }, simdi);
      o = r.ozet;
      // Ünite bu oturumla bitti mi? (önce eksik, şimdi tam) → sakin "Şerefe!"
      const uk = dz.dersUnite.get(kimlik) ?? "";
      const once = uniteOzeti(dz, x, uk);
      const sonra = uniteOzeti(dz, r.durum, uk);
      if (sonra.toplam > 0 && once.tamam < once.toplam && sonra.tamam === sonra.toplam) unite = dz.uniteler.get(uk)?.baslik ?? null;
      return r.durum;
    });
    setOzet(o);
    setUniteBitti(unite);
    setAsama("sonu");
  }

  const ekran = (
    <div ref={kap} className="og og-ders" role="dialog" aria-modal="true" aria-label={`${TUR_YAZI[d.tur]}: ${d.baslik}`}>
      {/* Üst çubuk: kapat ve ilerleme */}
      <div className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2">
          <button
            type="button"
            className="btn btn-ghost -ml-2 size-11 shrink-0 !p-0"
            aria-label="Dersi kapat"
            onClick={() => (asama === "soru" && ilk.length > 0 ? setCikis(true) : cik())}
          >
            <Simge ad="kapat" boyut={22} />
          </button>
          <div
            className="og-cubuk flex-1"
            role="progressbar"
            aria-label="Ders ilerlemesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ilerleme * 100)}
          >
            <span style={{ width: `${ilerleme * 100}%` }} />
          </div>
          {asama === "soru" && (
            <span className="shrink-0 text-sm font-semibold text-muted tabular-nums">
              {Math.min(i + 1, kuyruk.length)}/{kuyruk.length}
            </span>
          )}
        </div>
      </div>

      {cikis && (
        <div role="alertdialog" aria-labelledby="cikis-b" className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
            <p id="cikis-b" className="flex-1 text-sm">
              Dersten çıkılsın mı? Bu oturumdaki cevaplar kaydedilmez; ders yol haritasında seni bekler.
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn" autoFocus onClick={() => setCikis(false)}>
                Derse dön
              </button>
              <button type="button" className="btn btn-ghost" onClick={cik}>
                Çık
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {duyuru}
      </p>

      {asama === "giris" && <Giris k={k} kimlik={kimlik} mod={mod} soru={kuyruk.length} baslik={baslik} basla={basla} />}

      {asama === "soru" && su && (
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={kontrol} noValidate data-adim={i}>
          <div className="og-ders-govde">
            <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6" key={tohum}>
              {su.kez > 0 && <span className="tag self-start">Yeniden soruluyor</span>}
              <h2 ref={baslik} tabIndex={-1} className="font-sans text-xl leading-snug font-bold sm:text-2xl">
                {su.s.a.soru}
              </h2>
              {su.s.a.dogrulamaGerekli && (
                <p className="flex gap-2 text-sm text-muted">
                  <Simge ad="bilgi" boyut={18} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-ink">Yaklaşık bilgi.</strong> Bu sorudaki değerlendirme genel kabul gören ilkelere ve yaklaşık aralıklara dayanır;
                    bağımsız olarak doğrulanmadı.
                  </span>
                </p>
              )}
              <AlistirmaGirisi a={su.s.a} tohum={tohum} cevap={cevap} setCevap={setCevap} sonuc={sonuc} duyur={setDuyuru} />
            </div>
          </div>
          <GeriBildirim sonuc={sonuc} su={su.s} devamRef={devam} hazir={!!cevap} sonraki={sonraki} son={i + 1 >= kuyruk.length} yeniden={su.kez < YENIDEN_EN_FAZLA} />
        </form>
      )}

      {asama === "sonu" && ozet && <Sonu ozet={ozet} tur={d.tur} baslikRef={baslik} devam={cik} mod={mod} oran={d.ustalik.oran} unite={uniteBitti} />}
    </div>
  );
  return createPortal(ekran, document.body);
}

// ───────────── Giriş: kısa anlatım ─────────────
function Giris({
  k,
  kimlik,
  mod,
  soru,
  baslik,
  basla,
}: {
  k: Kaynak;
  kimlik: string;
  mod: OturumModu;
  soru: number;
  baslik: React.RefObject<HTMLHeadingElement | null>;
  basla: () => void;
}) {
  const d = k.dz.dersler.get(kimlik)!;
  const terimler = d.terimler.map((t) => GLOSSARY.find((g) => g.term === t)).filter((g) => !!g);
  const aciklama =
    mod === "tekrar"
      ? "Aralıklı tekrar: bu dersten birkaç soru. Önce geçen sefer zorlandıkların gelir."
      : d.tur === "kontrol"
        ? "Ünitenin derslerinden karışık sorular. Yanlışlar sonda yeniden sorulur."
        : d.tur === "test"
          ? `Seviye atlama testi. Geçmek için ilk denemelerde en az %${Math.round(d.ustalik.oran * 100)} doğruluk gerekir; geçersen kapsamındaki dersler açılır. Geçemezsen hiçbir şey kaybolmaz.`
          : d.tur === "tekrar"
            ? "Ünitenin derslerinden sorular; önce geçmişte zorlandıkların gelir."
            : null;
  return (
    <>
      <div className="og-ders-govde">
        <article className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
          <p className="eyebrow">{mod === "tekrar" ? "Tekrar" : TUR_YAZI[d.tur]}</p>
          <h2 ref={baslik} tabIndex={-1} className="h1 -mt-2">
            {d.baslik}
          </h2>
          {aciklama && <p className="lead">{aciklama}</p>}
          {mod !== "tekrar" && d.anlatim.length > 0 && (
            <div className="flex flex-col gap-3 text-[17px] leading-relaxed">
              {d.anlatim.map((p, n) => (
                <p key={n}>{p}</p>
              ))}
            </div>
          )}
          {mod !== "tekrar" && d.kazanimlar.length > 0 && (
            <section aria-label="Bu derste" className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="font-sans text-sm font-bold">Bu dersin sonunda</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {d.kazanimlar.slice(0, 3).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {terimler.length > 0 && (
            <p className="text-sm text-muted">
              Terimler (sözlükte, yeni sekmede):{" "}
              {terimler.map((g, n) => (
                <span key={g.slug}>
                  {n > 0 && ", "}
                  <Link href={`/sozluk#${g.slug}`} target="_blank" className="link inline-flex min-h-11 items-center">
                    {g.term}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <p className="text-sm text-muted">
            {soru} soru · yaklaşık {d.sureDk} dk
          </p>
        </article>
      </div>
      <div className="og-ders-alt">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <button type="button" className="btn btn-primary btn-lg w-full tracking-wide" onClick={basla} disabled={soru === 0}>
            {soru === 0 ? "Bu tekrar için henüz soru yok" : "BAŞLA"}
          </button>
        </div>
      </div>
    </>
  );
}

// ───────────── Anında geri bildirim ─────────────
function GeriBildirim({
  sonuc,
  su,
  devamRef,
  hazir,
  sonraki,
  son,
  yeniden,
}: {
  yeniden: boolean;
  sonuc: Sonuc | null;
  su: OturumSorusu;
  devamRef: React.RefObject<HTMLButtonElement | null>;
  hazir: boolean;
  sonraki: () => void;
  son: boolean;
}) {
  const a = su.a;
  return (
    <div className="og-ders-alt" data-sonuc={sonuc ?? undefined}>
      <div className="mx-auto flex max-h-[46dvh] max-w-2xl flex-col gap-2 overflow-y-auto px-4 py-3">
        {sonuc && (
          <div className="og-giris flex flex-col gap-1.5">
            <p className={`flex items-center gap-2 text-lg font-extrabold ${sonuc === "d" ? "og-ok-yazi" : sonuc === "k" ? "text-accent-text" : "text-danger"}`}>
              <Simge ad={sonuc === "d" ? "tik" : sonuc === "k" ? "bilgi" : "carpi"} boyut={24} kalin={2.6} />
              {sonuc === "d" ? "Doğru" : sonuc === "k" ? "Kabul edilebilir" : "Doğru değil"}
            </p>
            {sonuc === "k" && <p className="text-sm">Bu seçenek de savunulabilir; ama önerilen hamle: {dogruMetni(a)}.</p>}
            {sonuc === "y" && (
              <p className="text-sm">
                <strong>Doğru cevap:</strong> {dogruMetni(a)}
              </p>
            )}
            <p className="text-sm">{a.neden}</p>
            {sonuc === "y" && (
              <p className="text-sm">
                <strong>Tipik yanılgı:</strong> {a.yanilgi}
              </p>
            )}
            {sonuc === "y" && yeniden && <p className="text-xs">Bu soru ders sonunda yeniden sorulacak.</p>}
          </div>
        )}
        {sonuc ? (
          // Ayrı key: aynı DOM düğmesi "submit"e dönüşürse tıklamanın varsayılan eylemi sıradaki soruyu kendiliğinden gönderir.
          <button key="devam" ref={devamRef} type="button" className="btn btn-primary btn-lg w-full tracking-wide" onClick={sonraki}>
            {son ? "DERSİ BİTİR" : "DEVAM"}
          </button>
        ) : (
          <button key="kontrol" type="submit" className="btn btn-primary btn-lg w-full tracking-wide" disabled={!hazir}>
            KONTROL ET
          </button>
        )}
      </div>
    </div>
  );
}

// ───────────── Ders sonu: sakin kutlama ─────────────
function Sonu({
  ozet,
  tur,
  baslikRef,
  devam,
  mod,
  oran,
  unite,
}: {
  ozet: OturumOzeti;
  tur: string;
  baslikRef: React.RefObject<HTMLHeadingElement | null>;
  devam: () => void;
  mod: OturumModu;
  oran: number;
  unite: string | null;
}) {
  const kaldi = ozet.testGecti === false;
  const baslik = kaldi ? "Test bitti" : ozet.testGecti ? "Test geçildi" : mod === "tekrar" || tur === "tekrar" ? "Tekrar tamam" : tur === "kontrol" ? "Ünite kontrolü tamam" : "Ders tamam";
  return (
    <>
      <div className="og-ders-govde">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-8 text-center">
          <DersSonuIsareti seviye={unite ? "unite" : !kaldi && (ozet.ilkTamamlama || ozet.testGecti) ? "ders" : "sabit"} />
          <h2 ref={baslikRef} tabIndex={-1} className="h1">
            {baslik}
          </h2>
          <dl className="grid w-full grid-cols-3 gap-2">
            <div className="rounded-2xl border border-line bg-surface p-3">
              <dt className="text-xs text-muted">Kazanılan</dt>
              <dd className="text-2xl font-extrabold text-accent-text tabular-nums">{ozet.xp} XP</dd>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <dt className="text-xs text-muted">Doğruluk</dt>
              <dd className="text-2xl font-extrabold tabular-nums">%{ozet.dogruluk}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <dt className="text-xs text-muted">Günlük seri</dt>
              <dd className="text-2xl font-extrabold tabular-nums">{ozet.seriSonra} gün</dd>
            </div>
          </dl>
          <ul className="flex flex-col gap-1 text-sm text-muted">
            {unite && <li className="font-semibold text-ink">Ünite tamam: {unite}</li>}
            <li>
              {ozet.dogru} doğru × {XP_DOGRU} XP + bitirme {XP_DERS} XP
              {ozet.kabul > 0 && ` · ${ozet.kabul} kabul edilebilir cevap (hata sayılmadı)`}
            </li>
            {ozet.seriIslendi && <li>{ozet.seriSonra === 1 ? "Bugün seriyi başlattın." : "Bugünün dersi seriye eklendi."}</li>}
            {ozet.hedefTamam && <li>Günlük hedefin tamam.</li>}
            {ozet.ustaOldu && <li className="font-semibold text-accent-text">Bu derste ustalaştın.</li>}
            {ozet.testGecti && ozet.acilan > 0 && <li className="font-semibold text-ink">{ozet.acilan} ders testle açıldı.</li>}
            {kaldi && (
              <li className="text-ink">
                Geçmek için %{Math.round(oran * 100)} gerekiyordu. Dersleri sırayla sürdürebilir ya da testi daha sonra yeniden deneyebilirsin.
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="og-ders-alt">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <button type="button" className="btn btn-primary btn-lg w-full tracking-wide" onClick={devam}>
            DEVAM ET
          </button>
        </div>
      </div>
    </>
  );
}
