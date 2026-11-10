"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" },
  { href: "/kutuphane", label: "Kütüphane", icon: "M5 4h5v16H5zM10 4h5v16h-5zM15.5 6.5l4-1 3 13.5-4 1z" },
  { href: "/alistirma", label: "Alıştırma", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 3.5v1" },
  { href: "/yapay-zeka", label: "Yapay Zeka", icon: "M4 5h16v11H9l-5 4zM8.5 9.5h7M8.5 12.5h4.5" },
  { href: "/profil", label: "Profil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8.5a7.5 7.5 0 0 1 15 0" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {/* Üst çubuk: masaüstünde tam menü, mobilde yalnızca logo ve tema */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="mr-auto flex min-h-11 items-center gap-2 text-lg font-bold tracking-tight">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">♠</span>
            {SITE_NAME}
          </Link>
          <nav aria-label="Ana menü" className="hidden md:flex md:gap-1">
            {ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl px-3 font-medium ${
                  active(it.href) ? "bg-soft text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Alt menü: yalnızca mobil */}
      <nav
        aria-label="Ana menü"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {ITEMS.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active(it.href) ? "text-accent" : "text-muted"
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
