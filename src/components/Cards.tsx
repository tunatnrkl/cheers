import { splitCards } from "@/lib/poker/cards";

// Dört renkli deste: ♠ siyah, ♥ kırmızı, ♦ mavi, ♣ yeşil. Renkler hızlı okumayı kolaylaştırır.
const SUIT = {
  s: { ch: "♠", name: "maça", color: "#1c2321" },
  h: { ch: "♥", name: "kupa", color: "#c62a2a" },
  d: { ch: "♦", name: "karo", color: "#1f5fbf" },
  c: { ch: "♣", name: "sinek", color: "#16803c" },
} as const;

const RANK_NAME: Record<string, string> = { A: "as", K: "papaz", Q: "kız", J: "vale", T: "10" };

const SIZES = {
  xs: "h-9 w-[26px] text-[13px] rounded-[5px]",
  sm: "h-11 w-8 text-base rounded-md sm:h-14 sm:w-10 sm:text-lg",
  md: "h-14 w-10 text-lg rounded-lg sm:h-[72px] sm:w-[52px] sm:text-2xl",
  lg: "h-[60px] w-[44px] text-xl rounded-lg sm:h-[84px] sm:w-[60px] sm:text-[28px]",
};

export type CardSize = keyof typeof SIZES;

export function PlayingCard({ card, size = "md", small }: { card: string; size?: CardSize; small?: boolean }) {
  const rank = card[0].toUpperCase();
  const suit = SUIT[card[1].toLowerCase() as keyof typeof SUIT];
  if (!suit) return null;
  return (
    <span
      role="img"
      aria-label={`${suit.name} ${RANK_NAME[rank] ?? rank}`}
      className={`inline-flex shrink-0 select-none flex-col items-center justify-center bg-[#fbfbf8] font-extrabold leading-[1.05] shadow-[0_2px_6px_rgb(0_0_0/0.35)] ring-1 ring-black/10 ${SIZES[small ? "sm" : size]}`}
      style={{ color: suit.color }}
    >
      <span>{rank === "T" ? "10" : rank}</span>
      <span className="text-[0.85em]">{suit.ch}</span>
    </span>
  );
}

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-7 w-5 rounded-[4px] border border-white/25 bg-[repeating-linear-gradient(45deg,#2c5f7c_0_3px,#244e66_3px_6px)] shadow sm:h-9 sm:w-[26px] ${className}`}
    />
  );
}

export function CardRow({ cards, size = "md", small }: { cards?: string; size?: CardSize; small?: boolean }) {
  return (
    <span className="inline-flex gap-1">
      {splitCards(cards).map((c, i) => (
        <PlayingCard key={i} card={c} size={small ? "sm" : size} />
      ))}
    </span>
  );
}
