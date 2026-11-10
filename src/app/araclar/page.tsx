import type { Metadata } from "next";
import { Calculators } from "./Calculators";

export const metadata: Metadata = {
  title: "Poker Hesap Makineleri",
  description:
    "Pot odds ve gerekli equity, outs'tan tutma yüzdesi, efektif stack ve SPR, basit ICM hesabı. Her sonucun yanında ne anlama geldiğini açıklayan kısa not.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">Hesap makineleri</h1>
        <p className="lead mt-1">Sayıları gir; sonucun ne anlama geldiğini hemen altında oku.</p>
      </header>
      <Calculators />
    </div>
  );
}
