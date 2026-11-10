"use client";

import { usePathname } from "next/navigation";

/** Sayfa kabı. Alıştırma masası geniş ve kenarlara yakın, diğer sayfalar okunur genişlikte. */
export function Main({ children }: { children: React.ReactNode }) {
  const wide = usePathname().startsWith("/alistirma");
  return (
    <main
      id="icerik"
      className={wide ? "mx-auto w-full max-w-[1440px] px-2 py-2 sm:px-4 sm:py-4" : "mx-auto w-full max-w-6xl px-4 py-6 sm:py-10"}
    >
      {children}
    </main>
  );
}
