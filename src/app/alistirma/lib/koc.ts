// Koç penceresinin kural tabanlı yanıtları (statik sürümde yapay zeka yok, KARARLAR karar 2).
// Yalnızca masadaki açık bilgi kullanılır: pot, call, stack'ler, board. Kesinlik iddiası yok.
import type { Hand } from "@/data/hands";
import type { EngineState, HeroKarar } from "@/lib/poker/engine";
import { SEATS, fmt } from "@/lib/poker/replay";
import { KADEME_ETIKET } from "./ilkKarar";

export const HIZLI_SORULAR = ["Neden?", "Pot odds nedir?", "Bu board'da planım ne olmalı?"] as const;
export type HizliSoru = (typeof HIZLI_SORULAR)[number];

export const SERBEST_SORU_YANITI = "Bu sürümde koç hazır sorularla çalışır. Aşağıdaki sorulardan birini seçebilirsin.";

const SOKAK_TR = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River" } as const;

export function soruTuru(q: string): HizliSoru | null {
  const s = q.toLocaleLowerCase("tr").trim();
  if (/^neden/.test(s)) return "Neden?";
  if (s.includes("pot odds")) return "Pot odds nedir?";
  if (s.includes("plan")) return "Bu board'da planım ne olmalı?";
  return null;
}

/** "%33" biçiminde yuvarlanmış yüzde. */
const yuzde = (x: number) => `%${fmt(Math.round(x * 1000) / 10)}`;

/** Pot odds: o anki pot ve call ile adım adım hesap. */
export function potOddsYaniti(pot: number, call: number | undefined): string {
  if (!call || call <= 0) {
    return [
      "Pot odds, call için koyacağın miktarın call sonrası oluşacak toplam pota oranıdır: gereken equity = call ÷ (pot + call).",
      `Şu an önünde ödenecek bir bahis yok (pot ${fmt(pot)} BB), bu yüzden hesaplanacak bir call yok.`,
    ].join("\n\n");
  }
  const toplam = Math.round((pot + call) * 100) / 100;
  const req = call / toplam;
  return [
    "Pot odds, call için koyacağın miktarın call sonrası oluşacak toplam pota oranıdır.",
    `- Pot şu an **${fmt(pot)} BB**, call için **${fmt(call)} BB** koyman gerekiyor.`,
    `- Call sonrası toplam pot: ${fmt(pot)} + ${fmt(call)} = ${fmt(toplam)} BB.`,
    `- Gereken equity: ${fmt(call)} ÷ ${fmt(toplam)} ≈ **${yuzde(req)}**.`,
    "Elinin bu noktada yaklaşık bu oranda kazanma şansı varsa call matematiksel olarak savunulabilir; sonraki sokaklarda kazanılabilecek ya da ödenecek bahisler bu hesaba dahil değil.",
  ].join("\n");
}

const RANKS = "23456789TJQKA";

/** Board dokusu: renk, bağlantı ve eş durumu (nötr betimleme). */
export function boardDokusu(board: string[]): string[] {
  if (board.length < 3) return [];
  const suits = new Map<string, number>();
  for (const c of board) suits.set(c[1], (suits.get(c[1]) ?? 0) + 1);
  const maxSuit = Math.max(...suits.values());
  const ranks = board.map((c) => RANKS.indexOf(c[0].toUpperCase()));
  const uniq = [...new Set(ranks)].sort((a, b) => a - b);
  const out: string[] = [];
  if (maxSuit >= 3) out.push(maxSuit >= 4 ? "board'da aynı renkten dört kart var" : "board'da aynı renkten üç kart var; floş mümkün");
  else if (maxSuit === 2) out.push(board.length >= 5 ? "board'da floş yok" : "board'da iki kart aynı renk; floş çekişi mümkün");
  else out.push("board farklı renklerden (gökkuşağı)");
  if (uniq.length < ranks.length) out.push("board eşli");
  // Beş kartlık bir pencereye üç ya da daha fazla farklı değer sığıyorsa kent ihtimali artar
  const vals = uniq.includes(12) ? [-1, ...uniq] : uniq;
  let bagli = 0;
  for (let i = 0; i < vals.length; i++) {
    const n = vals.filter((v) => v >= vals[i] && v <= vals[i] + 4).length;
    bagli = Math.max(bagli, n);
  }
  out.push(bagli >= 3 ? "kartlar birbirine yakın; kent ihtimalleri var" : "kartlar dağınık; kent ihtimali düşük");
  return out;
}

/** Efektif stack ÷ pot. Hero ile elde kalan en büyük rakip stack'inin küçüğü. */
export function sprHesapla(s: EngineState): number | null {
  const hero = s.spot.heroPos;
  const rakip = Math.max(0, ...SEATS.filter((p) => p !== hero && s.seats[p].present && !s.seats[p].folded).map((p) => s.seats[p].stack));
  if (s.pot <= 0) return null;
  return Math.min(s.seats[hero].stack, rakip) / s.pot;
}

export function planYaniti(s: EngineState): string {
  const spr = sprHesapla(s);
  const sprMetni =
    spr === null
      ? ""
      : `SPR (efektif stack ÷ pot) yaklaşık **${fmt(Math.round(spr * 10) / 10)}**. ` +
        (spr < 3
          ? "Düşük SPR'de güçlü ellerle stack'lerin pota girmesi daha kolay kararlar üretir; marjinal ellerle büyük pota girmek pahalıdır."
          : spr <= 8
            ? "Orta SPR'de elin gücü ve board'un nasıl değişebileceği, potu ne kadar büyüteceğini belirler."
            : "Yüksek SPR'de pot kontrolü ve pozisyon daha çok önem kazanır; tek bir per ile çok büyük pot oynamak risklidir.");
  if (s.board.length < 3) {
    return [`Henüz board açılmadı (${SOKAK_TR[s.sokak]}).`, sprMetni, "Bu genel bir yön; kesin bir strateji değildir."].filter(Boolean).join("\n\n");
  }
  const doku = boardDokusu(s.board);
  const dokuMetni = `Board: ${doku.join(", ")}.`;
  const yon =
    doku.some((d) => d.includes("floş mümkün") || d.includes("kent ihtimalleri"))
      ? "Islak bir board'da eller sokaktan sokağa daha çok değişir; çekişlerin ve rakibin olası çekişleri hesaba katılır."
      : "Kuru bir board'da eller daha az değişir; güçlü olduğunu düşündüğün elle value, zayıf elle pot kontrolü sık kullanılan yönlerdir.";
  return [dokuMetni, yon, sprMetni, "Bu genel bir yön; kesin bir strateji değildir."].filter(Boolean).join("\n\n");
}

/**
 * "Neden?" yanıtı: spotun yazılı gerekçesi (ilk karardan sonra) ve sonraki kararların motor
 * gerekçeleri ("tahmini değerlendirme" etiketiyle). İlk karardan önce gerekçe açılmaz.
 */
export function nedenYaniti(hand: Hand, kararlar: readonly HeroKarar[]): string {
  if (kararlar.length === 0) {
    return "Önce kararını ver; sonra bu spotun gerekçesini ve kararlarının değerlendirmesini burada gösteririm.";
  }
  const parcalar = [`**Spotun gerekçesi:** ${hand.reasoning}`];
  kararlar.forEach((k, i) => {
    if (i === 0 && !k.tahmini) return;
    parcalar.push(`**${SOKAK_TR[k.sokak]} · ${KADEME_ETIKET[k.kademe]}${k.tahmini ? " (tahmini değerlendirme)" : ""}:** ${k.gerekce}`);
  });
  return parcalar.join("\n\n");
}
