// Oyun kuralları: karar anından kurulum, yasal aksiyonlar, aksiyon uygulama, sokak sonu,
// iade, yan potlar ve showdown. Rakip kararı ve rastgelelik burada yoktur; gizli kartlar
// (rakip elleri, açılmamış board) dışarıdan parametre olarak gelir ve duruma YAZILMAZ.
import { evaluate7 } from "../evaluator";
import { SEATS, replay, type Seat } from "../replay";
import { elAdi, kartNo } from "./kartlar";
import { hashStr, r2 } from "./rng";
import type {
  AcikEl,
  AksiyonTuru,
  BahisAraligi,
  EngineState,
  Gizli,
  Hamle,
  Kayit,
  Kazanan,
  Kisayol,
  Koltuk,
  LegalActions,
  Olay,
  PotPayi,
  Sokak,
  SonucNedeni,
  Spot,
} from "./types";

const EPS = 1e-9;
const idx = (s: Seat) => SEATS.indexOf(s);
const SONRAKI: Record<Sokak, Sokak | null> = { preflop: "flop", flop: "turn", turn: "river", river: null };
const BOARD_LEN: Record<Sokak, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

/** Değiştirilebilir çalışma kopyası. Dışarıya her zaman dondurulmuş durum verilir. */
export type Taslak = EngineState;

export function kopya(s: EngineState): Taslak {
  const seats = {} as Record<Seat, Koltuk>;
  for (const p of SEATS) seats[p] = { ...s.seats[p] };
  return {
    ...s,
    board: [...s.board],
    seats,
    history: [...s.history],
    decisions: [...s.decisions],
    olaylar: [...s.olaylar],
  };
}

export function dondur<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) dondur(v);
  }
  return o;
}

export const hayatta = (s: EngineState): Seat[] => SEATS.filter((p) => s.seats[p].present && !s.seats[p].folded);
export const konusabilir = (s: EngineState, p: Seat) => s.seats[p].present && !s.seats[p].folded && !s.seats[p].allin;

function ilkKonusan(s: EngineState, sokak: Sokak): number {
  if (sokak === "preflop") return 0;
  const n = SEATS.filter((p) => s.seats[p].present).length;
  // Heads-up'ta (SB buton) flop sonrası ilk konuşan BB'dir
  return n === 2 && !s.seats.BTN.present ? idx("BB") : idx("SB");
}

