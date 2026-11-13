// Öğren bölümünün veri kaynağı. Varsayılan: src/data/mufredat.json.
// `?ornek=1` yalnızca geliştirme ve deneme içindir: örnek müfredat yüklenir ve ilerleme ayrı anahtarda tutulur.
import veri from "@/data/mufredat.json";
import type { Mufredat } from "@/lib/mufredat/tipler";
import { ANAHTAR } from "./ilerleme";
import { ORNEK_MUFREDAT } from "./ornek-mufredat";
import { type Dizin, dizinKur } from "./yol";

export const GERCEK: Dizin = dizinKur(veri as unknown as Mufredat);
export const ORNEK: Dizin = dizinKur(ORNEK_MUFREDAT);

/** Örnek veriyle yapılan denemeler gerçek ilerlemeye karışmaz. */
export const ORNEK_ANAHTAR = `${ANAHTAR}:ornek`;

export type Kaynak = { dz: Dizin; anahtar: string; ornek: boolean };

export function kaynak(ornek: boolean): Kaynak {
  return ornek ? { dz: ORNEK, anahtar: ORNEK_ANAHTAR, ornek } : { dz: GERCEK, anahtar: ANAHTAR, ornek };
}

/** /ogren içi adres: pist ve ders durumu sorgu parametresindedir (statik dışa aktarımda dinamik route yok). */
export function ogrenAdresi(p: { pist?: string | null; ders?: string | null; mod?: "tekrar" | null; ornek?: boolean }): string {
  const q = new URLSearchParams();
  if (p.pist) q.set("pist", p.pist);
  if (p.ders) q.set("ders", p.ders);
  if (p.mod) q.set("mod", p.mod);
  if (p.ornek) q.set("ornek", "1");
  const s = q.toString();
  return s ? `/ogren?${s}` : "/ogren";
}
