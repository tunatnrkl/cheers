"use client";

import { useSearchParams } from "next/navigation";
import { useOgren } from "@/lib/ogren/depo";
import { kaynak } from "@/lib/ogren/veri";
import { pistGetir } from "@/lib/ogren/yol";
import { AnaEkran } from "./AnaEkran";
import { DersEkrani } from "./DersEkrani";
import { YolHaritasi } from "./YolHaritasi";

/**
 * /ogren içindeki üç görünüm, sorgu parametresiyle seçilir (adres değişmez):
 *   /ogren                 → pist kartları
 *   /ogren?pist=cash       → yol haritası
 *   /ogren?ders=c5-d2      → ders ekranı (tam ekran); &mod=tekrar aralıklı tekrar
 *   ?ornek=1               → örnek müfredat (yalnızca geliştirme ve deneme)
 */
export function OgrenYol() {
  const q = useSearchParams();
  const k = kaynak(q.get("ornek") === "1");
  const depo = useOgren(k.anahtar);
  const pist = pistGetir(k.dz, q.get("pist"))?.kimlik ?? null;
  const ders = q.get("ders");

  if (!depo.hazir) return <div className="h-[100vh] animate-pulse rounded-[22px] bg-surface" aria-hidden="true" />;
  if (ders) {
    const mod = q.get("mod") === "tekrar" ? "tekrar" : "ders";
    return <DersEkrani key={`${ders}/${mod}/${k.anahtar}`} k={k} depo={depo} kimlik={ders} pist={pist} mod={mod} />;
  }
  if (pist) return <YolHaritasi k={k} depo={depo} pist={pist} />;
  return <AnaEkran k={k} depo={depo} />;
}
