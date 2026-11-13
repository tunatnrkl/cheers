import Link from "next/link";
import { ActionStrip } from "@/components/ActionStrip";
import { CizimKarar, CizimKoc, CizimMasa } from "@/components/anasayfa/Cizimler";
import { KaldiginYer } from "@/components/anasayfa/KaldiginYer";
import { inceMufredat } from "@/components/anasayfa/ogrenOzeti";
import { SPOT_KARTLARI } from "@/components/anasayfa/spotlar";
import { TokusanIsaret } from "@/components/brand/Kutlama";
import { PokerTable } from "@/components/PokerTable";
import { GLOSSARY } from "@/data/glossary";
import { HAND_BY_ID, HANDS } from "@/data/hands";
import mufredat from "@/data/mufredat.json";
import { STATIC_SITE } from "@/lib/client/env";
import type { Mufredat } from "@/lib/mufredat/tipler";
import { replay } from "@/lib/poker/replay";

const TOTAL = `${Math.floor(HANDS.length / 50) * 50}+`;

// Ana sayfaya yalnızca yol hesabı için gereken hafif müfredat gider (sunucuda, derleme anında).
const YOL = inceMufredat(mufredat as unknown as Mufredat);

const STEPS = [
  { t: "Masaya otur", d: "Aksiyonlar üstte, kartların ve stack'ler masada. Spot gerçek bir el gibi önüne gelir.", Cizim: CizimMasa },
  { t: "Kararını ver", d: "Fold, call ya da raise. Cevap anında gelir; açıklama sen istemedikçe çıkmaz.", Cizim: CizimKarar },
  {
    t: "Koça sor",
    // GitHub Pages sürümünde sunucu ve yapay zeka yok: koç hazır sorularla, kural tabanlı çalışır.
    d: STATIC_SITE
      ? "“Neden?”e dokun; koç kararın gerekçesini birkaç cümleyle anlatır."
      : "“Neden?”e dokun ya da aklındakini yaz. Yapay zeka koç birkaç cümleyle, sade anlatır.",
    Cizim: CizimKoc,
  },
];

export default function Home() {
  const demo = HAND_BY_ID.get("c17")!;
  const r = replay(demo);

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <div className="flex flex-col gap-8 sm:gap-12">
        {/* ── Kaldığın yer: Öğren yolundaki ders ve günlük seri (tarayıcıda) ── */}
        <KaldiginYer mufredat={YOL} />

        {/* ── Giriş ── */}
        <section aria-labelledby="giris-baslik" className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="lg:order-2 lg:justify-self-center">
            {/* Bira altlığı: sayfa açılışında bardaklar bir kez yaklaşır ve tokuşur, sonra durur */}
            <div className="grid size-[148px] place-items-center rounded-full border border-line bg-felt-deep sm:size-[220px] lg:size-[340px]">
              <TokusanIsaret className="w-[74%]" sure="2.4s" gecikme="0.35s" />
            </div>
          </div>
          <div className="lg:order-1">
            <h1 id="giris-baslik" className="text-[40px] leading-[1.04] font-bold tracking-[-0.02em] text-balance sm:text-[60px] lg:text-[68px]">
              Poker kararlarını masada çalış.
            </h1>
            <p className="lead mt-5 max-w-xl">
              {TOTAL} gerçekçi spot. Aksiyonu gör, kararını ver, sonucu hemen öğren.{" "}
              {STATIC_SITE
                ? "Takıldığın yerde koça sor; hazır sorularla kısa ve sade açıklama alırsın."
                : "Takıldığın yeri yanındaki yapay zeka koçuna sor; kısa ve sade anlatsın."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/alistirma" className="btn btn-primary btn-lg">
                Alıştırmaya başla
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/ogren" className="link inline-flex min-h-11 items-center text-base">
                Öğrenme yolu
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              {TOTAL} spot · {GLOSSARY.length} terimlik sözlük · hesap gerekmez
            </p>
          </div>
        </section>
      </div>

      {/* ── Üç adım ── */}
      <section aria-labelledby="adimlar-baslik">
        <h2 id="adimlar-baslik" className="text-[28px] leading-tight font-bold sm:text-[34px]">
          Üç adım, her el bir ders
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ t, d, Cizim }, i) => (
            <li key={t} className="card flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="font-display text-[34px] leading-none font-semibold text-accent-text tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <Cizim className="h-14 w-auto text-accent-text sm:h-16" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                <span className="sr-only">{i + 1}. adım: </span>
                {t}
              </h3>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Spot türleri ── */}
      <section aria-labelledby="spot-baslik">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 id="spot-baslik" className="text-[28px] leading-tight font-bold sm:text-[34px]">
            Bir spot seç, hemen başla
          </h2>
          <Link href="/alistirma" className="link inline-flex min-h-11 items-center">
            Karışık çalış →
          </Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPOT_KARTLARI.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="card group flex h-full flex-col transition duration-200 hover:border-accent/60 motion-safe:hover:-translate-y-1"
              >
                <span className="text-sm font-semibold text-muted">{m.eyebrow}</span>
                <span className="mt-1.5 text-lg font-bold">{m.title}</span>
                <span className="mt-1 flex-1 text-sm text-muted">{m.desc}</span>
                <span className="mt-5 flex items-center justify-between text-sm font-bold">
                  <span className="tag">{m.n} spot</span>
                  <span className="text-accent-text" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Masadan bir an: gerçek masa bileşeniyle önizleme ── */}
      <section aria-labelledby="onizleme-baslik" className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
        <div>
          <h2 id="onizleme-baslik" className="text-[28px] leading-tight font-bold sm:text-[34px]">
            Masada böyle görünür
          </h2>
          <p className="mt-3 max-w-md text-muted">
            Rakipler sırayla oynar, sıra sana gelince karar butonları açılır. Eli sonuna kadar oynarsın; koç penceresi
            masanın yanında durur.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-5">
            <Link href="/range" className="link inline-flex min-h-11 items-center">
              Range matrisi
            </Link>
            <Link href="/araclar" className="link inline-flex min-h-11 items-center">
              Hesap makineleri
            </Link>
            <Link href="/sozluk" className="link inline-flex min-h-11 items-center">
              Sözlük
            </Link>
          </p>
        </div>
        <Link
          href="/alistirma"
          aria-label="Örnek spot: alıştırma masasını aç"
          className="trainer block overflow-hidden rounded-3xl border border-t-line bg-t-bg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
        >
          <div className="pointer-events-none border-b border-t-line" aria-hidden="true">
            <ActionStrip r={r} heroPos={demo.heroPos} />
          </div>
          <div className="pointer-events-none p-3 sm:p-5" aria-hidden="true">
            <PokerTable hand={demo} r={r} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["Fold", "bg-t-fold"],
                ["Call 3,7", "bg-t-call"],
                ["All-in", "bg-t-allin"],
              ].map(([l, c]) => (
                <span key={l} className={`grid min-h-12 place-items-center rounded-xl text-sm font-extrabold text-white ${c}`}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </section>

      <p className="rounded-2xl border border-line bg-surface-2 px-5 py-4 text-sm text-muted">
        <strong className="text-ink">Sorumlu oyun:</strong> Bu site bir strateji çalışma aracıdır; 18 yaş ve üzeri içindir,
        gerçek parayla oyun oynatmaz.{" "}
        <Link href="/sorumlu-oyun" className="link">
          Destek ve ilkeler
        </Link>
      </p>
    </div>
  );
}
