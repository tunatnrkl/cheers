import type { Metadata } from "next";
import { SayfaBasligi } from "@/components/ui";
import { Calculators } from "./Calculators";

export const metadata: Metadata = {
  title: "Poker Hesap Makineleri",
  description:
    "Pot odds ve gerekli equity, outs'tan tutma yüzdesi, efektif stack ve SPR, basit ICM hesabı. Her sonucun yanında ne anlama geldiğini açıklayan kısa not.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <SayfaBasligi baslik="Hesap makineleri" aciklama="Sayıları gir; sonucun ne anlama geldiğini hemen altında oku." />
      <Calculators />
    </div>
  );
}
