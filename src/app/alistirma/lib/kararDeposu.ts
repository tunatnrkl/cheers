// El motoruyla oynanan ellerin hero kararları. Eski `pd-…` anahtarlarına dokunulmaz;
// ilk karar ilerleme kaydına (addAttempt) ayrıca yazılır, burada yalnızca el boyu kararlar durur.
import type { AksiyonTuru, HeroKarar, Kademe, Sokak } from "@/lib/poker/engine";

export const KARAR_ANAHTARI = "cheers:el-kararlari:v1";
export const KARAR_SINIRI = 500;

export type KayitliKarar = {
  sokak: Sokak;
  aksiyon: AksiyonTuru;
  miktar: number;
  kademe: Kademe;
  tahmini: boolean;
};
export type KayitliEl = { handId: string; at: string; kararlar: KayitliKarar[] };
type Depo = { v: 1; eller: KayitliEl[] };

type Okur = Pick<Storage, "getItem">;
type Yazar = Pick<Storage, "getItem" | "setItem">;

function depo(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function gecerliKarar(k: unknown): k is KayitliKarar {
  if (!k || typeof k !== "object") return false;
  const x = k as Record<string, unknown>;
  return (
    typeof x.sokak === "string" &&
    typeof x.aksiyon === "string" &&
    typeof x.miktar === "number" &&
    (x.kademe === "en-iyi" || x.kademe === "kabul" || x.kademe === "hata") &&
    typeof x.tahmini === "boolean"
  );
}

export function kararlariOku(storage: Okur | undefined = depo()): KayitliEl[] {
  try {
    const raw = storage?.getItem(KARAR_ANAHTARI);
    if (!raw) return [];
    const d = JSON.parse(raw) as Partial<Depo>;
    if (d?.v !== 1 || !Array.isArray(d.eller)) return [];
    return d.eller.filter(
      (e): e is KayitliEl =>
        !!e && typeof e.handId === "string" && typeof e.at === "string" && Array.isArray(e.kararlar) && e.kararlar.every(gecerliKarar),
    );
  } catch {
    return [];
  }
}

/**
 * Bir elin kararlarını ekler (en yeni başta, en fazla KARAR_SINIRI el).
 * İlk karar ilerleme kaydında zaten var; burada yalnızca sonraki kararlar saklanır.
 * Sonraki karar yoksa hiçbir şey yazılmaz. Dönüş: yazıldı mı.
 */
export function elKararlariniYaz(handId: string, kararlar: HeroKarar[], storage: Yazar | undefined = depo(), now = new Date()): boolean {
  const sonraki = kararlar.slice(1).map<KayitliKarar>((k) => ({
    sokak: k.sokak,
    aksiyon: k.aksiyon,
    miktar: k.miktar,
    kademe: k.kademe,
    tahmini: k.tahmini,
  }));
  if (!sonraki.length || !storage) return false;
  try {
    const eller = [{ handId, at: now.toISOString(), kararlar: sonraki }, ...kararlariOku(storage)].slice(0, KARAR_SINIRI);
    storage.setItem(KARAR_ANAHTARI, JSON.stringify({ v: 1, eller } satisfies Depo));
    return true;
  } catch {
    return false;
  }
}