/** Spotun karar anındaki durumu. `replay` çıktısından kurulur; rakip kartı içermez. */
export function ilkDurum(spot: Spot): EngineState {
  const r = replay(spot);
  if (r.errors.length) throw new Error(`Spot oynatılamadı (${spot.id}): ${r.errors.join("; ")}`);

  const seats = {} as Record<Seat, Koltuk>;
  for (const p of SEATS) {
    const x = r.seats[p];
    seats[p] = {
      present: x.present,
      stack: x.stack,
      bet: x.bet,
      total: r2(x.start - x.stack),
      folded: x.folded,
      allin: x.allin,
      acted: false,
      start: x.start,
    };
  }

  // Aksiyon geçmişini yeniden yürü: açık kayıtlar, min raise ve "konuştu" bayrakları
  const history: Kayit[] = [];
  let sokak: Sokak = "preflop";
  let cur = 1;
  let lastRaise = 1;
  let raiseBase = 1;
  let raises = 0;
  let sonArtiran: Seat | null = null;
  let sonArtiranAllin = false;
  const bets = {} as Record<Seat, number>;
  const stacks = {} as Record<Seat, number>;
  const acted = {} as Record<Seat, boolean>;
  for (const p of SEATS) {
    stacks[p] = r.seats[p].start;
    bets[p] = 0;
    acted[p] = false;
  }
  const post = (p: Seat, amt: number) => {
    if (!r.seats[p].present) return;
    const a = Math.min(amt, stacks[p]);
    stacks[p] = r2(stacks[p] - a);
    bets[p] = a;
  };
  post("SB", 0.5);
  post("BB", 1);

  for (const e of r.entries) {
    if (e.kind === "street") {
      sokak = e.street;
      cur = 0;
      lastRaise = 1;
      raiseBase = 0;
      raises = 0;
      sonArtiran = null;
      sonArtiranAllin = false;
      for (const p of SEATS) {
        bets[p] = 0;
        acted[p] = false;
      }
      continue;
    }
    const p = e.pos;
    const before = bets[p];
    const after = e.amount ?? before;
    const artis = (e.act === "raise" || e.act === "bet" || e.act === "allin") && after > cur + EPS;
    const aksiyon: AksiyonTuru = e.act === "limp" ? "call" : e.act;
    history.push({
      sokak,
      koltuk: p,
      aksiyon,
      miktar: after,
      eklenen: r2(after - before),
      artis,
      oncekiArtis: raises,
      efektif: r2(stacks[p] + before),
      allinKarsi: sonArtiran && sonArtiranAllin ? cur : null,
    });
    stacks[p] = r2(stacks[p] - (after - before));
    bets[p] = after;
    acted[p] = true;
    if (artis) {
      const inc = after - cur;
      if (inc >= lastRaise - EPS) {
        lastRaise = r2(inc);
        raiseBase = after;
        for (const o of SEATS) if (o !== p) acted[o] = false;
      } else if (after - raiseBase >= lastRaise - EPS) {
        raiseBase = after;
        for (const o of SEATS) if (o !== p) acted[o] = false;
      }
      cur = after;
      raises++;
      sonArtiran = p;
      sonArtiranAllin = e.act === "allin";
    }
  }
  for (const p of SEATS) seats[p].acted = acted[p];

  let onMasa = 0;
  for (const p of SEATS) onMasa += seats[p].bet;
  let chips = r.pot;
  for (const p of SEATS) if (seats[p].present) chips += seats[p].stack;

  const board = (spot.board.match(/.{2}/g) ?? []) as string[];
  return {
    spot,
    seed: hashStr(spot.id),
    asama: r.street,
    sokak: r.street,
    board,
    seats,
    collected: r2(r.pot - onMasa),
    pot: r.pot,
    currentBet: cur,
    lastRaise,
    raiseBase,
    raises,
    sonArtiran,
    ptr: idx(spot.heroPos),
    toAct: spot.heroPos,
    history,
    decisions: [],
    olaylar: [],
    result: null,
    toplamChip: r2(chips),
  };
}

function kararGerekli(s: EngineState, p: Seat): boolean {
  if (!konusabilir(s, p)) return false;
  const st = s.seats[p];
  if (st.bet < s.currentBet - EPS) return true;
  if (st.acted) return false;
  // Bahsi eşit ve henüz konuşmadı: konuşabilecek başka kimse yoksa karar da yok
  return SEATS.some((o) => o !== p && konusabilir(s, o));
}

export function siradaki(s: EngineState): Seat | null {
  for (let i = 0; i < SEATS.length; i++) {
    const p = SEATS[(s.ptr + i) % SEATS.length];
    if (kararGerekli(s, p)) return p;
  }
  return null;
}

const yarim = (n: number) => Math.round(n * 2) / 2;

/** Bir koltuğun yasal aksiyonları (sırası onda olmalı). */
export function legalFor(s: EngineState, p: Seat): LegalActions {
  const st = s.seats[p];
  if (s.result || !konusabilir(s, p)) return {};
  const out: LegalActions = {};
  const toCall = r2(Math.min(Math.max(s.currentBet - st.bet, 0), st.stack));
  if (toCall > 0) {
    out.fold = true;
    out.call = toCall;
  } else {
    out.check = true;
  }

  const baskaVar = SEATS.some((o) => o !== p && konusabilir(s, o));
  // Eksik all-in aksiyonu yeniden açmaz: son tam artırmadan beri konuşan oyuncu yalnızca call/fold yapabilir
  const acik = !st.acted;
  if (st.stack > toCall + EPS && baskaVar && acik) {
    const max = r2(st.bet + st.stack);
    const min = s.currentBet === 0 ? Math.min(1, max) : Math.min(r2(s.currentBet + s.lastRaise), max);
    const kısayollar: Kisayol[] = [];
    const ekle = (etiket: string, f: number) => {
      // Bahis: pot'un f katı. Raise: önce call, sonra oluşan potun f katı kadar artış.
      const ham = s.currentBet === 0 ? f * s.pot : s.currentBet + f * (s.pot + toCall);
      const m = Math.min(Math.max(yarim(ham), min), max);
      if (m < max && !kısayollar.some((k) => k.miktar === m)) kısayollar.push({ etiket, miktar: m });
    };
    ekle("1/3 pot", 1 / 3);
    ekle("1/2 pot", 1 / 2);
    ekle("3/4 pot", 3 / 4);
    ekle("Pot", 1);
    kısayollar.push({ etiket: "All-in", miktar: max });
    const aralik: BahisAraligi = { min, max, kısayollar };
    if (s.currentBet === 0) out.bet = aralik;
    else out.raise = aralik;
  }
  return out;
}

