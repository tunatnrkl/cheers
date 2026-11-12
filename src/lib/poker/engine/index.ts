// El motoru: spotun karar anından başlayıp eli river'a ve showdown'a kadar oynatır.
// Saf TypeScript; React ve DOM yok; rastgelelik yalnızca spot kimliğinden türetilen tohumla.
// Ayrıntı: ./README.md
import type { Hand } from "@/data/hands";
import { gizliDagitim } from "./araliklar";
import { evaluate } from "./degerlendir";
import { dogrula, dondur, heroFoldBitir, ilerlet, ilkDurum, kopya, legalFor, uygula } from "./kurallar";
import { rakipKarar } from "./rakip";
import { r2 } from "./rng";
import type { EngineState, Hamle, HeroAksiyon, LegalActions, Olay, Spot } from "./types";

export type * from "./types";
export { evaluate, optionKind } from "./degerlendir";
export { summarize } from "./ozet";

/** Spotun motorda kullanılan, rakip kartı içermeyen kopyası. `villain`, `note`, `reasoning` alınmaz. */
export function toSpot(hand: Hand): Spot {
  return {
    id: hand.id,
    game: hand.game,
    street: hand.street,
    heroPos: hand.heroPos,
    stackBB: hand.stackBB,
    hero: hand.hero,
    board: hand.board ?? "",
    seq: [...hand.seq],
    ...(hand.stacks ? { stacks: { ...hand.stacks } } : {}),
    ...(hand.ante !== undefined ? { ante: hand.ante } : {}),
    ...(hand.players ? { players: [...hand.players] } : {}),
    options: [...hand.options],
    correct: hand.correct,
  };
}

/** Kurulum: spotun karar anındaki durumu. Sıra hero'dadır. */
export function createHand(hand: Hand): EngineState {
  return dondur(ilkDurum(toSpot(hand)));
}

/** Hero'nun yasal aksiyonları. El bittiyse ya da sıra hero'da değilse boş nesne. */
export function legalActions(state: EngineState): LegalActions {
  if (state.result || state.toAct !== state.spot.heroPos) return {};
  return legalFor(state, state.spot.heroPos);
}

function hamle(state: EngineState, action: HeroAksiyon): Hamle {
  switch (action.tür) {
    case "fold":
    case "check":
    case "call":
      return { tür: action.tür };
    case "bet":
    case "raise":
      if (!Number.isFinite(action.miktar)) throw new Error("Geçersiz miktar");
      return { tür: "raise", to: r2(action.miktar) };
    case "allin": {
      const legal = legalActions(state);
      const a = legal.bet ?? legal.raise;
      if (a) return { tür: "raise", to: a.max };
      if (legal.call !== undefined) return { tür: "call" };
      throw new Error("All-in yapılamaz");
    }
    default:
      throw new Error("Bilinmeyen aksiyon");
  }
}

/**
 * Hero'nun aksiyonunu uygular; ardından rakipler sırayla oynar ve durum bir sonraki hero
 * kararına ya da elin sonuna kadar ilerler. Girdi durumu değişmez. Yasal olmayan aksiyon hata fırlatır.
 */
export function applyHero(state: EngineState, action: HeroAksiyon): { state: EngineState; olaylar: Olay[] } {
  const hero = state.spot.heroPos;
  if (state.result) throw new Error("El bitti");
  if (state.toAct !== hero) throw new Error("Sıra hero'da değil");
  const h = dogrula(state, hero, hamle(state, action));
  const deger = evaluate(state, action);

  const d = kopya(state);
  const ev: Olay[] = [];
  uygula(d, hero, h, ev);
  const son = d.history[d.history.length - 1];
  d.decisions.push({
    sokak: state.sokak,
    aksiyon: son.aksiyon,
    miktar: h.tür === "call" ? son.eklenen : son.miktar,
    potOnce: state.pot,
    ...deger,
  });

  if (h.tür === "fold") {
    heroFoldBitir(d, ev);
  } else {
    const g = gizliDagitim(state.spot);
    ilerlet(d, g, ev);
    for (let guard = 0; guard < 200 && !d.result && d.toAct !== hero; guard++) {
      const p = d.toAct;
      if (!p) break;
      uygula(d, p, dogrula(d, p, rakipKarar(d, p, g)), ev);
      ilerlet(d, g, ev);
    }
  }
  d.olaylar.push(...ev);
  return { state: dondur(d), olaylar: ev };
}
