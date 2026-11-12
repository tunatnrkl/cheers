// Yasallık kuralları: min raise, eksik all-in, sokak sonu, iade, yan pot, heads-up, ante.
import { describe, expect, it } from "vitest";
import { HANDS, type Hand } from "@/data/hands";
import { SEATS } from "../replay";
import { applyHero, createHand, legalActions } from "./index";
import { kopya, potlariHesapla } from "./kurallar";
import type { EngineState } from "./types";

function el(p: Partial<Hand> & Pick<Hand, "heroPos" | "seq">): Hand {
  return {
    id: "test-" + p.seq.join("_") + (p.heroPos ?? ""),
    title: "test",
    game: "cash",
    street: "preflop",
    stackBB: 100,
    hero: "AhKd",
    potBB: 0,
    options: ["Fold", "Call", "Raise"],
    correct: 1,
    reasoning: "test",
    topic: "acilis",
    level: 1,
    ...p,
  };
}
const spot = (id: string) => HANDS.find((h) => h.id === id)!;
function chip(s: EngineState) {
  let sum = s.pot;
  for (const p of SEATS) if (s.seats[p].present) sum += s.seats[p].stack;
  return Math.round(sum * 100) / 100;
}

describe("yasal aksiyonlar", () => {
  it("bahis yokken check/bet, fold yok", () => {
    const s = createHand(spot("c22")); // river, BB check etti, sıra BTN'de
    const l = legalActions(s);
    expect(l.check).toBe(true);
    expect(l.fold).toBeUndefined();
    expect(l.call).toBeUndefined();
    expect(l.raise).toBeUndefined();
    expect(l.bet!.min).toBe(1);
    expect(l.bet!.max).toBe(s.seats.BTN.stack);
  });

  it("bahis varken fold/call/raise; min raise son artış kadar", () => {
    const s = createHand(spot("c17")); // flop: BTN 3,7 bahis
    const l = legalActions(s);
    expect(l.fold).toBe(true);
    expect(l.check).toBeUndefined();
    expect(l.call).toBe(3.7);
    expect(l.raise!.min).toBe(7.4);
    expect(l.raise!.max).toBe(s.seats.BB.stack);
    // preflop: 2,5'e açılış, 10'a 3-bet → min 4-bet 17,5
    const t = createHand(el({ heroPos: "UTG", seq: ["UTG r2.5", "HJ r10", "CO f", "BTN f", "SB f", "BB f"] }));
    expect(legalActions(t).raise!.min).toBe(17.5);
    expect(legalActions(t).call).toBe(7.5);
  });

  it("kısayollar artan sırada, min-max arasında ve all-in ile biter", () => {
    for (const id of ["c17", "c22", "c07", "c01"]) {
      const l = legalActions(createHand(spot(id)));
      const a = (l.bet ?? l.raise)!;
      const m = a.kısayollar.map((k) => k.miktar);
      expect([...m].sort((x, y) => x - y)).toEqual(m);
      for (const x of m) expect(x >= a.min && x <= a.max).toBe(true);
      expect(a.kısayollar.at(-1)).toEqual({ etiket: "All-in", miktar: a.max });
    }
  });

  it("min raise altı ve stack üstü reddedilir", () => {
    const s = createHand(spot("c17"));
    expect(() => applyHero(s, { tür: "raise", miktar: 6 })).toThrow(/Minimum/);
    expect(() => applyHero(s, { tür: "raise", miktar: 500 })).toThrow();
    expect(() => applyHero(s, { tür: "check" })).toThrow();
  });

  it("eksik all-in aksiyonu yeniden açmaz", () => {
    // CO 3'e açar, BTN call, SB 4 BB'lik stack'iyle all-in (artış 1 < 2): CO yalnızca call/fold
    const s = createHand(el({ heroPos: "CO", stacks: { SB: 4 }, seq: ["UTG f", "HJ f", "CO r3", "BTN c", "SB a", "BB f"] }));
    const l = legalActions(s);
    expect(l.call).toBe(1);
    expect(l.fold).toBe(true);
    expect(l.raise).toBeUndefined();
  });

  it("tam all-in raise aksiyonu yeniden açar", () => {
    const s = createHand(el({ heroPos: "CO", stacks: { SB: 12 }, seq: ["UTG f", "HJ f", "CO r3", "BTN c", "SB a", "BB f"] }));
    const l = legalActions(s);
    expect(l.call).toBe(9);
    expect(l.raise!.min).toBe(21); // 12 + son artış 9
  });

  it("stack call'a yetmiyorsa call = kalan stack ve raise yok", () => {
    const s = createHand(el({ heroPos: "BB", stacks: { BB: 30 }, seq: ["UTG f", "HJ f", "CO f", "BTN a", "SB f"] }));
    const l = legalActions(s);
    expect(l.call).toBe(29);
    expect(l.raise).toBeUndefined();
  });
});