/** Hamleyi yasallığa göre doğrular; yasal değilse Türkçe hata fırlatır. */
export function dogrula(s: EngineState, p: Seat, h: Hamle): Hamle {
  const legal = legalFor(s, p);
  if (s.toAct !== p) throw new Error(`Sıra ${p} oyuncusunda değil`);
  switch (h.tür) {
    case "fold":
      if (!legal.fold) throw new Error("Önünde bahis yokken fold gerekmez; check edebilirsin");
      return h;
    case "check":
      if (!legal.check) throw new Error("Önünde bahis var; check edilemez");
      return h;
    case "call":
      if (legal.call === undefined) throw new Error("Call edilecek bahis yok");
      return h;
    case "raise": {
      const a = legal.bet ?? legal.raise;
      if (!a) throw new Error("Bu durumda bahis ya da raise yapılamaz");
      const to = r2(h.to);
      if (to > a.max + EPS) throw new Error("Miktar stack'ten büyük");
      if (to < a.min - EPS) throw new Error(`Minimum ${a.min} BB olmalı`);
      return { tür: "raise", to: Math.min(to, a.max) };
    }
  }
}

function olayAksiyon(d: Taslak, p: Seat, aksiyon: AksiyonTuru, eklenen: number, ev: Olay[]) {
  const st = d.seats[p];
  ev.push({ tür: "aksiyon", koltuk: p, aksiyon, miktar: st.bet, eklenen, stack: st.stack, pot: d.pot });
}

/** Doğrulanmış hamleyi taslağa uygular. */
export function uygula(d: Taslak, p: Seat, h: Hamle, ev: Olay[]): void {
  const st = d.seats[p];
  const before = st.bet;
  const efektif = r2(st.stack + st.bet);
  const oncekiArtis = d.raises;
  const allinKarsi = d.sonArtiran && d.seats[d.sonArtiran].allin ? d.currentBet : null;
  let aksiyon: AksiyonTuru;
  let artis = false;

  const koy = (to: number) => {
    const add = r2(Math.min(to - st.bet, st.stack));
    st.stack = r2(st.stack - add);
    st.bet = r2(st.bet + add);
    st.total = r2(st.total + add);
    d.pot = r2(d.pot + add);
    if (st.stack <= EPS) {
      st.stack = 0;
      st.allin = true;
    }
  };

  switch (h.tür) {
    case "fold":
      st.folded = true;
      aksiyon = "fold";
      break;
    case "check":
      aksiyon = "check";
      break;
    case "call":
      koy(d.currentBet);
      // replay.ts ile aynı: stack'i bitiren call da "call"dır; olaydaki stack 0 olur
      aksiyon = "call";
      break;
    case "raise": {
      const bahis = d.currentBet === 0;
      koy(h.to);
      const inc = st.bet - d.currentBet;
      if (inc > EPS) {
        artis = true;
        if (inc >= d.lastRaise - EPS) {
          d.lastRaise = r2(inc);
          d.raiseBase = st.bet;
          for (const o of SEATS) if (o !== p) d.seats[o].acted = false;
        } else if (st.bet - d.raiseBase >= d.lastRaise - EPS) {
          // Art arda eksik all-in'ler toplamda tam artış ettiyse aksiyon yeniden açılır
          d.raiseBase = st.bet;
          for (const o of SEATS) if (o !== p) d.seats[o].acted = false;
        }
        d.currentBet = st.bet;
        d.raises++;
        d.sonArtiran = p;
      }
      aksiyon = st.allin ? "allin" : bahis ? "bet" : "raise";
      break;
    }
  }
  st.acted = true;
  d.ptr = idx(p) + 1;
  d.history.push({
    sokak: d.sokak,
    koltuk: p,
    aksiyon,
    miktar: st.bet,
    eklenen: r2(st.bet - before),
    artis,
    oncekiArtis,
    efektif,
    allinKarsi,
  });
  olayAksiyon(d, p, aksiyon, r2(st.bet - before), ev);
}

