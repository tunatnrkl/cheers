// Aralık modeli: bir oyuncunun HERKESE AÇIK aksiyon hattından tahmini el aralığı.
// Hem rakip elinin tohumla seçilmesinde hem de equity hesaplarında (hero'nun değerlendirmesi,
// rakip kararları) aynı model kullanılır. Kimsenin gerçek kartına bakmaz.
import ranges from "@/data/ranges.json";
import { SEATS, type Seat } from "../replay";
import { CEKIS_FLOS, CEKIS_KENT, etiket, ikili, kartAdi, kartNo, tablo, type AgirlikliEl } from "./kartlar";
import { ilkDurum } from "./kurallar";
import { akis } from "./rng";
import type { EngineState, Gizli, Kayit, Sokak, Spot } from "./types";

type PushDerinlik = "6" | "10" | "15";
type AcanPoz = "UTG" | "HJ" | "CO" | "BTN" | "SB";
const CASH = ranges.cash as Record<AcanPoz, string[]>;
const PUSH = ranges.push as Record<PushDerinlik, Record<AcanPoz, string[]>>;
const EQ = ranges.equity as Record<string, number>;

const kombo = (l: string) => (l.length === 2 ? 6 : l.endsWith("s") ? 4 : 12);

/** 169 el, güçlüden zayıfa: önce en geniş itme listesinin sırası, kalanlar rastgele ele karşı equity'ye göre. */
const SIRA: string[] = (() => {
  const bas = PUSH["6"].SB;
  const set = new Set(bas);
  const kalan = Object.keys(EQ)
    .filter((l) => !set.has(l))
    .sort((x, y) => EQ[y] - EQ[x]);
  return [...bas, ...kalan];
})();

/** Etiketin sıralamadaki başlangıç yüzdeliği (0 = en güçlü). */
const YUZDE = new Map<string, number>();
{
  let n = 0;
  for (const l of SIRA) {
    YUZDE.set(l, n / 1326);
    n += kombo(l);
  }
}
export const siraYuzdesi = (l: string) => YUZDE.get(l) ?? 1;

/** Etiket → somut kombinasyonlar */
const KOMBOLAR = new Map<string, [number, number][]>();
for (let a = 0; a < 52; a++) {
  for (let b = a + 1; b < 52; b++) {
    const l = etiket(a, b);
    const list = KOMBOLAR.get(l) ?? [];
    list.push([a, b]);
    KOMBOLAR.set(l, list);
  }
}

type Agirliklar = Map<string, number>;

function bant(m: Agirliklar, lo: number, hi: number, w = 1): Agirliklar {
  for (const l of SIRA) {
    const y = siraYuzdesi(l);
    if (y >= lo - 1e-9 && y < hi) m.set(l, Math.max(m.get(l) ?? 0, w));
  }
  return m;
}
const liste = (ls: string[]): Agirliklar => new Map(ls.map((l) => [l, 1]));
const pushDerinlik = (stack: number): PushDerinlik => (stack <= 8 ? "6" : stack <= 12 ? "10" : "15");
const acan = (p: Seat): AcanPoz => (p === "BB" ? "SB" : p);

/** Preflop hattından etiket ağırlıkları. Son gönüllü aksiyon belirleyicidir. */
export function preflopAraligi(history: Kayit[], p: Seat): Agirliklar {
  let son: Kayit | null = null;
  for (const k of history) {
    if (k.sokak === "preflop" && k.koltuk === p && k.aksiyon !== "fold" && k.aksiyon !== "check") son = k;
  }
  // Henüz gönüllü para koymadı (sırası gelmedi ya da BB check): her el olabilir
  if (!son) return bant(new Map(), 0, 1.01);

  const allin = son.aksiyon === "allin";
  if (son.artis) {
    if (son.oncekiArtis === 0) {
      if (allin) return son.efektif <= 20 ? liste(PUSH[pushDerinlik(son.efektif)][acan(p)]) : bant(new Map(), 0, 0.06);
      return p === "BB" ? bant(new Map(), 0, 0.12) : liste(CASH[p]);
    }
    if (son.oncekiArtis === 1) {
      if (allin) return bant(new Map(), 0, son.efektif <= 25 ? 0.11 : 0.04);
      const m = bant(new Map(), 0, 0.05);
      for (const l of ["A5s", "A4s", "A3s", "A2s"]) if (!m.has(l)) m.set(l, 0.5);
      return m;
    }
    return bant(new Map(), 0, allin && son.efektif <= 25 ? 0.06 : 0.03);
  }

  // Call (ya da artırmayan all-in)
  if (son.oncekiArtis === 0) return bant(new Map(), 0.06, 0.6);
  if (son.oncekiArtis === 1) {
    if (son.allinKarsi !== null) {
      const s = son.allinKarsi;
      return bant(new Map(), 0, s <= 8 ? 0.35 : s <= 12 ? 0.26 : s <= 20 ? 0.17 : 0.06);
    }
    if (p === "BB") return bant(bant(new Map(), 0, 0.02, 0.3), 0.02, 0.5);
    return bant(bant(new Map(), 0, 0.025, 0.3), 0.025, 0.2);
  }
  if (son.allinKarsi !== null) return bant(new Map(), 0, son.allinKarsi <= 15 ? 0.12 : 0.06);
  return bant(bant(new Map(), 0, 0.01, 0.4), 0.01, 0.09);
}

