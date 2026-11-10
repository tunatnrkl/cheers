import type { Metadata } from "next";
import { Suspense } from "react";
import { HANDS } from "@/data/hands";
import { Trainer } from "./Trainer";

export const metadata: Metadata = {
  title: "Alıştırma Masası",
  description: `${HANDS.length} Texas Hold'em spotu masada: aksiyonları gör, hamleni seç, takıldığın yeri yapay zeka koçuna sor. Cash game ve turnuva.`,
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Alıştırma masası</h1>
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-2xl bg-[#0d1110]" />}>
        <Trainer />
      </Suspense>
    </>
  );
}
