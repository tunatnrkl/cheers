import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Main } from "@/components/Main";
import { Logo, Nav } from "@/components/Nav";
import { SITE_DESC, SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — Texas Hold'em alıştırma masası`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESC },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC },
  alternates: { canonical: "./" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b0e0d" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e0d" },
  ],
};

// Sayfa boyanmadan önce temayı uygular (yanıp sönmeyi önler). Varsayılan koyu: masa yeşili-siyah.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("pd-tema")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh pb-24 md:pb-0">
        <a href="#icerik" className="btn sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
          İçeriğe geç
        </a>
        <Nav />
        <Main>{children}</Main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 text-sm text-muted">
          <div className="border-t border-line pt-6">
            <div className="mb-4">
              <Logo />
            </div>
            <p>
              <strong className="text-ink">18+</strong> · {SITE_NAME} bir strateji çalışma aracıdır. Gerçek parayla oyun
              oynatmaz, bahis önermez, kazanç vaat etmez.
            </p>
            <nav aria-label="Alt bağlantılar" className="mt-2 flex flex-wrap gap-x-2">
              {[
                ["/sorumlu-oyun", "Sorumlu oyun"],
                ["/gizlilik", "Gizlilik ve KVKK"],
                ["/sozluk", "Sözlük"],
                ["/blog", "Blog"],
                ["/araclar", "Hesap makineleri"],
                ["/range", "Range matrisi"],
                ["/ogren", "Öğren"],
              ].map(([href, label]) => (
                // Kısa adlar (Blog, Öğren) için de en az 44x44 dokunma alanı
                <Link
                  key={href}
                  href={href}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-1.5 underline underline-offset-2 hover:text-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
