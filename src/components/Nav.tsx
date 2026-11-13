"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import { CheersMark } from "./brand/CheersMark";

const ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" },
  { href: "/alistirma", label: "Alıştırma", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { href: "/range", label: "Range", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/ogren", label: "Öğren", icon: "M3 7l9-4 9 4-9 4-9-4zm3 2.5V15c0 1.5 3 3 6 3s6-1.5 6-3V9.5" },
  { href: "/profil", label: "Profil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8.5a7.5 7.5 0 0 1 15 0" },
];

const LEARN = ["/ogren", "/cash", "/turnuva", "/araclar", "/sozluk", "/blog", "/yapay-zeka"];

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex min-h-11 items-center gap-2 text-ink" aria-label={`${SITE_NAME}, ana sayfa`}>
      <span className="cheers-badge grid size-10 place-items-center rounded-xl">
        <CheersMark className="size-9 transition-transform duration-300 group-hover:-rotate-3" />
      </span>
      <span className="font-display text-[24px] leading-none font-bold italic">{SITE_NAME}</span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : href === "/ogren" ? LEARN.some((p) => path.startsWith(p)) : path.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-2 px-4">
          <div className="mr-auto">
            <Logo />
          </div>
          <nav aria-label="Ana menü" className="hidden md:flex md:gap-1">
            {ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3.5 text-[15px] font-semibold transition ${
                  active(it.href) ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <Link href="/alistirma" className="btn btn-primary ml-2 hidden lg:inline-flex">
            Alıştırmaya başla
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Ana menü"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {ITEMS.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={`flex min-h-15 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active(it.href) ? "text-accent-text" : "text-muted"
                }`}
              >
                <Icon d={it.icon} />
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
