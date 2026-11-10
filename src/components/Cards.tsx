import { splitCards } from "@/lib/poker/cards";

const SUIT = {
  s: { ch: "♠", name: "maça", red: false },
  h: { ch: "♥", name: "kupa", red: true },
  d: { ch: "♦", name: "karo", red: true },
  c: { ch: "♣", name: "sinek", red: false },
} as const;

const RANK_NAME: Record<string, string> = { A: "as", K: "papaz", Q: "kız", J: "vale", T: "10" };

export function PlayingCard({ card, small }: { card: string; small?: boolean }) {
  const rank = card[0].toUpperCase();
  const suit = SUIT[card[1].toLowerCase() as keyof typeof SUIT];
  if (!suit) return null;
  return (
    <span
      role="img"
      aria-label={`${suit.name} ${RANK_NAME[rank] ?? rank}`}
      className={`inline-flex select-none flex-col items-center justify-center rounded-lg border border-black/15 font-bold leading-none shadow-sm ${
        small ? "h-10 w-7 text-sm" : "h-14 w-10 text-lg sm:h-16 sm:w-12 sm:text-xl"
      }`}
      style={{ background: "var(--card-face)", color: suit.red ? "var(--card-red)" : "var(--card-black)" }}
    >
      <span>{rank === "T" ? "10" : rank}</span>
      <span>{suit.ch}</span>
    </span>
  );
}

export function CardRow({ cards, small }: { cards?: string; small?: boolean }) {
  return (
    <span className="inline-flex gap-1">
      {splitCards(cards).map((c, i) => (
        <PlayingCard key={i} card={c} small={small} />
      ))}
    </span>
  );
}
