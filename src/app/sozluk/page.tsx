import type { Metadata } from "next";
import { GLOSSARY } from "@/data/glossary";
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
    name: "Poker Defteri Sözlüğü",
    inLanguage: "tr",
    hasDefinedTerm: GLOSSARY.map((g) => ({ "@type": "DefinedTerm", name: g.term, description: g.def })),
  };
  return (
    <div className="flex flex-col gap-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header>
        <h1 className="h1">Sözlük</h1>
        <p className="lead mt-1">{GLOSSARY.length} terim. Sitedeki altı noktalı kelimeler buraya bağlanır.</p>
      </header>
      <GlossaryList />
    </div>
  );
}
