// Alıştırma masasında oturum ritmi: belirli sayıda elden ya da süreden sonra
// engellemeyen bir ara kartı. Spesifikasyon: docs/ekip/2026-11-11/03-oturum-ritmi-spec.md
// Veri yalnızca tarayıcıda tutulur; sunucuya bir şey gitmez.

export type RhythmEvery = 0 | 10 | 20 | 40; // 0 = kapalı
export const RHYTHM_CHOICES: RhythmEvery[] = [10, 20, 40, 0];
export const DEFAULT_EVERY: RhythmEvery = 20;
export const BLOCK_MS = 25 * 60 * 1000;
export const LONG_SESSION_MS = 60 * 60 * 1000;
const KEY = "pd:rhythm";

export type Block = { start: number; answers: number };

/** "Sonraki el"e basıldığında ara kartı açılmalı mı? */
export function shouldBreak(every: RhythmEvery, block: Block, now: number): boolean {
  if (every === 0 || block.answers === 0) return false;
  return block.answers >= every || now - block.start >= BLOCK_MS;
}

/** Süre doldu ama bu bölümde hiç cevap yoksa bölüm sessizce yeniden başlar. */
export function staleEmptyBlock(block: Block, now: number): boolean {
  return block.answers === 0 && now - block.start >= BLOCK_MS;
}

export function isLongSession(sessionStart: number, now: number): boolean {
  return now - sessionStart >= LONG_SESSION_MS;
}

export function parseEvery(raw: string | null | undefined): RhythmEvery {
  const n = Number(raw);
  return raw != null && (RHYTHM_CHOICES as number[]).includes(n) ? (n as RhythmEvery) : DEFAULT_EVERY;
}

export function readEvery(storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): RhythmEvery {
  try {
    return parseEvery(storage?.getItem(KEY));
  } catch {
    return DEFAULT_EVERY;
  }
}

export function writeEvery(every: RhythmEvery, storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, String(every));
  } catch {
    // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
  }
}

export function everyLabel(every: RhythmEvery): string {
  return every === 0 ? "Kapalı" : `${every} elde bir`;
}
