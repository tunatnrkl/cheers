// Kurulum ekranının filtreleri. Her spotun preflop aksiyon türü, aksiyon dizisi (seq)
// replay ile oynatılarak çıkarılır; veride karşılığı olmayan seçenekler 0 sayısıyla görünür.
import { HANDS, TOPICS, type Game, type Hand, type Street, type Topic } from "@/data/hands";
import { replay } from "@/lib/poker/replay";

export type OyunFiltresi = "" | Game;
/** "postflop": flop, turn ya da river kararı (preflop dışındaki bütün spotlar). */
export type SokakFiltresi = "" | Street | "postflop";
/** Preflop aksiyon türü. "acilis": hero'dan önce herkes fold etti (ilk açılış). */
export type PreflopTuru = "acilis" | "srp" | "3bet" | "4bet" | "squeeze" | "limp" | "iso" | "pushfold" | "callshove";
export type PfFiltresi = "" | PreflopTuru;

export type Filtre = { oyun: OyunFiltresi; sokak: SokakFiltresi; pf: PfFiltresi; konu: "" | Topic };
export const BOS_FILTRE: Filtre = { oyun: "", sokak: "", pf: "", konu: "" };

export const PF_ETIKET: Record<PreflopTuru, string> = {
  acilis: "Açılış",
  srp: "SRP",
  "3bet": "3-bet",
  "4bet": "4-bet",
  squeeze: "Squeeze",
  limp: "Limp",
  iso: "Iso",
  pushfold: "Push/fold",
  callshove: "Call-shove",
};
export const PF_ACIKLAMA: Record<PreflopTuru, string> = {
  acilis: "Önündeki herkes fold etti; ilk giren sensin",
  srp: "Tek açılış ve call (single raised pot)",
  "3bet": "Açılışa yeniden artırma",
  "4bet": "3-bet'e yeniden artırma",
  squeeze: "Açılış ve call'dan sonra artırma",
  limp: "Artırmasız, limp'li pot",
  iso: "Limp'e karşı artırma (izolasyon)",
  pushfold: "Turnuvada ilk giren olarak all-in ya da fold",
  callshove: "Turnuvada all-in'e karşı karar",
};
export const PF_CASH: PreflopTuru[] = ["acilis", "srp", "3bet", "4bet", "squeeze", "limp", "iso"];
export const PF_TURNUVA: PreflopTuru[] = ["pushfold", "callshove"];

export const SOKAKLAR: { v: SokakFiltresi; l: string }[] = [
  { v: "preflop", l: "Preflop" },
  { v: "postflop", l: "Postflop" },
  { v: "flop", l: "Flop" },
  { v: "turn", l: "Turn" },
  { v: "river", l: "River" },
  { v: "", l: "Özel" },
];

/**
 * Spotun preflop aksiyon türü (seq replay ile oynatılır, otomatik fold'lar sayılmaz).
 * - Turnuvada önünde all-in olan preflop karar: call-shove; ilk giren preflop karar: push/fold.
 * - Artırma yoksa: limp varsa "iso" (preflop kararı, hero limp'e karşı) ya da "limp" (postflop), yoksa "acilis".
 * - Bir artırma: önünde limp varsa "iso"; preflop kararında açılış + call varsa "squeeze"; yoksa "srp".
 * - İki artırma: araya call girdiyse "squeeze", değilse "3bet". Üç ve üstü: "4bet".
 */
