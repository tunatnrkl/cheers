// Tüm spotlar için: kurulum, pasif hatla showdown/sonuca ulaşma, fold, chip korunumu,
// kart çakışması, determinizm ve gizlilik (el bitmeden rakip kartı yok).
import { describe, expect, it } from "vitest";
import { HANDS } from "@/data/hands";
import { SEATS } from "../replay";
import { gizliDagitim } from "./araliklar";
import { applyHero, createHand, legalActions } from "./index";
import { mulberry32 } from "./rng";
import type { EngineState, HeroAksiyon, LegalActions, Olay } from "./types";

const pasif = (l: LegalActions): HeroAksiyon => (l.check ? { tür: "check" } : { tür: "call" });

function chip(s: EngineState) {
  let sum = s.pot;
  for (const p of SEATS) if (s.seats[p].present) sum += s.seats[p].stack;
  return Math.round(sum * 100) / 100;
}

/** Hero'nun hattını bir politikayla oynatır; her adımda denetim fonksiyonunu çağırır. */
function oyna(
  s0: EngineState,
  politika: (s: EngineState, l: LegalActions, i: number) => HeroAksiyon,
  denetle?: (s: EngineState, ev: Olay[]) => void,
) {
  let s = s0;
  const tum: Olay[] = [];
  for (let i = 0; i < 40 && !s.result; i++) {
    const r = applyHero(s, politika(s, legalActions(s), i));
    s = r.state;
    tum.push(...r.olaylar);
    denetle?.(s, r.olaylar);
  }
  return { s, tum };
}

/** Rastgele ama tohumlu hero politikası: agresif hatları da dener. */
function karisik(seed: number) {
  const rnd = mulberry32(seed);
  return (_s: EngineState, l: LegalActions, i: number): HeroAksiyon => {
    const opts: HeroAksiyon[] = [];
    if (l.fold && i > 0) opts.push({ tür: "fold" });
    if (l.check) opts.push({ tür: "check" });
    if (l.call !== undefined) opts.push({ tür: "call" });
    const a = l.bet ?? l.raise;
    if (a) {
      const k = a.kısayollar[Math.floor(rnd() * a.kısayollar.length)];
      opts.push({ tür: l.bet ? "bet" : "raise", miktar: k.miktar });
    }
    return opts[Math.floor(rnd() * opts.length)];
  };
}

const kartlar = (s: string | undefined) => (s ?? "").match(/.{2}/g) ?? [];