const BOARD_LEN: Record<Sokak, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

/** Flop sonrası bir aksiyonun, elin o sokaktaki gücüne göre ağırlık çarpanı. */
function carpan(k: Kayit, pct: number, cekis: number): number {
  const guclu = (cekis & (CEKIS_FLOS | CEKIS_KENT)) !== 0 && k.sokak !== "river";
  if (k.artis) {
    // Raise ve all-in: daha kutuplu, daha çok value
    if (k.oncekiArtis > 0 || k.aksiyon === "allin") {
      if (pct >= 0.88) return 1;
      if (guclu) return 0.4;
      return pct >= 0.6 ? 0.15 : 0.1;
    }
    // Bahis: güçlü el + çekiş + blöf karışımı
    if (pct >= 0.8) return 1;
    if (guclu) return 0.7;
    return pct >= 0.55 ? 0.45 : 0.25;
  }
  if (k.aksiyon === "call" || k.aksiyon === "allin") {
    if (pct >= 0.85) return 0.6;
    if (pct >= 0.45 || guclu) return 1;
    return k.sokak === "river" ? 0.05 : 0.12;
  }
  if (k.aksiyon === "check") return pct >= 0.85 ? 0.35 : 1;
  return 1;
}

/**
 * Koltuğun açık aksiyon hattına uyan ağırlıklı el aralığı. `olu`: aralıkta olamayacak kartlar
 * (board ve hesabı yapanın kendi kartları).
 */
export function algilananAralik(s: EngineState, p: Seat, olu: number[]): AgirlikliEl[] {
  const dead = new Uint8Array(52);
  for (const c of olu) dead[c] = 1;
  const board = s.board.map(kartNo);
  for (const c of board) dead[c] = 1;

  const out: AgirlikliEl[] = [];
  for (const [l, w] of preflopAraligi(s.history, p)) {
    for (const [a, b] of KOMBOLAR.get(l) ?? []) {
      if (!dead[a] && !dead[b]) out.push({ a, b, w });
    }
  }
  for (const k of s.history) {
    if (k.koltuk !== p || k.sokak === "preflop" || k.aksiyon === "fold") continue;
    const t = tablo(board.slice(0, BOARD_LEN[k.sokak]));
    for (const x of out) {
      const i = ikili(x.a, x.b);
      x.w *= carpan(k, t.pct[i], t.cekis[i]);
    }
  }
  return out;
}

const gizliOnbellek = new WeakMap<Spot, Gizli>();

/**
 * Rakip elleri ve kalan board kartları. Yalnızca spottan (tohum = spot kimliği) türetilir;
 * hero'nun sonraki aksiyonlarına bağlı değildir ve duruma yazılmaz. Arayüz bunu ÇAĞIRMAMALI.
 */
export function gizliDagitim(spot: Spot): Gizli {
  const hit = gizliOnbellek.get(spot);
  if (hit) return hit;

  const s = ilkDurum(spot);
  const rnd = akis(s.seed, "dagitim");
  const used = new Uint8Array(52);
  const olu: number[] = [...(spot.hero.match(/.{2}/g) ?? []), ...s.board].map(kartNo);
  for (const c of olu) used[c] = 1;

  const eller: Gizli["eller"] = {};
  for (const p of SEATS) {
    const st = s.seats[p];
    if (p === spot.heroPos || !st.present || st.folded) continue;
    const range = algilananAralik(s, p, olu).filter((x) => !used[x.a] && !used[x.b] && x.w > 0);
    let a = -1;
    let b = -1;
    if (range.length > 0) {
      let sum = 0;
      for (const x of range) sum += x.w;
      let t = rnd() * sum;
      let sec = range[range.length - 1];
      for (const x of range) {
        t -= x.w;
        if (t < 0) {
          sec = x;
          break;
        }
      }
      a = sec.a;
      b = sec.b;
    } else {
      // Aralık boş kaldıysa (kart çakışmaları): kalan desteden rastgele
      do a = Math.floor(rnd() * 52);
      while (used[a]);
      used[a] = 1;
      do b = Math.floor(rnd() * 52);
      while (used[b]);
    }
    used[a] = 1;
    used[b] = 1;
    olu.push(a, b);
    // Kartların sırası da tohumla belirlenir (gösterim için)
    eller[p] = rnd() < 0.5 ? [kartAdi(a), kartAdi(b)] : [kartAdi(b), kartAdi(a)];
  }

  const board = [...s.board];
  while (board.length < 5) {
    let c = Math.floor(rnd() * 52);
    while (used[c]) c = Math.floor(rnd() * 52);
    used[c] = 1;
    board.push(kartAdi(c));
  }

  const g: Gizli = { eller, board };
  gizliOnbellek.set(spot, g);
  return g;
}
