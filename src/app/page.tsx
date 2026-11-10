import Link from "next/link";
import { CardRow } from "@/components/Cards";
import { GLOSSARY } from "@/data/glossary";
import { GAMES, HANDS, STREETS } from "@/data/hands";

// Günün eli her gün değişsin diye sayfa günde bir yeniden üretilir.
export const revalidate = 86400;

const MAIN = [
  { href: "/kutuphane", title: "El incele", desc: `${HANDS.length} örnek el, önerilen hamle ve gerekçesiyle`, icon: "♠" },
  { href: "/alistirma", title: "Alıştırma yap", desc: "Senaryoyu oku, hamleni seç, hemen geri bildirim al", icon: "✓" },
  { href: "/yapay-zeka", title: "Yapay zekaya sor", desc: "Kendi elini anlat ya da bir kavramı sor", icon: "✦" },
];

const MORE = [
  { href: "/range", title: "Range matrisi", desc: "Pozisyona göre açılış ve push aralıkları" },
  { href: "/araclar", title: "Hesap makineleri", desc: "Pot odds, outs, SPR ve ICM" },
  { href: "/cash", title: "Cash game", desc: "Stack derinliği, rake, açılış aralıkları" },
  { href: "/turnuva", title: "Turnuva", desc: "Blind yapısı, push/fold, ICM, bubble" },
  { href: "/sozluk", title: "Sözlük", desc: `${GLOSSARY.length} terim, sade Türkçe` },
  { href: "/blog", title: "Blog", desc: "Temel kavramlar üzerine kısa yazılar" },
];

export default function Home() {
  const day = Math.floor(Date.now() / 86_400_000);
  const hand = HANDS[day % HANDS.length];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="h1">Bugün ne çalışmak istersin?</h1>
        <p className="lead mt-1">Texas Hold'em kararlarını sade Türkçe ile çalış: incele, dene, sor.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {MAIN.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-accent ${
                i === 0 ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"
              }`}
            >
              <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-xl text-2xl ${i === 0 ? "bg-white/15" : "bg-soft"}`}>
                {m.icon}
              </span>
              <span>
                <span className="block text-lg font-semibold">{m.title}</span>
                <span className={`block text-sm ${i === 0 ? "opacity-90" : "text-muted"}`}>{m.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-muted">Günün eli</p>
          <h2 className="h2 mt-1">{hand.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CardRow cards={hand.hero} />
            {hand.board && <CardRow cards={hand.board} small />}
          </div>
          <p className="mt-3 text-sm text-muted">
            {GAMES[hand.game]} · {STREETS[hand.street]} · {hand.heroPos} · {hand.stackBB} BB
          </p>
          <Link href={`/kutuphane/${hand.id}`} className="btn btn-primary mt-4 w-full">
            Bu eli incele
          </Link>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-muted">Nereden başlamalı?</p>
          <ol className="mt-2 space-y-3">
            {[
              ["Bir eli aç", "Kartlara, pozisyona ve aksiyona bak; önerilen hamleyi ve gerekçesini oku."],
              ["Anlamadığını sor", "Elin yanındaki asistana “Neden?” diye sor. Kısa yanıt gelir; istersen detaylandırır."],
              ["Kendini dene", "Alıştırma modunda 10 soru çöz; zayıf konularını gör."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-soft font-semibold">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <h2 className="h2">Araçlar ve içerik</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {MORE.map((m) => (
            <Link key={m.href} href={m.href} className="card min-h-20 transition-colors hover:border-accent">
              <span className="block font-semibold">{m.title}</span>
              <span className="block text-sm text-muted">{m.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
