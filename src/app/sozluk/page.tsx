import type { Metadata } from "next";
import { GLOSSARY } from "@/data/glossary";
import { SayfaBasligi } from "@/components/ui";
import { GlossaryList } from "./GlossaryList";

export const metadata: Metadata = {
  title: "Poker Sözlüğü",
  description: `${GLOSSARY.length} poker terimi sade Türkçe ile: pot odds, equity, SPR, 3-bet, c-bet, ICM, bubble ve daha fazlası.`,
};

export default function Page() {
  // Arama motorları için yapılandırılmış veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Cheers Sözlüğü",
    inLanguage: "tr",
    hasDefinedTerm: GLOSSARY.map((g) => ({ "@type": "DefinedTerm", name: g.term, description: g.def })),
  };
  return (
    <div className="flex flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SayfaBasligi baslik="Sözlük" aciklama={`${GLOSSARY.length} terim. Sitedeki altı noktalı kelimeler buraya bağlanır.`} />
      <GlossaryList />
    </div>
  );
}
