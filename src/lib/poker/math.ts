// Hesap makinelerinin saf fonksiyonları. Arayüzden bağımsızdır ve test edilir.

/** Call için gereken minimum equity (0..1). pot: rakibin bahsi dahil mevcut pot. */
export function requiredEquity(pot: number, toCall: number): number {
  if (toCall <= 0) return 0;
  return toCall / (pot + toCall);
}

/** Pot odds oranı: "x'e 1". */
export function potOddsRatio(pot: number, toCall: number): number {
  if (toCall <= 0) return Infinity;
  return pot / toCall;
}

/** Blöfün kâra geçmesi için rakibin fold etmesi gereken oran (0..1). */
export function bluffBreakEven(pot: number, bet: number): number {
  if (bet <= 0) return 0;
  return bet / (pot + bet);
}

/** Out sayısından tutma olasılığı (kesin hesap). unseen: görülmeyen kart sayısı. */
export function outsProbability(outs: number, street: "flop" | "turn") {
  const o = Math.max(0, Math.min(outs, 47));
  const river = o / 46;
  if (street === "turn") {
    return { nextCard: river, byRiver: river, rule: (o * 2) / 100 };
  }
  const turn = o / 47;
  const byRiver = 1 - ((47 - o) / 47) * ((46 - o) / 46);
  return { nextCard: turn, byRiver, rule: (o * 4) / 100 };
}

/** Efektif stack ve SPR (stack-to-pot ratio). */
export function spr(heroStack: number, villainStack: number, pot: number) {
  const effective = Math.max(0, Math.min(heroStack, villainStack));
  return { effective, spr: pot > 0 ? effective / pot : Infinity };
}

/**
 * Malmuth-Harville ICM. stacks: chip'ler, payouts: 1.'den itibaren ödüller.
 * Her oyuncunun beklenen ödül payını döndürür.
 */
export function icm(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length;
  const result = new Array<number>(n).fill(0);
  const places = Math.min(payouts.length, n);

  function walk(remaining: number[], place: number, prob: number) {
    if (place >= places || prob === 0) return;
    let total = 0;
    for (const i of remaining) total += stacks[i];
    if (total <= 0) return;
    for (const i of remaining) {
      if (stacks[i] <= 0) continue;
      const p = prob * (stacks[i] / total);
      result[i] += p * payouts[place];
      walk(remaining.filter((j) => j !== i), place + 1, p);
    }
  }

  walk(stacks.map((_, i) => i), 0, 1);
  return result;
}
