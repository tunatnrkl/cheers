import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiPanel } from "@/components/AiPanel";
import { HandView } from "@/components/HandView";
import { RichText } from "@/components/RichText";
import { GAMES, HAND_BY_ID, HANDS, STREETS } from "@/data/hands";
import { SaveHand } from "./SaveHand";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return HANDS.map((h) => ({ id: h.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hand = HAND_BY_ID.get((await params).id);
  if (!hand) return {};
  return {
    title: hand.title,
    description: `${GAMES[hand.game]}, ${STREETS[hand.street]}, ${hand.heroPos}, ${hand.stackBB} BB. Önerilen hamle: ${hand.options[hand.correct]}. ${hand.reasoning.slice(0, 110)}…`,
  };
}

export default async function Page({ params }: Props) {
  const hand = HAND_BY_ID.get((await params).id);
  if (!hand) notFound();
  const i = HANDS.indexOf(hand);
  const prev = HANDS[i - 1];
  const next = HANDS[i + 1];

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Konum" className="text-sm">
        <Link href="/kutuphane" className="link inline-flex min-h-11 items-center">
          ← Kütüphane
        </Link>
      </nav>
      <h1 className="h1">{hand.title}</h1>

      {/* Mobilde tek sütun, masaüstünde el solda / asistan sağda */}
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <section className="card" aria-label="El bilgileri">
            <HandView hand={hand} />
          </section>

          <section className="card" aria-label="Önerilen hamle">
            <p className="text-sm font-medium text-muted">Önerilen hamle</p>
            <p className="mt-1 text-xl font-bold text-accent">{hand.options[hand.correct]}</p>
            <p className="mt-1 text-sm text-muted">
              Diğer seçenekler: {hand.options.filter((_, k) => k !== hand.correct).join(" · ")}
            </p>
            <h2 className="mt-4 font-semibold">Neden?</h2>
            <RichText text={hand.reasoning} className="mt-1" />
          </section>

          <SaveHand handId={hand.id} />
        </div>

        <div className="md:sticky md:top-20">
          <AiPanel
            title="Bu eli yapay zekaya sor"
            context={{ type: "hand", handId: hand.id }}
            suggestions={[
              "Bu eli neden bu pozisyonda böyle oynamalıyım?",
              "Rakip farklı bir tarzda olsaydı karar değişir miydi?",
              "Diğer seçenekler neden daha kötü?",
            ]}
            placeholder="Bu el hakkında sor…"
          />
        </div>
      </div>

      <nav aria-label="Diğer eller" className="grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={`/kutuphane/${prev.id}`} className="btn justify-start">
            ← Önceki el
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/kutuphane/${next.id}`} className="btn justify-end">
            Sonraki el →
          </Link>
        )}
      </nav>
    </div>
  );
}