describe("tüm spotlar", () => {
  it("motor kurulur, sıra hero'da, pot ve board spotla aynı", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const s = createHand(h);
      if (s.toAct !== h.heroPos) bad.push(`${h.id}: sıra ${s.toAct}`);
      if (Math.abs(s.pot - h.potBB) > 0.051) bad.push(`${h.id}: pot ${s.pot} / ${h.potBB}`);
      if (s.board.join("") !== (h.board ?? "")) bad.push(`${h.id}: board`);
      const l = legalActions(s);
      if (!l.check && l.call === undefined) bad.push(`${h.id}: pasif aksiyon yok`);
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("hero her sokakta check/call seçince el hatasız river'a ve showdown'a ulaşır; chip korunur; kart çakışmaz", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      try {
        const { s, tum } = oyna(createHand(h), (_s, l) => pasif(l), (st) => {
          if (chip(st) !== st.toplamChip) bad.push(`${h.id}: chip ${chip(st)} / ${st.toplamChip}`);
        });
        if (!s.result) {
          bad.push(`${h.id}: el bitmedi`);
          continue;
        }
        // Hero hiç fold etmediği için el ya showdown'a gider ya da rakipler fold eder
        if (s.result.neden === "hero-fold") bad.push(`${h.id}: hero fold görünüyor`);
        if (s.result.neden === "showdown") {
          if (s.board.length !== 5) bad.push(`${h.id}: river açılmadı`);
          const sd = tum.find((o) => o.tür === "showdown");
          if (!sd || sd.tür !== "showdown") {
            bad.push(`${h.id}: showdown olayı yok`);
            continue;
          }
          const hepsi = [...s.board, ...sd.eller.flatMap((e) => e.kartlar)];
          if (new Set(hepsi).size !== hepsi.length) bad.push(`${h.id}: kart çakışması ${hepsi.join(" ")}`);
          const heroEl = sd.eller.find((e) => e.koltuk === h.heroPos);
          if (heroEl?.kartlar.join("") !== h.hero) bad.push(`${h.id}: hero eli yanlış`);
        }
        const dagitilan = s.result.kazananlar.reduce((a, k) => a + k.miktar, 0);
        if (Math.abs(dagitilan - s.result.pot) > 0.011) bad.push(`${h.id}: dağıtılan ${dagitilan} / pot ${s.result.pot}`);
        // İlk karar spotun yazılı cevabıyla değerlendirilir (postflop'ta seçeneklerde olmayan hamle hariç)
        if (s.decisions.length < 1 || (h.street === "preflop" && s.decisions[0].tahmini)) bad.push(`${h.id}: ilk karar tahmini olmamalı`);
        if (s.decisions.slice(1).some((d) => !d.tahmini)) bad.push(`${h.id}: sonraki kararlar tahmini olmalı`);
      } catch (e) {
        bad.push(`${h.id}: ${(e as Error).message}`);
      }
    }
    expect(bad, bad.slice(0, 20).join("; ")).toEqual([]);
  });

  it("hero fold edince el hemen biter ve hiçbir kart açılmaz", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const s = createHand(h);
      if (!legalActions(s).fold) continue;
      const { state, olaylar } = applyHero(s, { tür: "fold" });
      if (state.result?.neden !== "hero-fold") bad.push(`${h.id}: ${state.result?.neden}`);
      if (olaylar.length > 3 || olaylar.some((o) => o.tür === "sokak" || o.tür === "showdown")) bad.push(`${h.id}: fold sonrası oyun sürdü`);
      if (state.board.join("") !== (h.board ?? "")) bad.push(`${h.id}: board değişti`);
      if (chip(state) !== state.toplamChip) bad.push(`${h.id}: chip`);
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("karışık (agresif dahil) hatlarda da kurallar bozulmaz: chip korunur, el biter, kart çakışmaz", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      try {
        const { s, tum } = oyna(createHand(h), karisik(h.id.length * 31 + 7), (st) => {
          if (chip(st) !== st.toplamChip) bad.push(`${h.id}: chip`);
          for (const p of SEATS) if (st.seats[p].stack < 0) bad.push(`${h.id}: negatif stack`);
        });
        if (!s.result) bad.push(`${h.id}: el bitmedi`);
        const sd = tum.find((o) => o.tür === "showdown");
        if (sd && sd.tür === "showdown") {
          const hepsi = [...s.board, ...sd.eller.flatMap((e) => e.kartlar)];
          if (new Set(hepsi).size !== hepsi.length) bad.push(`${h.id}: kart çakışması`);
        }
      } catch (e) {
        bad.push(`${h.id}: ${(e as Error).message}`);
      }
    }
    expect(bad, bad.slice(0, 20).join("; ")).toEqual([]);
  });
});

describe("determinizm", () => {
  it("aynı spot + aynı hero hattı → aynı olaylar, aynı board, aynı rakip hattı", () => {
    for (const h of HANDS.filter((_, i) => i % 7 === 0)) {
      const a = oyna(createHand(h), karisik(99));
      const b = oyna(createHand(h), karisik(99));
      expect(JSON.stringify(b.tum)).toBe(JSON.stringify(a.tum));
      expect(JSON.stringify(b.s)).toBe(JSON.stringify(a.s));
    }
  });

  it("rakip elleri ve kalan board yalnızca spota bağlıdır ve hero/board ile çakışmaz", () => {
    for (const h of HANDS) {
      const s1 = createHand(h);
      const g1 = gizliDagitim(s1.spot);
      const g2 = gizliDagitim(createHand(h).spot);
      expect(g2).toEqual(g1);
      const hepsi = [...kartlar(h.hero), ...g1.board, ...Object.values(g1.eller).flat()];
      expect(new Set(hepsi).size).toBe(hepsi.length);
      expect(g1.board.slice(0, kartlar(h.board).length).join("")).toBe(h.board ?? "");
      for (const p of SEATS) {
        const elde = s1.seats[p].present && !s1.seats[p].folded && p !== h.heroPos;
        expect(Boolean(g1.eller[p])).toBe(elde);
      }
    }
  });
});

