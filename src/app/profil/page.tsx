import type { Metadata } from "next";
import { Suspense } from "react";
import { Profile } from "./Profile";

export const metadata: Metadata = {
  title: "Profil ve İlerleme",
  description: "Tamamlanan alıştırmalar, doğruluk oranı, kaydedilen eller ve notlar. Verilerini CSV ya da JSON olarak indir.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
