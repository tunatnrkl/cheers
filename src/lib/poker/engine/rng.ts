// Tohumlu rastgelelik. Motor Math.random kullanmaz.

/** FNV-1a 32 bit */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(start: number): () => number {
  let a = start >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tohum + etiketten bağımsız bir akış: aynı girdiler her zaman aynı diziyi verir. */
export function akis(seed: number, etiket: string): () => number {
  return mulberry32(hashStr(`${seed}|${etiket}`));
}

export const r2 = (n: number) => Math.round(n * 100) / 100;
