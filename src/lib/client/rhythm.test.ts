import { describe, expect, it } from "vitest";
import { BLOCK_MS, LONG_SESSION_MS, RHYTHM_KEY, isLongSession, readRhythm, rhythmStep, writeRhythm } from "./rhythm";

function memStore(init: Record<string, string> = {}) {
  const data = { ...init };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("oturum ritmi", () => {
  const t0 = 1_000_000;

  it("every = 20: 20. cevaptan sonra ara kartı açılır, 19'da açılmaz (QA 1)", () => {
    expect(rhythmStep(20, 19, t0, t0 + 60_000)).toBe("next");
    expect(rhythmStep(20, 20, t0, t0 + 60_000)).toBe("break");
  });

  it("25 dakika dolunca el sayısından bağımsız açılır (QA 2)", () => {
    expect(rhythmStep(20, 3, t0, t0 + BLOCK_MS - 1)).toBe("next");
    expect(rhythmStep(20, 3, t0, t0 + BLOCK_MS)).toBe("break");
    expect(rhythmStep(40, 1, t0, t0 + BLOCK_MS + 5)).toBe("break");
  });

  it("every = 0 iken hiç açılmaz (QA 4)", () => {
    expect(rhythmStep(0, 500, t0, t0 + 10 * BLOCK_MS)).toBe("next");
  });

  it("bölümde cevap yoksa açılmaz; süre dolduysa sessizce sıfırlanır", () => {
    expect(rhythmStep(20, 0, t0, t0 + 1000)).toBe("next");
    expect(rhythmStep(20, 0, t0, t0 + BLOCK_MS)).toBe("reset");
  });

  it("localStorage hata fırlatırsa varsayılan 20 kullanılır (QA 5)", () => {
    expect(readRhythm(throwing)).toBe(20);
    expect(() => writeRhythm(10, throwing)).not.toThrow();
    expect(readRhythm(undefined)).toBe(20);
  });

  it("tercih okunur ve yazılır; geçersiz değer varsayılana döner", () => {
    const s = memStore();
    expect(readRhythm(s)).toBe(20);
    writeRhythm(0, s);
    expect(readRhythm(s)).toBe(0);
    writeRhythm(40, s);
    expect(readRhythm(s)).toBe(40);
    expect(readRhythm(memStore({ [RHYTHM_KEY]: "7" }))).toBe(20);
    expect(readRhythm(memStore({ [RHYTHM_KEY]: "abc" }))).toBe(20);
  });

  it("uzun oturum notu 60 dakikadan sonra (QA 7)", () => {
    expect(isLongSession(t0, t0 + LONG_SESSION_MS - 1)).toBe(false);
    expect(isLongSession(t0, t0 + LONG_SESSION_MS)).toBe(true);
  });
});
