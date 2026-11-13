import type { Metadata } from "next";
import { Suspense } from "react";
import { SayfaBasligi } from "@/components/ui";
import { Profile } from "./Profile";

export const metadata: Metadata = {
  title: "Profil ve İlerleme",
  description: "Tamamlanan alıştırmalar, doğruluk oranı, kaydedilen eller ve notlar. Verilerini CSV ya da JSON olarak indir.",
  robots: { index: false },
};

export default function Page() {
  return (
    // Yer tutucu: başlık ilk boyamada görünür, footer içerik gelene kadar ekranın altında kalır (kayma yok)
    <Suspense
      fallback={
        <div className="flex min-h-[100vh] flex-col gap-6">
          <SayfaBasligi baslik="Profil" />
        </div>
      }
    >
      <Profile />
    </Suspense>
  );
}
