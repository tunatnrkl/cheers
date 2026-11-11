import Link from "next/link";
import { ActionStrip } from "@/components/ActionStrip";
import { PokerTable } from "@/components/PokerTable";
import { GLOSSARY } from "@/data/glossary";
import { HAND_BY_ID, HANDS, type Topic } from "@/data/hands";
import { replay } from "@/lib/poker/replay";

const count = (f: (t: Topic) => boolean) => HANDS.filter((h) => f(h.topic)).length;
const TOTAL = `${Math.floor(HANDS.length / 50) * 50}+`;

const MODES = [
  {
    href: "/alistirma?oyun=cash&konu=acilis",
    eyebrow: "Cash · Preflop",
    title: "Açılış kararları",
    desc: "Pozisyona göre hangi ellerle açılır, hangileri bırakılır?",
    n: count((t) => t === "acilis"),
  },
  {
    href: "/alistirma?oyun=turnuva&konu=pushfold",
    eyebrow: "Turnuva · Kısa stack",
    title: "Push / fold",
    desc: "6–15 BB ile all-in mi, fold mu? Pozisyon her şeyi değiştirir.",
    n: count((t) => t === "pushfold"),
  },
  {
    href: "/alistirma?oyun=turnuva&konu=callshove",
    eyebrow: "Turnuva · BB",
    title: "All-in'e call",
    desc: "Rakip itti. Elin, onun aralığına karşı yeterli mi?",
    n: count((t) => t === "callshove"),
  },
  {
    href: "/alistirma?oyun=cash",
    eyebrow: "Cash · Postflop",
    title: "Flop, turn, river",
    desc: "C-bet, value bet, blöf, pot odds ve SPR kararları.",
    n: count((t) => ["cbet", "value", "blof", "odds", "spr", "3bet", "savunma"].includes(t)),
  },
];

const STEPS = [
  ["Masaya otur", "Aksiyonlar üstte, kartların ve stack'ler masada. Spot gerçek bir el gibi önüne gelir."],
  ["Kararını ver", "Fold, call ya da raise. Cevap anında gelir; açıklama sen istemedikçe çıkmaz."],
  ["Koça sor", "“Neden?”e dokun ya da aklındakini yaz. Yapay zeka koç birkaç cümleyle, sade anlatır."],
];

export default function Home() {
  const demo = HAND_BY_ID.get("c17")!;
  const r = replay(demo);

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      {/* ── Giriş ── */}
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className="eyebrow">Texas Hold'em alıştırma masası</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[56px]">
            Poker kararlarını <span className="text-accent-text">masada</span> çalış.
          </h1>
          <p className="lead mt-5 max-w-xl">
            {TOTAL} gerçekçi spot. Aksiyonu gör, hamleni seç, anında sonucu öğren. Takıldığın yeri yanındaki
            yapay zeka koçuna sor; kısa ve sade cevap versin.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/alistirma" className="btn btn-primary btn-lg">
              Alıştırmaya başla
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/range" className="btn btn-lg">
              Range matrisi
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              [TOTAL, "spot"],
              [String(GLOSSARY.length), "terimlik sözlük"],
              ["Ücretsiz", "hesapsız da çalışır"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="sr-only">{k}</dt>
                <dd className="text-2xl font-extrabold tracking-tight">{v}</dd>
                <dd className="text-sm text-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Gerçek masa bileşeniyle önizleme */}
        <Link
          href="/alistirma"
          aria-label="Örnek spot: alıştırma masasını aç"
          className="trainer group block overflow-hidden rounded-3xl border border-t-line bg-t-bg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] transition hover:-translate-y-0.5"
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

      {/* ── Nasıl çalışır ── */}
      <section>
        <p className="eyebrow">Nasıl çalışır</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Üç adım, her el bir ders</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card">
              <span className="grid size-10 place-items-center rounded-xl bg-soft text-lg font-extrabold text-accent-text">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Spot türleri ── */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Ne çalışmak istersin?</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Bir spot seç, hemen başla</h2>
          </div>
          <Link href="/alistirma" className="link">
            Karışık çalış →
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="card group flex h-full flex-col transition hover:-translate-y-0.5 hover:border-accent/50">
                <span className="text-xs font-bold text-muted">{m.eyebrow}</span>
                <span className="mt-2 text-lg font-bold">{m.title}</span>
                <span className="mt-1 flex-1 text-sm text-muted">{m.desc}</span>
                <span className="mt-5 flex items-center justify-between text-sm font-bold">
                  <span className="tag">{m.n} spot</span>
                  <span className="text-accent-text transition group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Araçlar ── */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["/range", "Range matrisi", "Pozisyona göre açılış ve push aralıkları. Kendi range'ini çiz, karşılaştır."],
          ["/araclar", "Hesap makineleri", "Pot odds, outs, SPR ve ICM. Her sonucun ne anlama geldiği yanında."],
          ["/ogren", "Öğren", `Cash ve turnuva rehberleri, blog yazıları ve ${GLOSSARY.length} terimlik sözlük.`],
        ].map(([href, t, d]) => (
          <Link key={href} href={href} className="card flex flex-col transition hover:border-accent/50">
            <span className="text-lg font-bold">{t}</span>
            <span className="mt-1 text-muted">{d}</span>
          </Link>
        ))}
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
