import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Hap (chip): seçim ve filtre. Seçili durum renkle birlikte ARIA ile de bildirilir.
// rol="pressed" (varsayılan) aç/kapa düğmesi; "radio" tekli seçim grubu; "tab" sekme.

type Rol = "pressed" | "radio" | "tab";

export function hapSinifi(secili = false, kucuk = false, ekstra = "") {
  return ["chip", secili ? "chip-on" : "", kucuk ? "chip-sm" : "", ekstra].filter(Boolean).join(" ");
}

export function Hap({
  secili = false,
  rol = "pressed",
  kucuk,
  className = "",
  children,
  ...rest
}: { secili?: boolean; rol?: Rol; kucuk?: boolean; children: ReactNode } & Omit<ComponentProps<"button">, "role">) {
  const aria =
    rol === "radio"
      ? { role: "radio", "aria-checked": secili }
      : rol === "tab"
        ? { role: "tab", "aria-selected": secili }
        : { "aria-pressed": secili };
  return (
    <button type="button" className={hapSinifi(secili, kucuk, className)} {...aria} {...rest}>
      {children}
    </button>
  );
}

/** Gezinme hapı: bulunulan sayfa aria-current ile işaretlenir */
export function HapBaglanti({ secili = false, kucuk, className = "", ...rest }: { secili?: boolean; kucuk?: boolean } & ComponentProps<typeof Link>) {
  return <Link aria-current={secili ? "page" : undefined} className={hapSinifi(secili, kucuk, className)} {...rest} />;
}
