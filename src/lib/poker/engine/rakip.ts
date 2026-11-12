// Deterministik rakip motoru. Kendi kartlarına, board'a ve açık aksiyonlara bakar;
// hero'nun kartlarını GÖRMEZ (hero'yu da aksiyon hattından tahmin edilen aralıkla değerlendirir).
// Bu bir solver değildir: el gücü, çekiş, pot odds, doku ve SPR'ye bakan sade kurallar.
import ranges from "@/data/ranges.json";
import { requiredEquity } from "../math";
import { SEATS, type Seat } from "../replay";
import { algilananAralik, siraYuzdesi } from "./araliklar";
import { CEKIS_FLOS, CEKIS_KENT, doku, equity, etiket, ikili, kartNo, tablo } from "./kartlar";
import { hayatta, legalFor } from "./kurallar";
import { akis, r2 } from "./rng";
import type { EngineState, Gizli, Hamle, LegalActions } from "./types";

type AcanPoz = "UTG" | "HJ" | "CO" | "BTN" | "SB";
const CASH = ranges.cash as Record<AcanPoz, string[]>;
const PUSH = ranges.push as Record<"6" | "10" | "15", Record<AcanPoz, string[]>>;

const MC_PREFLOP = 140;
const MC_POSTFLOP = 120;
const yarim = (n: number) => Math.round(n * 2) / 2;

/** İstenen toplamı yasal aralığa oturtur; stack'in büyük kısmı gidiyorsa all-in'e yuvarlar. */
function artir(legal: LegalActions, hedef: number): Hamle {
  const a = legal.bet ?? legal.raise;
  if (!a) return legal.call !== undefined ? { tür: "call" } : { tür: "check" };
  let to = Math.min(Math.max(yarim(hedef), a.min), a.max);
  if (to >= a.max * 0.7) to = a.max;
  return { tür: "raise", to: r2(to) };
}
const pasif = (legal: LegalActions): Hamle => (legal.check ? { tür: "check" } : { tür: "fold" });
const gor = (legal: LegalActions): Hamle => (legal.call !== undefined ? { tür: "call" } : { tür: "check" });

/** Karşısındaki asıl rakip: son artıran; yoksa hero; o da yoksa elde kalan ilk oyuncu. */
function asilRakip(s: EngineState, p: Seat): Seat {
  const canli = hayatta(s).filter((o) => o !== p);
  if (s.sonArtiran && s.sonArtiran !== p && canli.includes(s.sonArtiran)) return s.sonArtiran;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const k = s.history[i];
    if (k.artis && k.koltuk !== p && canli.includes(k.koltuk)) return k.koltuk;
  }
  return canli.includes(s.spot.heroPos) ? s.spot.heroPos : canli[0];
}

function preflop(s: EngineState, p: Seat, hole: number[], legal: LegalActions, rnd: () => number): Hamle {
  const st = s.seats[p];
  const l = etiket(hole[0], hole[1]);
  const y = siraYuzdesi(l);
  const stack = r2(st.stack + st.bet);
  const toCall = legal.call ?? 0;
  const u = rnd();

  if (s.raises === 0) {
    const limpers = s.history.filter((k) => k.sokak === "preflop" && k.aksiyon === "call").length;
    if (p === "BB" || toCall === 0) {
      if (legal.raise && y < 0.1) return artir(legal, 3.5 + limpers);
      return gor(legal);
    }
    const kisa = stack <= 15;
    const list = kisa ? PUSH[stack <= 8 ? "6" : stack <= 12 ? "10" : "15"][p as AcanPoz] : CASH[p as AcanPoz];
    if (legal.raise && list.includes(l)) {
      if (kisa) return { tür: "raise", to: legal.raise.max };
      return artir(legal, (p === "SB" ? 3 : 2.5) + limpers);
    }
    if (p === "SB" && toCall <= 0.5 && y < 0.55 && u < 0.5) return { tür: "call" };
    if (limpers > 0 && y < 0.35 && u < 0.5) return { tür: "call" };
    return { tür: "fold" };
  }

  // Önünde artırma var
  const rakip = asilRakip(s, p);
  const eq = equity(hole, [], algilananAralik(s, rakip, hole), rnd, MC_PREFLOP);
  const req = requiredEquity(s.pot, toCall);
  const allinKarsi = s.sonArtiran !== null && s.seats[s.sonArtiran].allin;
  const buyuk = toCall >= 0.4 * st.stack;
  const savas = s.raises >= 4;

  if (allinKarsi || buyuk || savas) {
    if (!allinKarsi && !savas && legal.raise && y < 0.03) return { tür: "raise", to: legal.raise.max };
    return eq >= req + 0.03 ? { tür: "call" } : { tür: "fold" };
  }

  if (s.raises === 1) {
    const blof = /^A[2-5]s$/.test(l) && u < 0.4;
    if (legal.raise && stack <= 20 && y < 0.1) return { tür: "raise", to: legal.raise.max };
    if (legal.raise && (y < 0.045 || blof)) {
      const pozisyonda = p === "BTN" || p === "CO";
      return artir(legal, s.currentBet * (pozisyonda ? 3 : 3.5));
    }
    const call = p === "BB" ? eq >= req + 0.04 && y < 0.6 : y < 0.17 && eq >= req;
    return call ? { tür: "call" } : { tür: "fold" };
  }

  // 3-bet ve sonrası
  if (legal.raise && y < 0.02) return artir(legal, s.currentBet * 2.3);
  return y < 0.1 && eq >= req + 0.05 ? { tür: "call" } : { tür: "fold" };
}