export function preflopTuru(h: Hand): PreflopTuru {
  const r = replay(h);
  const acts: { act: string }[] = [];
  for (const e of r.entries) {
    if (e.kind === "street") break;
    if (e.auto || e.act === "fold") continue;
    acts.push({ act: e.act });
  }
  const artis = (a: string) => a === "raise" || a === "bet" || a === "allin";
  const raises = acts.filter((a) => artis(a.act)).length;
  const preflopKarar = h.street === "preflop";

  if (h.game === "turnuva" && preflopKarar) {
    if (acts.some((a) => a.act === "allin")) return "callshove";
    if (raises === 0) return "pushfold";
  }
  if (raises === 0) {
    const limp = acts.some((a) => a.act === "limp" || a.act === "call");
    if (!limp) return "acilis";
    return preflopKarar ? "iso" : "limp";
  }
  const ilkArtis = acts.findIndex((a) => artis(a.act));
  const limpOnce = acts.slice(0, ilkArtis).some((a) => a.act === "limp" || a.act === "call");
  if (raises === 1) {
    if (limpOnce) return "iso";
    const sonrakiCall = acts.slice(ilkArtis + 1).some((a) => a.act === "call");
    if (preflopKarar && sonrakiCall) return "squeeze";
    return "srp";
  }
  if (raises === 2) {
    const ikinci = acts.findIndex((a, i) => i > ilkArtis && artis(a.act));
    const araCall = acts.slice(ilkArtis + 1, ikinci).some((a) => a.act === "call");
    return araCall ? "squeeze" : "3bet";
  }
  return "4bet";
}

const PF_CACHE = new Map<string, PreflopTuru>();
export function pfOf(h: Hand): PreflopTuru {
  let v = PF_CACHE.get(h.id);
  if (!v) {
    v = preflopTuru(h);
    PF_CACHE.set(h.id, v);
  }
  return v;
}

export function eslesir(h: Hand, f: Filtre): boolean {
  return (
    (!f.oyun || h.game === f.oyun) &&
    (!f.sokak || (f.sokak === "postflop" ? h.street !== "preflop" : h.street === f.sokak)) &&
    (!f.pf || pfOf(h) === f.pf) &&
    (!f.konu || h.topic === f.konu)
  );
}

export function havuz(f: Filtre, hands: Hand[] = HANDS): Hand[] {
  return hands.filter((h) => eslesir(h, f));
}

/** Bir alanın her seçeneği için, diğer filtreler sabitken kaç spot kalacağı. */
export function sayilar<K extends keyof Filtre>(f: Filtre, alan: K, secenekler: Filtre[K][], hands: Hand[] = HANDS): Map<Filtre[K], number> {
  const out = new Map<Filtre[K], number>();
  for (const s of secenekler) out.set(s, havuz({ ...f, [alan]: s }, hands).length);
  return out;
}

/** Oyuna göre gösterilecek preflop seçenekleri. */
export function pfSecenekleri(oyun: OyunFiltresi): PreflopTuru[] {
  return oyun === "cash" ? PF_CASH : oyun === "turnuva" ? [...PF_TURNUVA, ...PF_CASH] : [...PF_CASH, ...PF_TURNUVA];
}

export const KONULAR = Object.keys(TOPICS) as Topic[];

/** Adres parametrelerinden filtre. Geçersiz değerler yok sayılır. */
export function filtreOku(p: { get(k: string): string | null }): Filtre {
  const oyun = p.get("oyun");
  const sokak = p.get("sokak");
  const pf = p.get("pf");
  const konu = p.get("konu");
  return {
    oyun: oyun === "cash" || oyun === "turnuva" ? oyun : "",
    sokak: sokak === "preflop" || sokak === "postflop" || sokak === "flop" || sokak === "turn" || sokak === "river" ? sokak : "",
    pf: pf && pf in PF_ETIKET ? (pf as PreflopTuru) : "",
    konu: konu && konu in TOPICS ? (konu as Topic) : "",
  };
}

export function filtreYaz(f: Filtre): string {
  const q = new URLSearchParams();
  if (f.oyun) q.set("oyun", f.oyun);
  if (f.sokak) q.set("sokak", f.sokak);
  if (f.pf) q.set("pf", f.pf);
  if (f.konu) q.set("konu", f.konu);
  return q.toString();
}

/** Kaç filtre etkin (Karışık = 0). */
export function etkinFiltre(f: Filtre): number {
  return [f.oyun, f.sokak, f.pf, f.konu].filter(Boolean).length;
}