/** Karşılanmayan bahis fazlasını sahibine geri verir. */
function iade(d: Taslak, ev: Olay[]) {
  let top: Seat | null = null;
  let ikinci = 0;
  for (const p of SEATS) {
    const b = d.seats[p].bet;
    if (top === null || b > d.seats[top].bet) {
      if (top !== null) ikinci = Math.max(ikinci, d.seats[top].bet);
      top = p;
    } else {
      ikinci = Math.max(ikinci, b);
    }
  }
  if (top === null) return;
  const st = d.seats[top];
  const fark = r2(st.bet - ikinci);
  if (fark <= EPS || st.folded) return;
  st.bet = r2(st.bet - fark);
  st.total = r2(st.total - fark);
  st.stack = r2(st.stack + fark);
  st.allin = false;
  d.pot = r2(d.pot - fark);
  d.currentBet = st.bet;
  ev.push({ tür: "iade", koltuk: top, miktar: fark, pot: d.pot });
}

function topla(d: Taslak) {
  for (const p of SEATS) {
    d.collected = r2(d.collected + d.seats[p].bet);
    d.seats[p].bet = 0;
    d.seats[p].acted = false;
  }
  d.currentBet = 0;
  d.lastRaise = 1;
  d.raiseBase = 0;
  d.raises = 0;
  d.sonArtiran = null;
}

function bitir(d: Taslak, neden: SonucNedeni, potlar: PotPayi[], kazananlar: Kazanan[], dagitilan: number, ev: Olay[]) {
  const hero = d.seats[d.spot.heroPos];
  d.result = { neden, pot: r2(dagitilan), potlar, kazananlar, heroNet: r2(hero.stack - hero.start) };
  d.asama = "sonuç";
  d.toAct = null;
  ev.push({ tür: "sonuç", ...d.result });
}

/** Tek oyuncu kaldı: pot ona gider, kart açılmaz. */
function tekKalan(d: Taslak, neden: SonucNedeni, ev: Olay[]) {
  iade(d, ev);
  topla(d);
  const [w] = hayatta(d);
  const pot = d.collected;
  d.seats[w].stack = r2(d.seats[w].stack + pot);
  d.collected = 0;
  d.pot = 0;
  bitir(d, neden, [{ miktar: pot, adaylar: [w], kazananlar: [w] }], [{ koltuk: w, miktar: pot }], pot, ev);
}

/** Ana pot ve yan potlar: her seviye için o seviyeye kadar koyan herkesin payı. */
export function potlariHesapla(d: EngineState): { cent: number; adaylar: Seat[] }[] {
  const c = (n: number) => Math.round(n * 100);
  const canli = hayatta(d);
  const seviyeler = [...new Set(canli.map((p) => c(d.seats[p].total)))].sort((a, b) => a - b);
  const out: { cent: number; adaylar: Seat[] }[] = [];
  let prev = 0;
  let dagitilan = 0;
  for (const lv of seviyeler) {
    let cent = 0;
    for (const p of SEATS) {
      const t = c(d.seats[p].total);
      cent += Math.min(t, lv) - Math.min(t, prev);
    }
    const adaylar = canli.filter((p) => c(d.seats[p].total) >= lv);
    if (cent > 0) out.push({ cent, adaylar });
    dagitilan += cent;
    prev = lv;
  }
  // Ante (ölü para) ve varsa artan: ana pota
  const kalan = c(d.pot) - dagitilan;
  if (out.length === 0) out.push({ cent: kalan, adaylar: canli });
  else out[0].cent += kalan;
  // Aynı adaylara sahip ardışık potları birleştir
  const birlesik: { cent: number; adaylar: Seat[] }[] = [];
  for (const p of out) {
    const son = birlesik[birlesik.length - 1];
    if (son && son.adaylar.join() === p.adaylar.join()) son.cent += p.cent;
    else birlesik.push(p);
  }
  return birlesik;
}