function postflop(s: EngineState, p: Seat, hole: number[], legal: LegalActions, rnd: () => number): Hamle {
  const st = s.seats[p];
  const board = s.board.map(kartNo);
  const t = tablo(board);
  const i = ikili(hole[0], hole[1]);
  const pct = t.pct[i];
  const river = s.sokak === "river";
  const cekis = river ? 0 : t.cekis[i];
  const flos = (cekis & CEKIS_FLOS) !== 0;
  const kent = (cekis & CEKIS_KENT) !== 0;
  const islak = doku(board).islak;

  const rakip = asilRakip(s, p);
  const eqTek = equity(hole, board, algilananAralik(s, rakip, [...hole, ...board]), rnd, MC_POSTFLOP);
  const nRakip = hayatta(s).length - 1;
  // Çok oyunculu potta kazanmak için hepsini geçmek gerekir: kaba düzeltme
  const eq = nRakip > 1 ? eqTek ** (1 + 0.6 * (nRakip - 1)) : eqTek;
  const spr = s.pot > 0 ? st.stack / s.pot : Infinity;
  const u = rnd();

  // Önceki sokakların son saldırganı bu oyuncu muydu
  let saldirgan = false;
  for (let k = s.history.length - 1; k >= 0; k--) {
    const h = s.history[k];
    if (h.sokak !== s.sokak && h.artis) {
      saldirgan = h.koltuk === p;
      break;
    }
  }

  if (legal.check) {
    if (!legal.bet) return { tür: "check" };
    const boyut = (f: number) => artir(legal, f * s.pot);
    if (eq >= 0.62 && pct >= 0.6) {
      if (!river && u < 0.15) return { tür: "check" }; // ara sıra slow play
      if (spr < 1.2) return { tür: "raise", to: legal.bet.max };
      return boyut(river ? 0.66 : islak ? 0.75 : 0.5);
    }
    if ((flos || kent) && u < (saldirgan ? 0.6 : 0.3)) return boyut(flos && kent ? 0.66 : 0.5);
    if (nRakip === 1 && saldirgan && s.sokak === "flop" && u < (islak ? 0.3 : 0.55)) return boyut(0.33);
    if (nRakip === 1 && river && eq < 0.2 && u < 0.2) return boyut(0.66);
    return { tür: "check" };
  }

  const toCall = legal.call ?? 0;
  const req = requiredEquity(s.pot, toCall);
  if (legal.raise && s.raises < 4) {
    if (eq >= 0.78 && u < (river ? 0.7 : 0.5)) {
      return spr < 2 ? { tür: "raise", to: legal.raise.max } : artir(legal, s.currentBet * 3);
    }
    if (flos && kent && s.sokak === "flop" && u < 0.3) return artir(legal, s.currentBet * 3);
  }
  // Çekişte ve arkada chip varken sonradan kazanılacak para için biraz pay bırakılır
  const pay = river ? 0.02 : (flos || kent) && st.stack > toCall * 2 ? -0.04 : 0.02;
  if (eq >= req + pay) return { tür: "call" };
  return pasif(legal);
}

/** Sırası gelen rakibin hamlesi. Aynı durum her zaman aynı hamleyi üretir. */
export function rakipKarar(s: EngineState, p: Seat, g: Gizli): Hamle {
  const legal = legalFor(s, p);
  const el = g.eller[p];
  if (!el) throw new Error(`${p} için el yok`);
  const hole = el.map(kartNo);
  const rnd = akis(s.seed, `${p}|${s.history.length}|${SEATS.indexOf(p)}`);
  const h = s.sokak === "preflop" ? preflop(s, p, hole, legal, rnd) : postflop(s, p, hole, legal, rnd);

  // Güvenlik: kuralın ürettiği hamle yasal değilse en yakın yasal hamleye indir
  if (h.tür === "fold" && !legal.fold) return { tür: "check" };
  if (h.tür === "check" && !legal.check) return { tür: "fold" };
  if (h.tür === "call" && legal.call === undefined) return { tür: "check" };
  if (h.tür === "raise" && !(legal.bet ?? legal.raise)) return gor(legal);
  return h;
}
