// Alıştırma cevaplarının değerlendirilmesi ve spot alıştırmasının masaya çevrilmesi. Saf fonksiyonlar.
import { HAND_BY_ID, type Hand, type Pos, POSITIONS } from "@/data/hands";
import type { Alistirma } from "@/lib/mufredat/tipler";
import { MATRIX_RANKS, matrixLabel } from "@/lib/poker/cards";
import { replay } from "@/lib/poker/replay";
import type { Sonuc } from "./ilerleme";

/** Kullanıcının cevabı; tipe göre biçimi değişir. */
export type Cevap =
  | { tip: "secim"; sira: number } // secmeli, spot
  | { tip: "dy"; deger: boolean } // dogruYanlis
  | { tip: "sayi"; metin: string }
  | { tip: "range"; eller: string[] }
  /** eslestirme: sol[i] için seçilen sağ öğenin özgün sırası */
  | { tip: "eslestirme"; eslesme: number[] }
  /** siralama: öğelerin özgün sıra numaraları, kullanıcının dizdiği sırayla */
  | { tip: "siralama"; sira: number[] };

/** "12,5", "12.5", "%25", "25 %", "1.250,5" → sayı. Anlaşılmazsa null. */
export function sayiCoz(metin: string): number | null {
  let s = metin.trim().replace(/\s+/g, "").replace(/^%/, "").replace(/%$/, "").replace(/[−–]/g, "-");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const ciftler = (a: Alistirma): [string, string][] => (a.secenekler ?? []) as [string, string][];
export const ogeler = (a: Alistirma): string[] => (a.secenekler ?? []) as string[];

export const TUM_ELLER: string[] = MATRIX_RANKS.flatMap((_, r) => MATRIX_RANKS.map((__, c) => matrixLabel(r, c)));

/** Range sorusunda seçilebilecek eller: `secenekler` doluysa o evren, boşsa 169 elin tamamı. */
export function rangeEvreni(a: Alistirma): Set<string> {
  const s = ogeler(a).filter((x) => typeof x === "string");
  return new Set(s.length ? s : TUM_ELLER);
}

export function degerlendir(a: Alistirma, c: Cevap): Sonuc {
  switch (a.tip) {
    case "secmeli":
    case "spot":
      if (c.tip !== "secim") return "y";
      if (c.sira === a.dogru) return "d";
      return (a.kabulEdilebilir ?? []).includes(c.sira) ? "k" : "y";
    case "dogruYanlis":
      return c.tip === "dy" && c.deger === a.dogru ? "d" : "y";
    case "sayi": {
      if (c.tip !== "sayi" || typeof a.dogru !== "number") return "y";
      const n = sayiCoz(c.metin);
      // Kayan nokta payı: 0,1 + 0,2 gibi toplamlar tolerans sınırında yanlış sayılmasın.
      return n !== null && Math.abs(n - a.dogru) <= (a.tolerans ?? 0) + 1e-9 ? "d" : "y";
    }
    case "range": {
      if (c.tip !== "range" || !Array.isArray(a.dogru)) return "y";
      const hedef = new Set(a.dogru);
      const secili = new Set(c.eller);
      return hedef.size === secili.size && [...hedef].every((e) => secili.has(e)) ? "d" : "y";
    }
    case "eslestirme": {
      if (c.tip !== "eslestirme") return "y";
      const p = ciftler(a);
      // Metinle karşılaştırılır: aynı tanım iki kez geçiyorsa ikisi de kabul edilir.
      return c.eslesme.length === p.length && p.every((cift, i) => p[c.eslesme[i]]?.[1] === cift[1]) ? "d" : "y";
    }
    case "siralama": {
      if (c.tip !== "siralama") return "y";
      const o = ogeler(a);
      return c.sira.length === o.length && o.every((oge, i) => o[c.sira[i]] === oge) ? "d" : "y";
    }
  }
}

/** Geri bildirimde gösterilen doğru cevap metni. */
export function dogruMetni(a: Alistirma): string {
  switch (a.tip) {
    case "secmeli":
    case "spot":
      return ogeler(a)[a.dogru as number] ?? "";
    case "dogruYanlis":
      return a.dogru ? "Doğru" : "Yanlış";
    case "sayi":
      return `${String(a.dogru).replace(".", ",")}${a.birim ? ` ${a.birim}` : ""}`;
    case "range":
      return (a.dogru as string[]).join(", ");
    case "eslestirme":
      return ciftler(a).map(([s, t]) => `${s} → ${t}`).join(" · ");
    case "siralama":
      return ogeler(a).join(" → ");
  }
}

/** Tohumlu karıştırma: aynı alıştırma her açılışta aynı sırayla gelir, ama verilen sırayla değil. */
export function karistir(n: number, tohum: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) h = Math.imul(h ^ tohum.charCodeAt(i), 16777619);
  const rnd = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const d = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  // Cevabı hazır vermemek için: karıştırma özgün sırayı verdiyse bir kaydır.
  if (n > 1 && d.every((v, i) => v === i)) d.push(d.shift()!);
  return d;
}

const sokak = (board: string): Hand["street"] => (board.length >= 10 ? "river" : board.length >= 8 ? "turn" : board.length >= 6 ? "flop" : "preflop");

/**
 * Spot alıştırmasını masa bileşeninin beklediği ele çevirir.
 * `spotKimlik` mevcut bir spota bağlanır; `spot` yeni tanımdır.
 * Rakibin eli hiçbir koşulda taşınmaz (değişmez 7): `villain` alanı düşürülür.
 */
export function spotEl(a: Alistirma): Hand | null {
  if (a.tip !== "spot") return null;
  const secenekler = ogeler(a);
  if (a.spotKimlik) {
    const h = HAND_BY_ID.get(a.spotKimlik);
    if (!h) return null;
    const kopya: Hand = { ...h, options: secenekler.length ? secenekler : h.options };
    delete kopya.villain;
    return kopya;
  }
  const s = a.spot;
  if (!s || !POSITIONS.includes(s.heroPoz as Pos)) return null;
  const n = Math.min(6, Math.max(2, Math.round(s.oyuncuSayisi)));
  // Eksik oyuncular erken pozisyonlardan düşer; kahramanın koltuğu her zaman masadadır.
  const players = POSITIONS.filter((p, i) => i >= POSITIONS.length - n || p === s.heroPoz);
  const girdi = { heroPos: s.heroPoz as Pos, stackBB: s.stackBB, seq: s.aksiyonlar ?? [], ante: s.ante, players };
  const r = replay(girdi);
  const board = s.board || r.board || undefined;
  return {
    id: `ogren-${a.kimlik}`,
    title: "",
    game: s.oyun,
    street: sokak(board ?? ""),
    heroPos: girdi.heroPos,
    stackBB: s.stackBB,
    hero: s.heroEl,
    board,
    potBB: r.pot,
    seq: girdi.seq,
    ante: s.ante,
    players: n < 6 ? players : undefined,
    note: s.rakipAraligi,
    options: secenekler,
    correct: a.dogru as number,
    reasoning: a.neden,
    topic: "acilis",
    level: 1,
  };
}