describe("sokak sonu ve otomatik açılış", () => {
  it("son konuşan check edince sokak kapanır ve yeni kart açılır", () => {
    const h = el({
      heroPos: "BTN",
      street: "flop",
      hero: "AhKd",
      board: "Qs7c2d",
      seq: ["UTG f", "HJ f", "CO f", "BTN r2.5", "SB f", "BB c", "F Qs7c2d", "BB x"],
    });
    const s = createHand(h);
    const { state, olaylar } = applyHero(s, { tür: "check" });
    expect(olaylar[0]).toMatchObject({ tür: "aksiyon", koltuk: "BTN", aksiyon: "check" });
    expect(olaylar[1]).toMatchObject({ tür: "sokak", sokak: "turn", pot: 5.5 });
    expect((olaylar[1] as { kartlar: string[] }).kartlar).toHaveLength(1);
    expect(state.board).toHaveLength(4);
    expect(state.sokak === "turn" || state.sokak === "river" || state.result !== null).toBe(true);
  });

  it("herkes all-in ise kalan kartlar sırayla açılır ve showdown olur", () => {
    const s = createHand(spot("t17")); // BTN all-in, SB fold, BB karar
    const { state, olaylar } = applyHero(s, { tür: "call" });
    const turler = olaylar.map((o) => (o.tür === "sokak" ? o.sokak : o.tür));
    expect(turler.filter((t) => t !== "iade")).toEqual(["aksiyon", "flop", "turn", "river", "showdown", "sonuç"]);
    expect(state.board).toHaveLength(5);
    expect(state.result!.neden).toBe("showdown");
    expect(chip(state)).toBe(state.toplamChip);
  });

  it("karşılanmayan bahis fazlası iade edilir", () => {
    const s = createHand(el({ heroPos: "BB", stacks: { BB: 30 }, seq: ["UTG f", "HJ f", "CO f", "BTN a", "SB f"] }));
    const { state, olaylar } = applyHero(s, { tür: "call" });
    const iade = olaylar.find((o) => o.tür === "iade");
    expect(iade).toMatchObject({ tür: "iade", koltuk: "BTN", miktar: 70 });
    expect(state.result!.pot).toBe(60.5);
    expect(chip(state)).toBe(state.toplamChip);
  });
});

describe("yan pot", () => {
  it("üç farklı stack: ana pot ve yan pot doğru bölünür", () => {
    const s = createHand(el({ heroPos: "BB", stacks: { CO: 10, BTN: 30 }, seq: ["UTG f", "HJ f", "CO a", "BTN a", "SB f"] }));
    const { state } = applyHero(s, { tür: "call" });
    const r = state.result!;
    expect(r.neden).toBe("showdown");
    // BTN'in 70'lik fazlası iade edilmez: hero 100 ile 30'u karşılar
    expect(r.potlar.map((p) => p.miktar)).toEqual([30.5, 40]);
    expect(r.potlar[0].adaylar).toEqual(["CO", "BTN", "BB"]);
    expect(r.potlar[1].adaylar).toEqual(["BTN", "BB"]);
    expect(r.kazananlar.reduce((a, k) => a + k.miktar, 0)).toBeCloseTo(70.5, 5);
    expect(chip(state)).toBe(state.toplamChip);
  });

  it("katlanan oyuncunun parası ve ante ana pota gider", () => {
    const s = kopya(createHand(el({ heroPos: "UTG", seq: [] })));
    const set = (p: (typeof SEATS)[number], total: number, folded = false) => {
      s.seats[p] = { ...s.seats[p], total, folded };
    };
    set("UTG", 1, true);
    set("HJ", 0, true);
    set("CO", 0, true);
    set("BTN", 5);
    set("SB", 20);
    set("BB", 20);
    s.pot = 46 + 0.6; // 0,6 ante
    const pots = potlariHesapla(s);
    expect(pots).toEqual([
      { cent: 1660, adaylar: ["BTN", "SB", "BB"] },
      { cent: 3000, adaylar: ["SB", "BB"] },
    ]);
  });
});

describe("heads-up, çok oyunculu ve ante", () => {
  it("heads-up: preflop SB önce, flop sonrası BB önce konuşur", () => {
    const s = createHand(spot("t18")); // heads-up, SB karar
    expect(s.toAct).toBe("SB");
    const { state, olaylar } = applyHero(s, { tür: "call" });
    // BB check ya da raise eder; check ederse flop'ta ilk konuşan BB'dir
    const flop = olaylar.findIndex((o) => o.tür === "sokak" && o.sokak === "flop");
    if (flop >= 0 && flop + 1 < olaylar.length) {
      const sonraki = olaylar[flop + 1];
      if (sonraki.tür === "aksiyon") expect(sonraki.koltuk).toBe("BB");
      else expect(state.toAct).toBe("BB");
    }
  });

  it("ante pota ölü para olarak girer ve chip korunur", () => {
    const h = HANDS.find((x) => x.ante && x.street === "preflop")!;
    const s = createHand(h);
    expect(s.pot).toBeCloseTo(h.potBB, 1);
    let st = s;
    while (!st.result) st = applyHero(st, legalActions(st).check ? { tür: "check" } : { tür: "call" }).state;
    expect(chip(st)).toBe(st.toplamChip);
  });

  it("hero fold edince el hemen biter; çok oyunculu potta pot dağıtılmaz ve kart açılmaz", () => {
    const h = HANDS.find((x) => x.street === "preflop" && x.options[0] === "Fold" && x.seq.filter((a) => / [rc]/.test(a)).length >= 2)!;
    const { state, olaylar } = applyHero(createHand(h), { tür: "fold" });
    expect(state.result!.neden).toBe("hero-fold");
    expect(olaylar.some((o) => o.tür === "showdown" || o.tür === "sokak")).toBe(false);
    expect(chip(state)).toBe(state.toplamChip);
    expect(() => applyHero(state, { tür: "check" })).toThrow(/El bitti/);
    expect(legalActions(state)).toEqual({});
  });
});

describe("değişmezlik", () => {
  it("durum dondurulmuştur ve applyHero girdiyi değiştirmez", () => {
    const s = createHand(spot("c17"));
    const once = JSON.stringify(s);
    applyHero(s, { tür: "call" });
    expect(JSON.stringify(s)).toBe(once);
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.seats.BB)).toBe(true);
    expect(() => {
      (s.seats.BB as { stack: number }).stack = 0;
    }).toThrow();
  });
});
