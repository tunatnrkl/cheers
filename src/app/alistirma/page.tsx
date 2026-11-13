import type { Metadata } from "next";
import { Suspense } from "react";
import { HANDS } from "@/data/hands";
import { Trainer } from "./Trainer";

export const metadata: Metadata = {
  title: "Alıştırma Masası",
  description: `${HANDS.length} Texas Hold'em spotu masada: aksiyonları gör, eli sonuna kadar oyna, takıldığın yeri koça sor. Cash game ve turnuva.`,
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Alıştırma masası</h1>
      <Suspense fallback={<div className="h-[60dvh] animate-pulse rounded-2xl bg-[#0d1110]" />}>
        <Trainer />
      </Suspense>
    </>
  );
}
