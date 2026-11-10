import type { Metadata } from "next";
import { Suspense } from "react";
import { HANDS } from "@/data/hands";
import { Library } from "./Library";

export const metadata: Metadata = {
  title: "El Kütüphanesi",
  description: `${HANDS.length} örnek Texas Hold'em eli: preflop ve postflop, cash game ve turnuva. Pozisyon, stack derinliği ve oyun tipine göre filtrele.`,
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">El Kütüphanesi</h1>
        <p className="lead mt-1">Bir el seç; önerilen hamleyi ve gerekçesini gör, takıldığın yeri asistana sor.</p>
      </header>
      <Suspense>
        <Library />
      </Suspense>
    </div>
  );
}
