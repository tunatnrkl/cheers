import { GAMES, STREETS, TOPICS, type Hand } from "@/data/hands";
import { CardRow } from "./Cards";

/** Bir elin durumu: etiketler, kartlar, board ve aksiyon sırası. Cevabı göstermez. */
export function HandView({ hand }: { hand: Hand }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <span className="tag">{GAMES[hand.game]}</span>
        <span className="tag">{STREETS[hand.street]}</span>
        <span className="tag">{TOPICS[hand.topic]}</span>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Pozisyon", hand.heroPos],
          ["Efektif stack", `${hand.stackBB} BB`],
          ["Pot", `${hand.potBB} BB`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-soft px-2 py-2">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">Senin elin</p>
          <CardRow cards={hand.hero} />
        </div>
        {hand.board && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Board</p>
            <CardRow cards={hand.board} />
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted">Aksiyon sırası</p>
        <ol className="space-y-1">
          {hand.actions.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-soft text-xs font-semibold">
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
