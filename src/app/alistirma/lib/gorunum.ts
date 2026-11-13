// Masanın ekranda görünen hâli. Motorun durumu tek seferde ilerler; ekran ise olayları
// sırayla oynatır. Görünüm = başlangıç görünümü + o ana kadar oynatılan olaylar (saf indirgeme).
// Yalnızca `EngineState` ve `Olay` kullanılır; rakip kartları yalnızca showdown olayıyla girer.
import { SEATS, fmt, type Seat } from "@/lib/poker/replay";
import type { AcikEl, AksiyonTuru, EngineState, Olay, Sokak, Sonuc } from "@/lib/poker/engine";

export type SonAksiyon = { aksiyon: AksiyonTuru; miktar: number };
export type KoltukGorunumu = {
  present: boolean;
  stack: number;
  bet: number;
  folded: boolean;
  allin: boolean;
  son: SonAksiyon | null;
};
export type Gorunum = {
  seats: Record<Seat, KoltukGorunumu>;
  pot: number;
  board: string[];
  sokak: Sokak;
  /** Showdown'da açılan eller; showdown olayından önce her zaman null */
  acik: AcikEl[] | null;
  sonuc: Sonuc | null;
  /** Son oynatılan aksiyonun koltuğu */
  vurgu: Seat | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Karar anındaki görünüm: koltuklar, pot, board ve bu sokaktaki son aksiyonlar. */
export function baslangicGorunumu(s: EngineState): Gorunum {
  const seats = {} as Record<Seat, KoltukGorunumu>;
  for (const p of SEATS) {
    const k = s.seats[p];
    seats[p] = { present: k.present, stack: k.stack, bet: k.bet, folded: k.folded, allin: k.allin, son: null };
  }
  for (const h of s.history) {
    if (h.sokak !== s.sokak) continue;
    seats[h.koltuk].son = { aksiyon: h.aksiyon, miktar: h.miktar };
  }
  return { seats, pot: s.pot, board: [...s.board], sokak: s.sokak, acik: null, sonuc: null, vurgu: null };
}

export function olayUygula(g: Gorunum, o: Olay): Gorunum {
  const seats = { ...g.seats };
  switch (o.tür) {
    case "aksiyon": {
      const k = seats[o.koltuk];
      seats[o.koltuk] = {
        ...k,
        stack: o.stack,
        bet: o.aksiyon === "fold" ? k.bet : o.miktar,
        folded: k.folded || o.aksiyon === "fold",
        allin: o.aksiyon !== "fold" && o.stack === 0,
        son: { aksiyon: o.aksiyon, miktar: o.miktar },
      };
      return { ...g, seats, pot: o.pot, vurgu: o.koltuk };
    }
    case "iade": {
      const k = seats[o.koltuk];
      seats[o.koltuk] = { ...k, bet: r2(Math.max(0, k.bet - o.miktar)), stack: r2(k.stack + o.miktar), allin: false };
      return { ...g, seats, pot: o.pot };
    }
    case "sokak":
      for (const p of SEATS) seats[p] = { ...seats[p], bet: 0, son: null };
      return { ...g, seats, pot: o.pot, board: [...o.board], sokak: o.sokak, vurgu: null };
    case "showdown":
      return { ...g, board: [...o.board], acik: o.eller, vurgu: null };
    case "sonuç": {
      for (const p of SEATS) seats[p] = { ...seats[p], bet: 0 };
      for (const w of o.kazananlar) seats[w.koltuk] = { ...seats[w.koltuk], stack: r2(seats[w.koltuk].stack + w.miktar) };
      const { tür: _t, ...sonuc } = o;
      void _t;
      return { ...g, seats, sonuc, vurgu: null };
    }
  }
}

export function gorunumHesapla(baslangic: Gorunum, olaylar: readonly Olay[], adet: number): Gorunum {
  let g = baslangic;
  for (let i = 0; i < Math.min(adet, olaylar.length); i++) g = olayUygula(g, olaylar[i]);
  return g;
}

const AD: Record<AksiyonTuru, string> = { fold: "Fold", check: "Check", call: "Call", bet: "Bet", raise: "Raise", allin: "All-in" };

/** Koltuk rozeti: "Fold", "Call 3,7", "Raise 12" (miktar sokakta toplam). */
export function aksiyonEtiketi(a: SonAksiyon): string {
  if (a.aksiyon === "fold" || a.aksiyon === "check") return AD[a.aksiyon];
  return `${AD[a.aksiyon]} ${fmt(a.miktar)}`;
}

/** Tek satırlık anlatım: "BTN 3,7 BB bahis yaptı". */
export function aksiyonCumlesi(koltuk: Seat, a: SonAksiyon): string {
  const m = `${fmt(a.miktar)} BB`;
  switch (a.aksiyon) {
    case "fold":
      return `${koltuk} fold etti`;
    case "check":
      return `${koltuk} check etti`;
    case "call":
      return `${koltuk} call etti (${m})`;
    case "bet":
      return `${koltuk} ${m} bahis yaptı`;
    case "raise":
      return `${koltuk} ${m}'ye yükseltti`;
    case "allin":
      return `${koltuk} all-in yaptı (${m})`;
  }
}

export type RakipAksiyonu = { koltuk: Seat; son: SonAksiyon; /** state.olaylar içindeki sıra; karar anından önceyse -1 */ olay: number };

/**
 * Hero kararından önceki SON rakip aksiyonu. Önce olaylardaki son `aksiyon` olayına bakılır
 * (hero'nunki değilse); karar anından beri olay yoksa spotun açık geçmişindeki son kayıt alınır.
 * Fold'lar atlanır; son rakip aksiyonu fold ise ondan önceki anlamlı aksiyon gösterilir.
 */
export function sonRakipAksiyonu(s: EngineState, olaylar: readonly Olay[] = s.olaylar): RakipAksiyonu | null {
  const hero = s.spot.heroPos;
  for (let i = olaylar.length - 1; i >= 0; i--) {
    const o = olaylar[i];
    // Yeni sokakta ilk konuşan hero ise ya da hero'dan sonra rakip konuşmadıysa: yok
    if (o.tür === "sokak" || o.tür === "showdown" || o.tür === "sonuç") return null;
    if (o.tür !== "aksiyon") continue;
    if (o.koltuk === hero) return null;
    if (o.aksiyon === "fold") continue;
    return { koltuk: o.koltuk, son: { aksiyon: o.aksiyon, miktar: o.miktar }, olay: i };
  }
  // Karar anından beri olay yoksa spotun açık geçmişine bak (yalnızca bu sokak).
  if (olaylar.length > 0) return null;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const h = s.history[i];
    if (h.sokak !== s.sokak || h.koltuk === hero) return null;
    if (h.aksiyon === "fold") continue;
    return { koltuk: h.koltuk, son: { aksiyon: h.aksiyon, miktar: h.miktar }, olay: -1 };
  }
  return null;
}

/** Bir olayın oynatma süresi (ms, "Normal" hızda). */
export function olaySuresi(o: Olay, hero: Seat): number {
  switch (o.tür) {
    case "aksiyon":
      return o.koltuk === hero ? 380 : 850;
    case "iade":
      return 350;
    case "sokak":
      return o.sokak === "flop" ? 1150 : 700;
    case "showdown":
      return 500 + o.eller.length * 380;
    case "sonuç":
      return 900;
  }
}
