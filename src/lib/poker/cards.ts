export const MATRIX_RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

/** 13x13 matriste hücre etiketi: köşegen çift, üst üçgen suited, alt üçgen offsuit. */
export function matrixLabel(row: number, col: number): string {
  const a = MATRIX_RANKS[row];
  const b = MATRIX_RANKS[col];
  if (row === col) return a + b;
  return row < col ? `${a}${b}s` : `${b}${a}o`;
}

export function comboCount(label: string): number {
  if (label.length === 2) return 6;
  return label.endsWith("s") ? 4 : 12;
}

export function rangePercent(hands: Iterable<string>): number {
  let combos = 0;
  for (const h of hands) combos += comboCount(h);
  return (combos / 1326) * 100;
}

/** "AhKd" → ["Ah", "Kd"] */
export function splitCards(s: string | undefined): string[] {
  if (!s) return [];
  return s.replace(/\s+/g, "").match(/.{2}/g) ?? [];
}

const CARD_RE = /^([2-9TJQKA][shdc])+$/;
export function isCardString(s: string): boolean {
  return CARD_RE.test(s.replace(/\s+/g, ""));
}
