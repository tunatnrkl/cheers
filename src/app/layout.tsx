import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SITE_DESC, SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — Texas Hold'em çalışma sitesi`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE_NAME, description: SITE_DESC },
  alternates: { canonical: "./" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#101513" },
  ],
};

// Sayfa boyanmadan önce temayı uygular (yanıp sönmeyi önler).
const themeScript = `try{var t=localStorage.getItem("pd-tema");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh pb-24 md:pb-0">
        <a href="#icerik" className="btn sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
          İçeriğe geç
        </a>
        <Nav />
        <main id="icerik" className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-8 pt-4 text-sm text-muted">
          <div className="border-t border-line pt-4">
            <p>
              <strong className="text-ink">18+</strong> · {SITE_NAME} bir strateji çalışma aracıdır. Gerçek parayla oyun
              oynatmaz, bahis önermez, kazanç vaat etmez.
            </p>
            <nav aria-label="Alt bağlantılar" className="mt-2 flex flex-wrap gap-x-4">
              {[
                ["/sorumlu-oyun", "Sorumlu oyun"],
                ["/gizlilik", "Gizlilik ve KVKK"],
                ["/sozluk", "Sözlük"],
                ["/blog", "Blog"],
                ["/araclar", "Hesap makineleri"],
                ["/range", "Range matrisi"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="inline-flex min-h-11 items-center underline underline-offset-2">
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
