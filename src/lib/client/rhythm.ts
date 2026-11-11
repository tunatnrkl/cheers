// Alıştırma masasında oturum ritmi: ara kartının ne zaman açılacağı.
// Spesifikasyon: docs/ekip/2026-11-11/03-oturum-ritmi-spec.md

export type RhythmEvery = 10 | 20 | 40 | 0; // 0 = kapalı
export const RHYTHM_OPTIONS: RhythmEvery[] = [10, 20, 40, 0];
export const RHYTHM_DEFAULT: RhythmEvery = 20;
export const RHYTHM_KEY = "pd:rhythm";
export const BLOCK_MS = 25 * 60_000;
export const LONG_SESSION_MS = 60 * 60_000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Tercih edilen sıklık. Değer yoksa, geçersizse ya da depo hata verirse varsayılan 20. */
export function readRhythm(store: StorageLike | undefined = storage()): RhythmEvery {
  try {
    const raw = store?.getItem(RHYTHM_KEY);
    if (raw == null || raw === "") return RHYTHM_DEFAULT;
    const n = Number(raw);
    return (RHYTHM_OPTIONS as number[]).includes(n) ? (n as RhythmEvery) : RHYTHM_DEFAULT;
  } catch {
    return RHYTHM_DEFAULT;
  }
}

export function writeRhythm(every: RhythmEvery, store: StorageLike | undefined = storage()) {
  try {
    store?.setItem(RHYTHM_KEY, String(every));
  } catch {
    // Depo kapalı ya da dolu: tercih yalnızca bu oturumda geçerli olur
  }
}

/**
 * "Sonraki el" basıldığında ne olacağı.
 * - "break": ara kartını aç, yeni el seçme
 * - "reset": süre doldu ama bu bölümde cevap yok; bölümü sessizce yeniden başlat
 * - "next": normal akış
 */
export function rhythmStep(every: RhythmEvery, blockAnswers: number, blockStart: number, now: number): "break" | "reset" | "next" {
  if (every === 0) return "next";
  const timeUp = now - blockStart >= BLOCK_MS;
  if (blockAnswers === 0) return timeUp ? "reset" : "next";
  return blockAnswers >= every || timeUp ? "break" : "next";
}

export function isLongSession(sessionStart: number, now: number) {
  return now - sessionStart >= LONG_SESSION_MS;
}
