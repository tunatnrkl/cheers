// El motoruyla ilgili küçük yardımcılar (arayüzden bağımsız, saf).
import { applyHero, legalActions, type EngineState, type HeroAksiyon, type LegalActions } from "@/lib/poker/engine";

/**
 * Hero fold ettikten sonra "Kartlar nasıl gelecekti?": fold'dan ÖNCEKİ durumdan pasif bir hatla
 * (check, yoksa call) el sonuna kadar oynatılır ve yalnızca motorun açtığı `sokak` olaylarındaki
 * board alınır. Showdown olayı (rakip elleri) okunmaz ve hiçbir yere aktarılmaz.
 * Board yalnızca spota bağlı olduğu için hero'nun hattı kartları değiştirmez (motor README).
 */
export function kalanBoard(onceki: EngineState): string[] {
  let s = onceki;
  let board = [...onceki.board];
  for (let guard = 0; guard < 12 && !s.result && board.length < 5; guard++) {
    const l = legalActions(s);
    const a: HeroAksiyon | null = l.check ? { tür: "check" } : l.call !== undefined ? { tür: "call" } : null;
    if (!a) break;
    const r = applyHero(s, a);
    for (const o of r.olaylar) if (o.tür === "sokak") board = [...o.board];
    s = r.state;
  }
  return board;
}

export type Hiz = "normal" | "hizli" | "aninda";
export const HIZ_ETIKET: Record<Hiz, string> = { normal: "Normal", hizli: "Hızlı", aninda: "Anında" };
export const HIZ_CARPAN: Record<Hiz, number> = { normal: 1, hizli: 0.4, aninda: 0 };
const AYAR_ANAHTARI = "cheers:alistirma-ayar:v1";

export function hizOku(storage: Pick<Storage, "getItem"> | undefined = safeLocal()): Hiz {
  try {
    const v = JSON.parse(storage?.getItem(AYAR_ANAHTARI) ?? "{}")?.hiz;
    return v === "hizli" || v === "aninda" ? v : "normal";
  } catch {
    return "normal";
  }
}

export function hizYaz(hiz: Hiz, storage: Pick<Storage, "setItem"> | undefined = safeLocal()) {
  try {
    storage?.setItem(AYAR_ANAHTARI, JSON.stringify({ hiz }));
  } catch {}
}

function safeLocal(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** Bet/raise için seçilebilecek değer: aralığa sıkıştırılmış, 0,5 BB'ye yuvarlanmış (uçlar korunur). */
export function boyutSikistir(m: number, l: LegalActions): number {
  const a = l.bet ?? l.raise;
  if (!a) return m;
  if (!Number.isFinite(m)) return a.min;
  if (m >= a.max) return a.max;
  if (m <= a.min) return a.min;
  const y = Math.round(m * 2) / 2;
  return Math.min(a.max, Math.max(a.min, y));
}