function showdown(d: Taslak, g: Gizli, ev: Olay[]) {
  const hero = d.spot.heroPos;
  const board = d.board.map(kartNo);
  const canli = hayatta(d);
  const eller: AcikEl[] = [];
  const deger = {} as Record<Seat, number>;
  const ad = {} as Record<Seat, string>;
  for (const p of canli) {
    const k = p === hero ? ((d.spot.hero.match(/.{2}/g) ?? []) as string[]) : g.eller[p];
    if (!k) throw new Error(`${p} için el yok`);
    const cards = [...k.map(kartNo), ...board];
    deger[p] = evaluate7(cards);
    ad[p] = elAdi(cards);
    eller.push({ koltuk: p, kartlar: [...k], elAdi: ad[p] });
  }
  ev.push({ tür: "showdown", board: [...d.board], eller });

  const potlar: PotPayi[] = [];
  const kazanc = new Map<Seat, number>();
  for (const pot of potlariHesapla(d)) {
    const best = Math.max(...pot.adaylar.map((p) => deger[p]));
    const kazananlar = pot.adaylar.filter((p) => deger[p] === best);
    const pay = Math.floor(pot.cent / kazananlar.length);
    let artan = pot.cent - pay * kazananlar.length;
    for (const p of kazananlar) {
      const ek = artan > 0 ? 1 : 0;
      artan -= ek;
      kazanc.set(p, (kazanc.get(p) ?? 0) + pay + ek);
    }
    potlar.push({ miktar: pot.cent / 100, adaylar: pot.adaylar, kazananlar });
  }
  const dagitilan = d.pot;
  const kazananlar: Kazanan[] = [];
  for (const p of SEATS) {
    const cent = kazanc.get(p);
    if (!cent) continue;
    d.seats[p].stack = r2(d.seats[p].stack + cent / 100);
    kazananlar.push({ koltuk: p, miktar: cent / 100, elAdi: ad[p] });
  }
  d.collected = 0;
  d.pot = 0;
  bitir(d, "showdown", potlar, kazananlar, dagitilan, ev);
}

function sokakAc(d: Taslak, g: Gizli, ev: Olay[]) {
  const sonraki = SONRAKI[d.sokak];
  if (!sonraki) throw new Error("River'dan sonra sokak yok");
  const yeni = g.board.slice(d.board.length, BOARD_LEN[sonraki]);
  d.board = [...d.board, ...yeni];
  d.sokak = sonraki;
  d.asama = sonraki;
  d.ptr = ilkKonusan(d, sonraki);
  ev.push({ tür: "sokak", sokak: sonraki as "flop" | "turn" | "river", kartlar: yeni, board: [...d.board], pot: d.pot });
}

/**
 * Durumu bir sonraki karara kadar ilerletir: sıradaki oyuncuyu belirler; sokak bittiyse
 * bahisleri toplar, yeni sokağı açar; herkes all-in ise kalan kartları açıp showdown yapar.
 */
export function ilerlet(d: Taslak, g: Gizli, ev: Olay[]): void {
  for (let guard = 0; guard < 12 && !d.result; guard++) {
    if (hayatta(d).length === 1) {
      tekKalan(d, "herkes-fold", ev);
      return;
    }
    const p = siradaki(d);
    if (p) {
      d.toAct = p;
      return;
    }
    // Sokak bitti
    iade(d, ev);
    topla(d);
    if (d.sokak === "river") {
      showdown(d, g, ev);
      return;
    }
    sokakAc(d, g, ev);
  }
}

/** Hero fold etti: el hemen biter. Tek rakip kaldıysa pot ona gider; birden çok rakip varsa el oynatılmaz. */
export function heroFoldBitir(d: Taslak, ev: Olay[]): void {
  if (hayatta(d).length === 1) {
    tekKalan(d, "hero-fold", ev);
    return;
  }
  bitir(d, "hero-fold", [], [], 0, ev);
}
