// Yeni alıştırma elleri ekler (src/data/extra.json). Her çalıştırmada farklı tohumla,
// mevcut id'lerle çakışmayan, cevabı tam sayımla kesinleşen spotlar üretir:
//   o-  turn'de all-in, rakibin kartları açık: kalan 44 river kartı tek tek sayılır.
//   f-  flop'ta all-in, rakibin kartları açık: kalan 990 turn+river ikilisi tek tek sayılır.
// Sınırda olan (equity ile gereken equity arasındaki fark %4'ten az) spotlar alınmaz.
// Çalıştırma: npm run hands -- [adet]   (varsayılan 40; yarısı turn, yarısı flop)
import { readFileSync, writeFileSync } from "node:fs";
import { evaluate7 } from "../src/lib/poker/evaluator.ts";

const COUNT = Number(process.argv[2] ?? 40);
const R = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = "shdc";
const SUIT_TR: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const cardStr = (c: number) => R[12 - (c >> 2)] + SUITS[c & 3];
const pretty = (cards: string) => (cards.match(/.{2}/g) ?? []).map((c) => (c[0] === "T" ? "10" : c[0]) + SUIT_TR[c[1]]).join(" ");
const pct = (x: number) => Math.round(x * 100);
const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const r2 = (n: number) => Math.round(n * 100) / 100;

let seed = Date.now() | 0;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const choice = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const extraUrl = new URL("../src/data/extra.json", import.meta.url);
const drills = JSON.parse(readFileSync(new URL("../src/data/drills.json", import.meta.url), "utf8")) as { id: string }[];
let extra: Record<string, unknown>[] = [];
try {
  extra = JSON.parse(readFileSync(extraUrl, "utf8"));
} catch {}
const ids = new Set([...drills.map((d) => d.id), ...extra.map((d) => d.id as string)]);
const usedSigs = new Set(extra.map((d) => `${d.hero}|${(d.villain as { cards: string }).cards}`));

const LOC: Record<string, string> = { HJ: "HJ", CO: "CO", BTN: "BTN" };
type Kind = "turn" | "flop";