describe("gizlilik", () => {
  /**
   * Metindeki kart dizileri: harf/rakamla sınırlanmamış, ardışık "rank+renk" çiftleri ("As", "AhKd",
   * "Kh9h3c"). Böylece "toAct" gibi anahtarlardaki "Ac" kart sayılmaz.
   */
  function kartTokenlari(metin: string): Set<string> {
    const out = new Set<string>();
    for (const m of metin.matchAll(/(?<![A-Za-z0-9])((?:[2-9TJQKA][shdc])+)(?![A-Za-z0-9])/g)) {
      for (const c of m[1].match(/.{2}/g) ?? []) out.add(c);
    }
    return out;
  }
  /** Durumda ya da olaylarda gizli kart (rakip eli ya da açılmamış board kartı) aranır. */
  function sizinti(metin: string, gizli: string[]) {
    const t = kartTokenlari(metin);
    return gizli.filter((c) => t.has(c));
  }

  it("kart tarayıcısı anahtar adlarını kart saymaz, kart dizilerini yakalar", () => {
    expect([...kartTokenlari('{"toAct":"BTN","Ace":1}')]).toEqual([]);
    expect([...kartTokenlari('["As","Kd"] F Kh9h3c o-Qc4c-3cTh')].sort()).toEqual(["3c", "4c", "9h", "As", "Kd", "Kh", "Qc", "Th"].sort());
  });

  it("el bitmeden serileştirilmiş durumda ve olaylarda rakip kartı ya da açılmamış board kartı yok", () => {
    const bad: string[] = [];
    for (const h of HANDS) {
      const s0 = createHand(h);
      const g = gizliDagitim(s0.spot);
      const rakipKartlari = Object.values(g.eller).flat() as string[];
      for (const politika of [(_s: EngineState, l: LegalActions) => pasif(l), karisik(h.id.length)]) {
        let s = s0;
        const once: string[] = [];
        for (let i = 0; i < 40 && !s.result; i++) {
          const acik = new Set(s.board);
          const gizli = [...rakipKartlari, ...g.board.filter((c) => !acik.has(c))];
          const x = sizinti(JSON.stringify(s), gizli);
          if (x.length) bad.push(`${h.id}: durumda ${x.join(",")}`);
          const { state, olaylar } = applyHero(s, politika(s, legalActions(s), i));
          // Showdown olayından ÖNCEKİ olaylarda rakip kartı yok
          const sd = olaylar.findIndex((o) => o.tür === "showdown");
          const onceki = sd >= 0 ? olaylar.slice(0, sd) : olaylar;
          once.push(...onceki.map((o) => JSON.stringify(o)));
          const y = sizinti(once.join(""), rakipKartlari);
          if (y.length) bad.push(`${h.id}: olaylarda ${y.join(",")}`);
          s = state;
        }
        // Showdown'a gidilmediyse rakip eli hiç açıklanmaz (sonuç dahil)
        if (s.result && s.result.neden !== "showdown") {
          const z = sizinti(JSON.stringify(s), rakipKartlari);
          if (z.length) bad.push(`${h.id}: showdown'sız sonuçta ${z.join(",")}`);
        }
      }
    }
    expect(bad, bad.slice(0, 20).join("; ")).toEqual([]);
  });

  it("durumda villain alanı ya da spot notu taşınmaz", () => {
    const h = HANDS.find((x) => x.villain)!;
    const json = JSON.stringify(createHand(h));
    expect(json).not.toContain("villain");
    expect(json).not.toContain(h.villain!.cards);
    expect(json).not.toContain("kartlarını gösterdi");
  });
});
