// El sonu özeti: sokak sokak hero kararları, pot büyümesi, sonuç ve kısa bir ders cümlesi.
import { fmt } from "../replay";
import type { AcikEl, ElOzeti, EngineState } from "./types";

export function summarize(s: EngineState): ElOzeti {
  const potSeyri: ElOzeti["potSeyri"] = [];
  const ilkPot = s.decisions[0]?.potOnce ?? s.pot;
  potSeyri.push({ sokak: s.spot.street, pot: ilkPot });
  let showdown: AcikEl[] | null = null;
  let sonPot = ilkPot;
  for (const o of s.olaylar) {
    if (o.tür === "sokak") potSeyri.push({ sokak: o.sokak, pot: o.pot });
    if (o.tür === "aksiyon" || o.tür === "iade" || o.tür === "sokak") sonPot = o.pot;
    if (o.tür === "showdown") showdown = o.eller;
  }
  // Son pot: dağıtılan pot; hero fold edip el oynatılmadıysa fold anındaki pot
  if (s.result) potSeyri.push({ sokak: "son", pot: s.result.kazananlar.length ? s.result.pot : sonPot });

  const hero = s.spot.heroPos;
  const r = s.result;
  let sonucMetni = "El henüz bitmedi.";
  if (r) {
    const net = `${r.heroNet > 0 ? "+" : ""}${fmt(r.heroNet)} BB`;
    if (r.neden === "hero-fold") {
      sonucMetni = `Fold ettin; rakip kartları açılmadı (elin başından net ${net}).`;
    } else if (r.neden === "herkes-fold") {
      const w = r.kazananlar[0];
      sonucMetni =
        w.koltuk === hero
          ? `Rakipler fold etti; ${fmt(w.miktar)} BB'lik potu kartlar açılmadan aldın (net ${net}).`
          : `Herkes fold etti; potu ${w.koltuk} aldı (net ${net}).`;
    } else {
      const benim = (showdown as AcikEl[] | null)?.find((e) => e.koltuk === hero);
      const kazandim = r.kazananlar.find((k) => k.koltuk === hero);
      const baskalari = r.kazananlar.filter((k) => k.koltuk !== hero);
      if (kazandim && baskalari.length === 0) {
        sonucMetni = `Showdown: ${kazandim.elAdi} ile ${fmt(kazandim.miktar)} BB'lik potu aldın (net ${net}).`;
      } else if (kazandim) {
        sonucMetni = `Showdown: pot bölündü; ${kazandim.elAdi} ile ${fmt(kazandim.miktar)} BB aldın (net ${net}).`;
      } else {
        const w = baskalari[0];
        sonucMetni = `Showdown: ${w.koltuk} ${w.elAdi} ile kazandı; senin elin ${benim?.elAdi ?? "açılmadı"} (net ${net}).`;
      }
    }
  }

  const hata = s.decisions.find((k) => k.kademe === "hata");
  const kabul = s.decisions.find((k) => k.kademe === "kabul");
  const not = s.decisions.some((k) => k.tahmini) ? " İlk karardan sonraki değerlendirmeler tahminidir." : "";
  let ders: string;
  if (s.decisions.length === 0) ders = "Bu elde henüz karar vermedin.";
  else if (hata) ders = `Bu elde üzerinde en çok durmaya değer karar ${hata.sokak} kararın; sonuca değil, kararın gerekçesine bak.${not}`;
  else if (kabul) ders = `Kararların savunulabilir aralıktaydı; ${kabul.sokak} kararında diğer seçeneği de düşün.${not}`;
  else ders = `Kararların bu varsayımlarla tutarlıydı; elin sonucu karar kalitesini değiştirmez.${not}`;

  return { kararlar: [...s.decisions], potSeyri, sonuc: r, showdown, sonucMetni, ders };
}
