// İlk kararın (spotun karar anı) mevcut ilerleme kaydına eşlenmesi ve geri bildirim şeridi.
import type { Hand } from "@/data/hands";
import { optionKind, type Degerlendirme, type HeroAksiyon, type Kademe, type LegalActions } from "@/lib/poker/engine";
import { fmt } from "@/lib/poker/replay";

/**
 * Serbest aksiyonu spot seçeneğinin sırasına çevirir (addAttempt için).
 * Motorun değerlendirmesi "en-iyi" ya da "kabul" ise hamle önerilen seçeneğe eşlenmiştir
 * (kabul: tür doğru, boyut farklı). "hata" ise aynı türdeki başka bir seçenek, o da yoksa
 * önerilen olmayan ilk seçenek seçilir; böylece kayıt yanlış cevap olarak düşer.
 */
export function secenekSirasi(hand: Hand, action: HeroAksiyon, deger: Degerlendirme, legal: LegalActions): number {
  if (deger.kademe !== "hata") return hand.correct;
  const kinds = hand.options.map(optionKind);
  const max = (legal.bet ?? legal.raise)?.max;
  const allin = action.tür === "allin" || ((action.tür === "bet" || action.tür === "raise") && max !== undefined && action.miktar >= max);
  const istenen: string[] =
    action.tür === "fold"
      ? ["fold"]
      : action.tür === "check"
        ? ["check"]
        : action.tür === "call"
          ? ["call", "allin"]
          : allin
            ? ["allin", "raise", "bet"]
            : ["raise", "bet", "allin"];
  for (const k of istenen) {
    const i = kinds.findIndex((x, j) => x === k && j !== hand.correct);
    if (i >= 0) return i;
  }
  const diger = hand.options.findIndex((_, j) => j !== hand.correct);
  return diger >= 0 ? diger : hand.correct;
}

/** Seçenek metnindeki hedef boyut (sokakta toplam BB); bulunamazsa null. */
export function secenekBoyutu(option: string, pot: number): number | null {
  const bb = option.match(/(\d+(?:,\d+)?)\s*BB/);
  const k = optionKind(option);
  if (k !== "raise" && k !== "bet") return null;
  if (bb) return Number(bb[1].replace(",", "."));
  const kesir = option.match(/(\d+)\/(\d+)\s*pot/);
  if (kesir) return Math.round(((Number(kesir[1]) / Number(kesir[2])) * pot) * 2) / 2;
  if (option.toLocaleLowerCase("tr").startsWith("pot")) return Math.round(pot * 2) / 2;
  return null;
}

/**
 * İlk kararda spotun kendi boyutları (ör. "3-bet 9 BB") ek kısayol olarak gösterilir.
 * Yalnızca yasal aralıktaki ve motorun kısayollarıyla çakışmayan boyutlar.
 */
export function spotKisayollari(hand: Hand, pot: number, legal: LegalActions): { etiket: string; miktar: number }[] {
  const a = legal.bet ?? legal.raise;
  if (!a) return [];
  const out: { etiket: string; miktar: number }[] = [];
  for (const o of hand.options) {
    const m = secenekBoyutu(o, pot);
    if (m === null || m < a.min - 1e-9 || m > a.max + 1e-9) continue;
    if (a.kısayollar.some((k) => Math.abs(k.miktar - m) < 1e-9) || out.some((k) => k.miktar === m)) continue;
    out.push({ etiket: `${fmt(m)} BB`, miktar: m });
  }
  return out;
}

export const KADEME_ETIKET: Record<Kademe, string> = { "en-iyi": "En iyi", kabul: "Kabul edilebilir", hata: "Hata" };

/** Karar sonrası kısa nötr cümle. Ayrıntılı gerekçe burada yok; "Neden?" ile açılır. */
export function geriBildirimCumlesi(d: Degerlendirme, hand: Hand, ilk: boolean): string {
  if (ilk && !d.tahmini) {
    if (d.kademe === "en-iyi") return "Spotun önerilen hamlesiyle aynı.";
    if (d.kademe === "kabul") return "Hamlenin yönü önerilenle aynı; boyut farklı.";
    return `Önerilen hamle: ${hand.options[hand.correct]}.`;
  }
  if (d.kademe === "en-iyi") return "Bu varsayımlarla güçlü bir seçim görünüyor.";
  if (d.kademe === "kabul") return "Savunulabilir bir seçim; diğer seçenekler de düşünülebilir.";
  return "Bu varsayımlarla başka bir hamle daha uygun görünüyor.";
}