function make(kind: Kind, want: { call: number; fold: number }) {
  const out: Record<string, unknown>[] = [];
  const nBoard = kind === "turn" ? 4 : 3;
  for (let guard = 0; guard < 400000 && want.call + want.fold > 0; guard++) {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 0; i < 4 + nBoard; i++) {
      const j = i + Math.floor(rnd() * (52 - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const hero = deck.slice(0, 2);
    const vil = deck.slice(2, 4);
    const board = deck.slice(4, 4 + nBoard);
    // Rakip şu an önde olmalı (eşitlik değil)
    const used = new Set(deck.slice(0, 4 + nBoard));
    if (evaluate7([...vil, ...board]) <= evaluate7([...hero, ...board])) continue;

    const rest: number[] = [];
    for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
    let wins = 0;
    let total = 0;
    if (kind === "turn") {
      for (const c of rest) {
        const h = evaluate7([...hero, ...board, c]);
        const v = evaluate7([...vil, ...board, c]);
        wins += h > v ? 1 : h === v ? 0.5 : 0;
        total++;
      }
      if (!Number.isInteger(wins)) continue;
    } else {
      for (let i = 0; i < rest.length; i++)
        for (let j = i + 1; j < rest.length; j++) {
          const h = evaluate7([...hero, ...board, rest[i], rest[j]]);
          const v = evaluate7([...vil, ...board, rest[i], rest[j]]);
          wins += h > v ? 1 : h === v ? 0.5 : 0;
          total++;
        }
    }
    const eq = wins / total;
    if (eq < 0.06 || eq > 0.5) continue;

    const opener = choice(["HJ", "CO", "BTN", "BTN"]);
    const heroIsBB = rnd() < 0.5;
    const S = kind === "turn" ? choice([15, 20, 25, 30, 40, 50, 60, 80]) : choice([12, 15, 20, 25, 30, 40, 50, 60, 100]);
    const flopBet = 2.75;
    const potFlop = 5.5;
    const potBefore = kind === "turn" ? potFlop + 2 * flopBet : potFlop;
    const shove = kind === "turn" ? S - 2.5 - flopBet : S - 2.5;
    const finalPot = potBefore + 2 * shove;
    const req = shove / finalPot;
    if (Math.abs(eq - req) < 0.04) continue;
    const ok = eq > req;
    if ((ok ? want.call : want.fold) <= 0) continue;

    const heroCards = hero.map(cardStr).join("");
    const vilCards = vil.map(cardStr).join("");
    const flop = board.slice(0, 3).map(cardStr).join("");
    const turn = kind === "turn" ? cardStr(board[3]) : "";
    const id = `${kind === "turn" ? "o" : "f"}-${heroCards}-${flop}${turn}`;
    if (ids.has(id) || usedSigs.has(`${heroCards}|${vilCards}`)) continue;

    const heroPos = heroIsBB ? "BB" : opener;
    const vilPos = heroIsBB ? opener : "BB";
    const pre = [`${opener} r2.5`, "SB f", "BB c", `F ${flop}`];
    let seq: string[];
    if (kind === "turn") {
      seq = [...pre, "BB x", `${opener} b${flopBet}`, "BB c", `T ${turn}`, ...(heroIsBB ? ["BB x", `${opener} a`] : ["BB a"])];
    } else {
      seq = [...pre, ...(heroIsBB ? ["BB x", `${opener} a`] : ["BB a"])];
    }
    ids.add(id);
    usedSigs.add(`${heroCards}|${vilCards}`);
    if (ok) want.call--;
    else want.fold--;

    const verdict = ok ? "Equity'n fiyattan yüksek, call kârlı." : "Equity'n fiyattan düşük, fold.";
    const mathPart =
      kind === "turn"
        ? `Rakibin elini yenen ${wins} river kartı var: ${wins}/44 ≈ %${pct(eq)}.`
        : `Turn ve river'ın ${total} olası ikilisi tek tek sayıldığında eşitlikler yarım sayılarak yaklaşık %${pct(eq)} equity'n var.`;
    const tip =
      kind === "turn"
        ? "All-in olduğu için sonradan kazanılacak ek chip yok; yalnızca bu hesap önemli."
        : "Flop'ta iki kart gelecek; hızlı tahmin için out sayısını 4 ile çarpabilirsin, ama backdoor ve split ihtimalleri sonucu değiştirebilir.";
    out.push({
      id,
      title: kind === "turn" ? `Turn all-in: ${wins} out ile call?` : `Flop all-in: ${pretty(heroCards)} ile call?`,
      game: "cash",
      street: kind,
      heroPos,
      stackBB: S,
      hero: heroCards,
      board: flop + turn,
      potBB: r2(potBefore + shove),
      seq,
      villain: { pos: vilPos, cards: vilCards },
      note: `Pot odds alıştırması: ${vilPos} ${kind === "turn" ? "turn" : "flop"}'${kind === "turn" ? "de" : "ta"} all-in yaptı ve kartlarını gösterdi (${pretty(vilCards)}). Efektif stack ${S} BB.`,
      options: ["Fold", `Call (${num(shove)} BB)`],
      correct: ok ? 1 : 0,
      topic: "odds",
      level: kind === "turn" ? 2 : 3,
      reasoning: `Call için ${num(shove)} BB ödeyip ${num(finalPot)} BB'lik pota giriyorsun; gereken equity %${pct(req)}. ${mathPart} ${verdict} ${tip}`,
    });
  }
  return out;
}

const half = Math.floor(COUNT / 2);
const split = (n: number) => ({ call: Math.ceil(n / 2), fold: Math.floor(n / 2) });
const added = [...make("turn", split(half)), ...make("flop", split(COUNT - half))];
extra.push(...added);
writeFileSync(extraUrl, JSON.stringify(extra));
console.log(`eklendi: ${added.length}, extra.json toplam: ${extra.length}`);
