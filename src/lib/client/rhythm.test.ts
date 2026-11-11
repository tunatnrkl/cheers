import { describe, expect, it } from "vitest";
import { BLOCK_MS, LONG_SESSION_MS, isLongSession, parseEvery, readEvery, shouldBreak, staleEmptyBlock, writeEvery } from "./rhythm";

// Kabul ölçütleri: docs/ekip/2026-11-11/03-oturum-ritmi-spec.md, bölüm 3.
describe("oturum ritmi", () => {
  const t0 = 1_000_000;

  it("1: every=20 iken 19. cevaptan sonra açılmaz, 20. cevaptan sonra açılır", () => {
    expect(shouldBreak(20, { start: t0, answers: 19 }, t0 + 60_000)).toBe(false);
    expect(shouldBreak(20, { start: t0, answers: 20 }, t0 + 60_000)).toBe(true);
  });

  it("2: 25 dakika dolunca el sayısından bağımsız açılır", () => {
    expect(shouldBreak(20, { start: t0, answers: 3 }, t0 + BLOCK_MS - 1)).toBe(false);
    expect(shouldBreak(20, { start: t0, answers: 3 }, t0 + BLOCK_MS)).toBe(true);
  });

  it("4: every=0 (kapalı) iken hiç açılmaz", () => {
    expect(shouldBreak(0, { start: t0, answers: 500 }, t0 + 10 * BLOCK_MS)).toBe(false);
  });

  it("boş bölüm: cevap yoksa açılmaz, süre dolduysa bölüm sessizce sıfırlanır", () => {
    expect(shouldBreak(20, { start: t0, answers: 0 }, t0 + 2 * BLOCK_MS)).toBe(false);
    expect(staleEmptyBlock({ start: t0, answers: 0 }, t0 + BLOCK_MS)).toBe(true);
    expect(staleEmptyBlock({ start: t0, answers: 1 }, t0 + BLOCK_MS)).toBe(false);
  });

  it("5: depolama hata fırlatırsa varsayılan 20 kullanılır ve yazma sessizce geçer", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readEvery(broken)).toBe(20);
    expect(readEvery(undefined)).toBe(20);
    expect(() => writeEvery(10, broken)).not.toThrow();
  });

  it("geçersiz kayıtlı değerler varsayılana döner, geçerliler korunur", () => {
    expect(parseEvery(null)).toBe(20);
    expect(parseEvery("abc")).toBe(20);
    expect(parseEvery("15")).toBe(20);
    expect(parseEvery("0")).toBe(0);
    expect(parseEvery("40")).toBe(40);
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    writeEvery(10, store);
    expect(readEvery(store)).toBe(10);
  });

  it("7: uzun oturum notu yalnızca 60 dakikadan sonra", () => {
    expect(isLongSession(t0, t0 + LONG_SESSION_MS - 1)).toBe(false);
    expect(isLongSession(t0, t0 + LONG_SESSION_MS)).toBe(true);
  });
});
